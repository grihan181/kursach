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
# Order Service

FastAPI microservice providing CRUD operations for orders and order items with Kafka eventing, JWT authorization, metrics, health checks, and Helm deployment assets.

## Features
- Order/OrderItem models with CRUD endpoints and status transitions.
- JWT-based authentication with role validation (user/admin).
- Kafka producer for `order.created` and `order.status.changed` events plus consumer for status updates.
- Health check, Prometheus metrics, and OpenTelemetry tracing hooks.
- Dockerfile and Helm subchart including PostgreSQL dependency and Kafka configuration env values.

## Running locally
1. Install dependencies: `pip install -r requirements.txt`.
2. Configure environment variables (see `app/config.py` for defaults).
3. Start service: `uvicorn app.main:app --reload`.
4. Access docs at `/docs`.

## Helm chart
Chart is located under `charts/order-service` and includes a Bitnami PostgreSQL dependency. Override `env` values for Kafka and JWT secrets as needed.
# Kursach frontend

Next.js + TypeScript витрина с потоками авторизации через BFF, списком/деталями заказов и WebSocket чатом.

## Запуск разработки

```bash
cd frontend
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
# kursach

This repository contains an umbrella Helm chart that provisions Kafka or connects
to an external broker and shares connection settings with dependent services.

## Features
- Bitnami Kafka dependency that can be enabled or disabled via `kafka.enabled`.
- ConfigMap exposing Kafka bootstrap servers for workloads.
- Optional Secret for SASL credentials.
- Post-install/upgrade job that creates required topics: `order.events`,
  `chat.notifications`, and `notifications.outbound`.

## Usage
1. Pull the Kafka dependency:
   ```bash
   helm dependency update charts/umbrella
   ```
2. Install with an internal broker:
   ```bash
   helm install my-release charts/umbrella
   ```
3. Install using an external broker:
   ```bash
   helm install my-release charts/umbrella \
     --set global.kafka.external.enabled=true \
     --set global.kafka.external.bootstrapServers=my-kafka:9092 \
     --set global.kafka.auth.enabled=true \
     --set global.kafka.auth.username=user \
     --set global.kafka.auth.password=pass
   ```
# kursach Helm assets

Umbrella Helm chart that provisions dedicated PostgreSQL instances for the **Auth**, **Orders**, and **Chat** services, along with an optional Redis cache/session store and migration jobs triggered as Helm hooks.

## Contents
- `helm/kursach/Chart.yaml` — defines dependencies on Bitnami PostgreSQL (three aliases) and optional Redis.
- `helm/kursach/values.yaml` — default credentials, persistence sizing, StorageClass choices, and migration job definitions.
- `helm/kursach/templates/` — renders Secrets for credentials and hook-based migration Jobs with pod-level overrides.

## Usage
1. Add the Bitnami repository (only needed at install time):
   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm dependency update helm/kursach
   ```
2. Override any secrets, storage classes, or image references in a custom values file to avoid committing real credentials.
   You can also toggle migrations via `migrations.enabled`, adjust their backoff/TTL, and supply service account, node
   scheduling, or extra environment variables for each job.
3. Install or upgrade:
   ```bash
   helm upgrade --install platform helm/kursach -f my-values.yaml
   ```

The chart creates three separate PostgreSQL releases (one per service), an optional Redis release for sessions/cache, stores credentials in Kubernetes Secrets, and runs post-install/upgrade Jobs for database migrations.
# Kursach Delivery Microservices Skeleton

Этот репозиторий содержит каркас микросервисного приложения для сервиса международной доставки. Основная цель — развёртывание всех компонентов одной командой через umbrella Helm chart с включенными зависимостями (Kafka, Postgres, Redis) и сервисами (Auth, Orders, Chat, BFF, Frontend).

## Архитектура (минимальный функционал)
- **Auth (Kotlin/Spring Boot, Postgres)**: регистрация, логин, refresh, JWT с ролями user/admin.
- **Orders (Kotlin/Spring Boot, Postgres, Kafka)**: CRUD заказов, смена статуса, публикация событий.
- **Chat (Node.js/NestJS, Postgres, WebSocket, Kafka)**: комнаты по заказам, история + realtime.
- **BFF (NestJS)**: маршруты `/auth/*`, `/orders/*`, `/chat/*`, валидация JWT, прокси к сервисам.
- **Frontend (Next.js)**: UI для входа, заказов, деталей, чата.
- **Infrastructure**: Kafka с топиками `order.events`, `chat.notifications`, `notifications.outbound`; Postgres по сервисам; Redis опционально.

## Развёртывание одной командой
Umbrella Helm chart находится в `deploy/helm/delivery`. Пример установки после сборки образов (Kafka топики создаются pre-install Job’ом `kafka-create-topics`):

```bash
helm upgrade --install delivery ./deploy/helm/delivery -f deploy/helm/delivery/values.yaml
```

### Предусловия
- Kubernetes кластер с ingress-контроллером и storage class.
- Установлены `kubectl` и `helm` на рабочей машине.
- Образы сервисов собраны и доступны кластеру (через реестр или `imagePullSecrets`).

### Ключевые настройки чарта
- Kafka bootstrap по умолчанию берётся как `<release>-kafka:9092`; при необходимости задайте `kafka.bootstrap` или `orders/chat.kafkaBootstrap`.
- Для Auth/Orders/Chat создаются секреты `auth-db`, `orders-db`, `chat-db` с логином/паролем из `values.yaml`; хост БД по умолчанию `<release>-<service>-postgres`.
- Ingress маршрутизирует `/api` на BFF и `/` на Frontend; задайте домен через `global.ingressHost` и включите TLS при необходимости.

### Минимальный сквозной поток (smoke)
1. Зарегистрировать пользователя и получить токен в Auth через BFF `/api/auth/register` → `/api/auth/login`.
2. Создать заказ через BFF `/api/orders` и получить статус `draft/created`.
3. Отправить сообщение в чат по заказу через BFF `/api/chat/{orderId}/messages` и убедиться, что WebSocket событие доставлено.

Сценарий smoke-теста описан в `docs/smoke.md`.

## Структура репозитория
- `services/auth`, `services/orders`, `services/chat`, `services/bff`: каркасы микросервисов.
- `frontend`: каркас фронтенда.
- `deploy/helm/delivery`: umbrella Helm chart, включающий зависимости и ingress.
- `docs`: документация по проверкам и развёртыванию.
- `scripts`: утилиты (например, smoke-тест после установки).

## Следующие шаги по реализации
1. Написать сервисы и Dockerfile в соответствующих каталогах.
2. Настроить chart values (образы, переменные окружения), init Job’ы для миграций и Kafka топиков.
3. Собрать образы, задать хост для ingress и выполнить команду установки.
