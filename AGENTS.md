# Изначально запрос был такой:
Сначала создавай план изменений без кода.
Когда я напишу "применяй" — только тогда генерируй код.

Мне для курсача нужно написать микросервисное приложение, на разных языках, где микросервисы будут взаимодействовать между собой через Кафку и через апи, в зависимости от функциональности + нужен фронт, возможно при необходимости использовать BFF паттерн. Один из языков Котлин, другой на твое усмотрение. Надо чтобы все Билли лось в докер образы и развертывалось через кубер одной командой, которой ты объяснишь что и как делать. Надо чтобы где сервисы общаются между собой, все шло через дисковери, которым выступает кубер

Программа должна быть рабочей: это сервис доставок из-за рубежа, должнн быть создание заказов, авторизация, чат и может быть ты еще что-то придумаешь
Надо сделать так чтобы все запускалось одной командой
# Ты себе сделал план:
Архитектура и технологии
Микросервисы (Kubernetes, discovery через K8s DNS + сервисы/ingress):

Auth (Kotlin + Spring Boot) — JWT, refresh, roles.

Orders (Kotlin + Spring Boot) — создание/обновление заказов, статусы, тарифы, маршруты.

Chat (Node.js + NestJS/Express) — WebSocket + REST, хранение сообщений, интеграция с Kafka для асинхронных нотификаций.

Notifications (Node.js/Python) — потребитель Kafka, пуш/email/webhook.

Pricing/Quotes (опционально Go) — расчёт стоимости доставки, кеширование, публикация цен в Kafka.

BFF (Node.js + NestJS/Express) — агрегирующий API/GraphQL для фронта, пробрасывает auth, ходит в остальные сервисы по HTTP/K8s DNS.

Frontend (React/Next.js) — UI: логин/регистрация, создание заказа, трекинг, чат.

Интеграции и коммуникации:

Синхронно: REST/gRPC через K8s service DNS.

Асинхронно: Kafka topics (order.events, quote.events, chat.notifications, notifications.outbound).

Persistence: Postgres для Auth/Orders/Chat; Redis для сессий/кеша; MinIO/S3 для вложений в чат (опционально).

Observability: Prometheus/Grafana, OpenTelemetry tracing, Loki/ELK (опционально).

Развёртывание:

Docker образы для всех сервисов.

Helm chart или Kustomize для деплоя в Kubernetes (одна команда helm install или kubectl apply -k).

Skaffold (опционально) для dev-loop.

План по сервисам и функционалу
1) Auth (Kotlin, Spring Boot, Postgres)

Регистрация, логин, refresh токены, роли (user/admin).

JWT в заголовках; валидация в BFF и downstream сервисах.

Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/me.

2) Orders (Kotlin, Spring Boot, Postgres, Kafka)

CRUD заказов, статусы (draft/paid/shipping/delivered/cancelled).

Публикация событий в Kafka (order.created, order.status.changed).

Интеграция с Pricing (запрос котировок), с Notifications через Kafka.

Endpoints: /orders (list/create), /orders/{id} (get/update status).

3) Chat (Node.js + NestJS/Express, Postgres, WebSocket, Kafka)

Комнаты: заказ ↔ оператор/бот.

WebSocket для реального времени; REST для истории.

Kafka для уведомлений/архивации/триггеров нотификаций.

4) Notifications (Node.js или Python FastAPI)

Слушает Kafka темы, отправляет email/push/webhook.

Шаблоны уведомлений, дедупликация, ретраи.

5) Pricing/Quotes (Go опционально)

Расчёт стоимости доставки по параметрам, кэширование.

Публикует quote.events; Orders дергает синхронно и слушает обновления.

6) BFF (Node.js + NestJS/Express, GraphQL/REST)

Агрегирующий слой для фронта; пробрасывает JWT.

Общается с Auth/Orders/Chat/Pricing по сервисным DNS именам.

7) Frontend (React/Next.js)

Страницы: логин/регистрация, список заказов, создание заказа, трекинг статуса, чат.

Интеграция с BFF API/WebSocket.

Инфраструктура и платформа
8) Kafka + Zookeeper/Redpanda

Брокер(ы), topic creation (order.events, quote.events, chat.notifications, notifications.outbound).

9) Postgres/Redis/MinIO

Отдельные инстансы/базы на сервис.

Предлагаемая задача
Stateful сервисы

Развёртывание одной командой
Вариант 1: Helm umbrella chart deploy/helm/ с зависимостями (сервисы + инфраструктура). Команда: helm install delivery ./deploy/helm -f values.yaml.

Вариант 2: Kustomize kubectl apply -k deploy/kustomize.

Skaffold профиль для локальной разработки.



# Repository Guidelines
Говори по русски

Сначала создавай план изменений без кода.
Когда я напишу "применяй" — только тогда генерируй код.

## Project Structure & Module Organization
- `src/` — TypeScript BFF (Express proxy) with config in `config.ts` and JWT guard in `middleware/`.
- `app/` — FastAPI orders service skeleton using SQLAlchemy and Kafka hooks.
- `services/chat/` — NestJS chat service (TypeORM entities, WebSocket gateway, Helm subchart, Dockerfile).
- `frontend/` — Next.js app; UI in `src/components/`, API clients in `src/services/`.
- Charts: `charts/*` and `helm/*` hold subcharts for BFF, frontend, and order-service; umbrella install in `deploy/helm/delivery/`. Smoke checks live in `docs/smoke.md` and `scripts/smoke.sh`.

## Build, Test, and Development Commands
- BFF: `npm install`, `npm run dev` (ts-node), or `npm run build && npm start` (from `dist/`).
- Orders: `pip install -r requirements.txt` then `uvicorn app.main:app --reload`.
- Chat: from `services/chat`, `npm install`, `npm run start:dev`, or `npm run build && npm start`.
- Frontend: `cd frontend && npm install && npm run dev`; production via `npm run build && npm start`.
- Helm: `helm dependency update deploy/helm/delivery` then `helm upgrade --install delivery ./deploy/helm/delivery -f deploy/helm/delivery/values.yaml`.

## Coding Style & Naming Conventions
- TypeScript: ES modules, strict mode, 2-space indent. Keep proxy middleware small; prefer typed helpers over `any`.
- NestJS chat: run `npm run lint` and `npm run format`; PascalCase classes, camelCase members.
- FastAPI: type functions, keep Pydantic models in `app/schemas.py`; avoid hardcoded secrets or creds in defaults.
- Next.js: `npm run lint` before commit; co-locate logic with components and keep API calls in `frontend/src/services/`.

## Testing Guidelines
- Add tests near code (Jest + supertest for BFF/Chat, pytest for FastAPI, React Testing Library for UI) using `*.spec.ts` or `test_*.py`.
- Run the smoke path (`docs/smoke.md` or `HOST=... scripts/smoke.sh`) after Helm installs to confirm auth → orders → chat flow.
- Cover JWT enforcement, forwarded headers (`X-User-Id`), and basic error handling before broader end-to-end cases.

## Commit & Pull Request Guidelines
- Commits: imperative, scoped, e.g., `feat: proxy chat websockets`, `fix: enforce jwt roles`.
- PRs: describe change + rationale, include verification steps (commands or curl), list env vars/Helm values touched, and add screenshots for UI work. Link issues where relevant.
- Update docs (`README.md`, Helm values, smoke instructions) when behavior or configuration shifts; keep secrets and real credentials out of the repo.
