# Delivery-test

Минимальный каркас микросервисов для сервиса международной доставки. Цель — собрать рабочий стенд через одну команду Helm, с BFF (Express), Orders (FastAPI), Chat (NestJS) и фронтендом (Next.js). Kafka и Postgres поднимаются зависимостями чарта.

> Auth-сервис: добавлен лёгкий stub на Node.js в `services/auth` (JWT HMAC). Для продакшена замените на свой Kotlin-сервис и образ.

## Сервисы
- **BFF (TypeScript/Express)** - проксирует `/api/auth`, `/api/orders`, `/api/chat`, валидирует JWT, пробрасывает `X-User-Id`, умеет проксировать socket.io для чата.
- **Orders (Spring Boot/Java)** - CRUD заказов, валидация направлений/габаритов, события в Kafka (`order.created`, `order.status.changed`), Postgres, таймлайн этапов доставки.
  Каждый заказ получает человекочитаемый номер вида `test_delivery-123`, который прокидывается во все ответы/события.
- **Chat (NestJS)** - REST история сообщений `/chat/{orderId}/messages`, socket.io namespace `/chat` (path `/api/chat/socket.io`) с событиями `join`, `sendMessage`.
- **Notifications (Node.js)** - слушает Kafka-темы (`chat.notifications`, `order.status.changed`), транслирует payload в `notifications.outbound`, опционально шлёт webhook и письма (SMTP/env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `NOTIFICATIONS_EMAIL_FROM`, `NOTIFICATIONS_EMAIL_TO`, `AUTH_SERVICE_URL`, `AUTH_INTERNAL_TOKEN`).
- **Telegram Bot (Python)** - сервис `services/bot` на `python-telegram-bot`, принимает команды `/login`, `/orders`, `/logout`, хранит сессии, слушает Kafka (`order.status.changed`, `order.stage.changed`) и отправляет уведомления пользователям.
- **Payments (Spring Boot/Java)** - простая HTML-страница оплаты: вводим любую карту, после подтверждения сервис вызывает Orders и переводит заказ в статус `paid` (ничего не списывается).
- **Frontend (Next.js)** - страницы заказов/чата, ходит в BFF `/api/*`, подключается к socket.io.

## Локальный запуск (dev)
- BFF: `npm install && npm run dev` (порт 3000, env: `AUTH_SERVICE_URL`, `ORDERS_SERVICE_URL`, `CHAT_SERVICE_URL`, `JWT_SECRET`).
- Orders: `cd services/orders && ./gradlew bootRun` (порт 8080, env: `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`, `KAFKA_BROKERS`, `ORDERS_TOPIC_CREATED`, `ORDERS_TOPIC_STATUS_CHANGED`, `PRICING_URL`).
- Chat: `cd services/chat && npm install && npm run start:dev` (env: `DB_HOST/DB_PORT/...`, `KAFKA_BROKERS`).
- Notifications: `cd services/notifications && npm install && npm run start` (SMTP env см. раздел "Notifications").
- Frontend: `cd frontend && npm install && npm run dev` (env: `NEXT_PUBLIC_BFF_URL`, `NEXT_PUBLIC_CHAT_SOCKET_URL`).

## Docker
- BFF: `docker build -t <registry>/bff:tag .`
- Orders: `docker build -t <registry>/orders:tag services/orders`
- Notifications: `docker build -t <registry>/notifications:tag services/notifications`
- Chat: `docker build -t <registry>/chat:tag services/chat`
- Frontend: `docker build -t <registry>/frontend:tag frontend`
- Auth: `docker build -t <registry>/auth:tag services/auth`
- Telegram Bot: `docker build -t <registry>/bot:tag services/bot`
- Payments: `docker build -t <registry>/payments:tag services/payments`

