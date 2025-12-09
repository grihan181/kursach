# Kursach Delivery (skeleton)

Минимальный каркас микросервисов для сервиса международной доставки. Цель — собрать рабочий стенд через одну команду Helm, с BFF (Express), Orders (FastAPI), Chat (NestJS) и фронтендом (Next.js). Kafka и Postgres поднимаются зависимостями чарта.

> Auth-сервис: добавлен лёгкий stub на Node.js в `services/auth` (JWT HMAC). Для продакшена замените на свой Kotlin-сервис и образ.

## Сервисы
- **BFF (TypeScript/Express)** — проксирует `/api/auth`, `/api/orders`, `/api/chat`, валидирует JWT, пробрасывает `X-User-Id`, умеет проксировать socket.io для чата.
- **Orders (FastAPI)** — CRUD заказов, смена статуса, события в Kafka (`order.created`, `order.status.changed`, `order.status.update`), Postgres.
- **Chat (NestJS)** — REST история сообщений `/chat/{orderId}/messages`, socket.io namespace `/chat` (path `/api/chat/socket.io`) с событиями `join`, `sendMessage`.
- **Frontend (Next.js)** — страницы заказов/чата, ходит в BFF `/api/*`, подключается к socket.io.

## Локальный запуск (dev)
- BFF: `npm install && npm run dev` (порт 3000, env: `AUTH_SERVICE_URL`, `ORDERS_SERVICE_URL`, `CHAT_SERVICE_URL`, `JWT_SECRET`).
- Orders: `pip install -r requirements.txt && uvicorn app.main:app --reload --port 8080` (env см. `app/config.py`: `APP_DATABASE_URL` или `DB_*`, `APP_KAFKA_BOOTSTRAP_SERVERS`, `APP_JWT_SECRET`).
- Chat: `cd services/chat && npm install && npm run start:dev` (env: `DB_HOST/DB_PORT/...`, `KAFKA_BROKERS`).
- Frontend: `cd frontend && npm install && npm run dev` (env: `NEXT_PUBLIC_BFF_URL`, `NEXT_PUBLIC_CHAT_SOCKET_URL`).

## Docker
- BFF: `docker build -t <registry>/bff:tag .`
- Orders: `docker build -t <registry>/orders:tag ./app`
- Chat: `docker build -t <registry>/chat:tag services/chat`
- Frontend: `docker build -t <registry>/frontend:tag frontend`
- Auth stub: `docker build -t <registry>/auth:tag services/auth` (замените на свой прод-образ).

## Helm (одна команда)
Umbrella-chart: `deploy/helm/delivery`.
1. `helm dependency update deploy/helm/delivery`
2. В `deploy/helm/delivery/values.yaml` проставить реальные образы: `auth.image`, `orders.image`, `chat.image`, `bff.image`, `frontend.image`. Kafka топики уже заданы.
3. Установить:  
   `helm upgrade --install delivery ./deploy/helm/delivery -f deploy/helm/delivery/values.yaml`

Ingress по умолчанию шлёт `/api` на BFF (порт 3000) и `/` на фронт (порт 8080). Kafka bootstrap по умолчанию `<release>-kafka:9092`, Postgres — `<release>-{service}-postgres`.

## Smoke-тест
Инструкции и скрипт: `docs/smoke.md`, `scripts/smoke.sh`. Требуется рабочий Auth-сервис для получения JWT. Сквозной сценарий: register/login → create order → set status → send chat message → проверить socket.io `/api/chat/socket.io` namespace `/chat`.
