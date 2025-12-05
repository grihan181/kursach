# kursach BFF

Backend-for-frontend proxy that exposes `/api/auth`, `/api/orders`, and `/api/chat` routes and forwards them to dedicated services.

## Configuration

Environment variables:

- `PORT` (default `3000`)
- `API_PREFIX` (default `/api`)
- `AUTH_SERVICE_URL`
- `ORDERS_SERVICE_URL`
- `CHAT_SERVICE_URL`
- `JWT_SECRET` – HMAC secret for validating incoming JWTs.
- `HTTP_TIMEOUT_MS` (default `5000`)
- `HTTP_RETRY_COUNT` (default `2`)

## Running locally

```bash
npm install
npm run dev
```

Requests to `/api/orders/*` and `/api/chat/*` require a bearer token with `sub` (or `userId`) and optional `role` (`user`|`admin`). The BFF validates the token, injects `X-User-Id`, and forwards the original request.

Health and metrics endpoints:

- `GET /healthz`
- `GET /metrics`

## Docker

```bash
docker build -t bff:latest .
docker run -p 3000:3000 \
  -e AUTH_SERVICE_URL=http://auth:8080 \
  -e ORDERS_SERVICE_URL=http://orders:8080 \
  -e CHAT_SERVICE_URL=http://chat:8080 \
  -e JWT_SECRET=secret bff:latest
```

## Helm chart

A sub-chart is available under `charts/bff` with configurable image, env values, probes, and optional ingress routing under `/api`.
