import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import client from 'prom-client';
import { loadConfig } from './config.js';
import { createHttpClient } from './httpClient.js';
import { jwtGuard, RequestWithUser } from './middleware/jwtGuard.js';

const config = loadConfig();
const httpClient = createHttpClient(config);

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

app.get('/healthz', async (_req, res) => {
  try {
    await httpClient.get(`${config.authServiceUrl}/healthz`);
    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(503).json({ status: 'degraded', error: (error as Error).message });
  }
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});

// Агрегированный эндпоинт: профиль + заказы
app.get(
  `${config.apiPrefix}/dashboard`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  async (req: RequestWithUser, res) => {
    try {
      const authHeader = req.headers.authorization;
      const userPromise = httpClient.get(`${config.authServiceUrl}/auth/me`, {
        headers: authHeader ? { Authorization: authHeader } : undefined
      });
      const ordersPromise = httpClient.get(`${config.ordersServiceUrl}/orders`, {
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {}),
          ...(req.user?.id ? { 'X-User-Id': req.user.id } : {}),
          ...(req.user?.role ? { 'X-User-Role': req.user.role } : {}),
          ...(req.user?.email ? { 'X-User-Email': req.user.email } : {})
        }
      });

      const [userResp, ordersResp] = await Promise.all([userPromise, ordersPromise]);
      return res.json({
        user: userResp.data,
        orders: ordersResp.data
      });
    } catch (error) {
      console.error('Dashboard aggregation failed', error);
      return res.status(502).json({ message: 'Failed to aggregate data' });
    }
  }
);

// Decode JWT early and pass user id downstream via header
app.use(config.apiPrefix, (req: RequestWithUser, _res, next) => {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
  if (bearer) {
    try {
      const payload = jwt.verify(bearer, config.jwtSecret) as jwt.JwtPayload;
      const userId = (payload.sub as string) ?? (payload.userId as string);
      if (userId) {
        const role = (payload.role as any) ?? 'user';
        req.headers['x-user-id'] = userId;
        req.headers['x-user-role'] = role;
        if (payload.email) {
          req.headers['x-user-email'] = String(payload.email);
        }
        req.user = { id: userId, role, email: (payload.email as string) ?? undefined };
      }
    } catch {
      // ignore decode errors; jwtGuard on protected routes will handle auth
    }
  }
  next();
});

const proxyCommonOptions = {
  changeOrigin: true,
  logLevel: 'debug' as const,
  onProxyReq: (proxyReq: any, req: RequestWithUser) => {
    let userId: string | undefined = req.user?.id;
    if (!userId) {
      const authHeader = req.headers.authorization;
      const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
      if (bearer) {
        try {
          const payload = jwt.verify(bearer, config.jwtSecret) as jwt.JwtPayload;
          userId = (payload.sub as string) ?? (payload.userId as string);
          const role = (payload.role as any) ?? 'user';
          if (userId) {
            req.user = { id: userId, role };
          }
        } catch {
          // ignore decoding errors here; jwtGuard handles auth
        }
      }
    }
    if (userId) {
      proxyReq.setHeader('X-User-Id', userId);
    }
    const role = req.user?.role;
    if (role) {
      proxyReq.setHeader('X-User-Role', role);
    }
    if (req.user?.email) {
      proxyReq.setHeader('X-User-Email', req.user.email);
    }
  },
  proxyTimeout: config.httpTimeoutMs
};

const prefixPath = (base: string) => (_path: string, req: express.Request) =>
  req.url === '/' ? base : `${base}${req.url}`;

app.use(
  `${config.apiPrefix}/auth/admin`,
  jwtGuard(config.jwtSecret, ['admin']),
  createProxyMiddleware({
    target: config.authServiceUrl,
    pathRewrite: prefixPath('/auth/admin'),
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/auth`,
  createProxyMiddleware({
    target: config.authServiceUrl,
    pathRewrite: prefixPath('/auth'),
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/orders`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.ordersServiceUrl,
    pathRewrite: prefixPath('/orders'),
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/chat`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.chatServiceUrl,
    ws: true,
    pathRewrite: (path: string, req: express.Request) => {
      if (path.includes('/socket.io')) {
        return path.replace(/^\/api\/chat/, '/chat');
      }
      // Для REST оставляем префикс /api/chat как в сервисе
      const suffix = req.url.replace(/^\/api\/chat/, '');
      return `/api/chat${suffix}`;
    },
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/pricing`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.pricingServiceUrl,
    pathRewrite: (path: string) => {
      const rewritten = path.replace(/^\/api\/pricing/, '');
      return rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
    },
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/notifications`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.notificationsServiceUrl,
    pathRewrite: prefixPath('/notifications'),
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/warehouses`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.ordersServiceUrl,
    pathRewrite: prefixPath('/warehouses'),
    ...proxyCommonOptions
  })
);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`BFF server listening on port ${config.port}`);
});

