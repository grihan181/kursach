import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import client from 'prom-client';
import { loadConfig } from './config.js';
import { createHttpClient } from './httpClient.js';
import { jwtGuard, RequestWithUser } from './middleware/jwtGuard.js';

const config = loadConfig();
const httpClient = createHttpClient(config);

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

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

const proxyCommonOptions = {
  changeOrigin: true,
  pathRewrite: (path: string) => path.replace(new RegExp(`^${config.apiPrefix}`), ''),
  onProxyReq: (proxyReq: any, req: RequestWithUser) => {
    if (req.user?.id) {
      proxyReq.setHeader('X-User-Id', req.user.id);
    }
  },
  proxyTimeout: config.httpTimeoutMs
};

app.use(
  `${config.apiPrefix}/auth`,
  createProxyMiddleware({
    target: config.authServiceUrl,
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/orders`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.ordersServiceUrl,
    ...proxyCommonOptions
  })
);

app.use(
  `${config.apiPrefix}/chat`,
  jwtGuard(config.jwtSecret, ['user', 'admin']),
  createProxyMiddleware({
    target: config.chatServiceUrl,
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
