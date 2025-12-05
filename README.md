# Kursach frontend

Next.js + TypeScript витрина с потоками авторизации через BFF, списком/деталями заказов и WebSocket чатом.

## Запуск разработки

```bash
cd frontend
npm install
npm run dev
```

Переменные окружения:

- `NEXT_PUBLIC_BFF_URL` — HTTP эндпоинт BFF (cookie или bearer проксируются из клиента).
- `NEXT_PUBLIC_WS_URL` — WebSocket адрес для чата.

## Docker

Сборка образа:

```bash
docker build -t kursach-frontend .
```

Запуск:

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_BFF_URL=http://localhost:4000 -e NEXT_PUBLIC_WS_URL=ws://localhost:4000/ws kursach-frontend
```

## Helm

Подчарт лежит в `helm/frontend` и разворачивает Deployment, Service и Ingress.

```bash
helm install kursach-frontend ./helm/frontend \
  --set image.repository=myregistry/kursach-frontend \
  --set image.tag=latest \
  --set env.bffUrl=http://bff:4000 \
  --set env.wsUrl=ws://bff:4000/ws
```