## Helm (одна команда)
Umbrella-chart: `deploy/helm/delivery`.
1. `helm dependency update deploy/helm/delivery`
2. В `deploy/helm/delivery/values.yaml` проставить реальные образы: `auth.image`, `orders.image`, `chat.image`, `bff.image`, `frontend.image`. Kafka топики уже заданы.
3. Установить:  
   `helm upgrade --install delivery ./deploy/helm/delivery -f deploy/helm/delivery/values.yaml`

Ingress по умолчанию шлёт `/api` на BFF (порт 3000) и `/` на фронт (порт 8080). Kafka bootstrap по умолчанию `<release>-kafka:9092`, Postgres — `<release>-{service}-postgres`.

## Smoke-тест
Инструкции и скрипт: `docs/smoke.md`, `scripts/smoke.sh`. Требуется рабочий Auth-сервис для получения JWT. Сквозной сценарий: register/login -> create order -> set status -> send chat message -> проверить socket.io `/api/chat/socket.io` namespace `/chat`.

## Телеграм-бот
1. Создайте токен у [BotFather](https://t.me/BotFather) и пропишите его в `.env` (`TELEGRAM_BOT_TOKEN=<token>`). При необходимости можно переопределить `BOT_SESSION_FILE` (файл сессий, по умолчанию `/data/sessions.json`) и список топиков `BOT_KAFKA_TOPICS` (по умолчанию `order.status.changed,order.stage.changed`).
2. Запустите стек: `docker compose up --build`. Бот соберётся из `services/bot`, получит доступ к Kafka, Auth и BFF, будет хранить сессии в volume `bot-data`. Можно запустить отдельно: `docker compose up bot`.
3. В Telegram: `/start` показывает справку, `/login email пароль` авторизует пользователя (используются учётки Auth-сервиса), `/orders` выводит его заказы из BFF, `/logout` сбрасывает сессию. После входа бот автоматически шлёт уведомления при смене статуса заказа и добавлении этапов.
4. При изменении payloads Orders публикует `userEmail`, поэтому уведомления отправляются на корректный адрес и к нужному пользователю. При обновлении схема токена убедитесь, что пользователи перелогинились, чтобы токен содержал `email`.

## Оплата (заглушка)
- Эндпоинт `http://localhost:8085/payments/{orderId}` открывает HTML-форму. Сервис подтягивает информацию о заказе через Orders API (как админ) и показывает маршрут/сумму.
- После ввода произвольных реквизитов форма отправляет POST на тот же адрес. `payments` вызывает `POST /orders/{id}/status` и присваивает статус `paid`, не списывая средства.
- По завершении отображается экран успешной оплаты. При ошибках (не найден заказ, Orders недоступен) пользователь увидит описание причины.
- Фронтенд использует `NEXT_PUBLIC_PAYMENTS_URL` (по умолчанию `http://localhost:8085`) для формирования ссылки «Оплатить заказ» на странице заказа.
- Сервис `payments` перенаправляет пользователей обратно в приложение по `FRONTEND_URL` (по умолчанию `http://localhost`). Поменяйте эту переменную, если фронт работает на другом домене.








## Почтовые уведомления
1. В `.env` задайте SMTP-параметры. Для Gmail подходит конфигурация:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=you@gmail.com
   SMTP_PASS=<app-password>
   NOTIFICATIONS_EMAIL_FROM=delivery-test <you@gmail.com>
   ```
   Gmail требует включить двухфакторную аутентификацию и создать App Password — его значение прописываем в `SMTP_PASS`.
2. Если нужно отправлять копию в поддержку, заполните `NOTIFICATIONS_EMAIL_TO=support@company.ru,cto@company.ru`.
3. Notifications-процесс сначала пытается взять `userEmail` из события Orders, затем обращается к Auth (`AUTH_SERVICE_URL` + `AUTH_INTERNAL_TOKEN`), и только после этого использует `NOTIFICATIONS_EMAIL_TO`. Поэтому важно, чтобы профили пользователей содержали корректные адреса.
4. При старте сервис выводит результат `SMTP verify`. Если переменные не заданы, письма отключены, но обработка Kafka сообщений и вебхуков продолжится.
