# Полное руководство по delivery-test


Этот документ объясняет, как устроен проект delivery-test и зачем нужны все его части.

## 1. Общая идея
delivery-test имитирует сервис международной доставки. Он состоит из фронтенда, BFF и набора микросервисов, которые общаются по HTTP и через Kafka.
Пользователь оформляет заказ, оплачивает его и ведет переписку в чате, а администратор контролирует статусы и пользователей.

## 2. Архитектура и взаимодействие
Фронтенд общается только с BFF. BFF проверяет JWT, добавляет заголовки X-User-Id и X-User-Role и проксирует запросы на auth, orders, chat, pricing и notifications.
В Kubernetes discovery обеспечивает DNS сервисов, например http://orders:8080. В docker compose роль DNS выполняет внутренняя сеть, поэтому сервисы доступны по тем же именам.
Базы данных разделены: auth-db, orders-db и chat-db, каждый сервис подключается только к своей схемe Postgres.
Kafka связывает сервисы асинхронно: orders публикует order.created, order.status.changed и order.stage.changed, а chat, notifications и телеграм-бот подписываются на эти события.

## 3. Сервисы и их задачи
- **BFF** (src/): проверяет JWT, добавляет заголовки и проксирует REST и WebSocket.
- **Auth** (services/auth/): Spring Boot + Kotlin, хранит пользователей, роли и refresh токены.
- **Orders** (services/orders/): Spring Boot + Java, валидирует страны, контролирует габариты, генерирует номер и шлет события в Kafka.
- **Chat** (services/chat/): NestJS + Postgres, REST и socket.io чат, список комнат, бот для уведомлений.
- **Notifications** (services/notifications/): Node.js слушает Kafka, отправляет письма через SMTP и бьет вебхуки.
- **Pricing** (services/pricing/): Go сервис рассчитывает стоимость по габаритам и кэширует ответы.
- **Payments** (services/payments/): Spring Boot выводит HTML форму карты и после подтверждения шлет статус paid.
- **Frontend** (frontend/): Next.js рендерит главную, заказы, чат и админские страницы.
- **Telegram bot** (services/bot/): Python принимает команды /login, /orders, /logout и шлет уведомления.

## 4. Основные процессы
1. Регистрация и логин проходят через /api/auth/*, JWT подписывается секретом JWT_SECRET и роль добавляется в токен.
2. Создание заказа: форма фронта ограничивает страны и габариты, BFF передает запрос в Orders, где строится маршрут и номер test_delivery-XYZ.
После сохранения Orders отправляет событие order.created, история пополняется, а чат-бот пишет сообщение в комнату заказа.
3. Оплата: кнопка ведет на сервис payments, где вводится любая карта, после подтверждения Orders переводит статус на paid, а событие order.status.changed получает весь стек.
После оплаты редактировать габариты и маршрут уже нельзя, история хранит только текущий статус и время обновления.
4. Чат: фронт подключается к /api/chat/socket.io, в боковой панели показаны email клиента и номер заказа, админ может войти в любую комнату и писать от имени оператора.
5. Уведомления: notifications-service слушает Kafka, при наличии SMTP_HOST и NOTIFICATIONS_EMAIL_FROM отправляет письма пользователям.
6. Телеграм-бот слушает order.status.changed и order.stage.changed, команды /login, /orders и /logout доступны после указания TELEGRAM_BOT_TOKEN.

## 5. Kafka темы
- `order.created`: Orders сообщает про новый заказ, payload содержит id, reference, email, маршрут и цену.
- `order.status.changed`: Orders отправляет новый статус, кто изменил и когда.
- `order.stage.changed`: рассылает новый этап маршрута с локацией и примечанием.
- `chat.notifications`: чат передает сигналы для внешних уведомлений.
- `notifications.outbound`: notifications объединяет события и кладет в единый поток.

## 6. Переменные окружения
- Общие: JWT_SECRET, KAFKA_BROKERS, переменные Postgres DB_HOST/DB_USER/DB_PASSWORD.
- BFF: AUTH_SERVICE_URL, ORDERS_SERVICE_URL, CHAT_SERVICE_URL, PRICING_SERVICE_URL, NOTIFICATIONS_SERVICE_URL.
- Orders: PRICING_URL, ORDERS_TOPIC_CREATED, ORDERS_TOPIC_STATUS_CHANGED, ORDERS_TOPIC_STAGE_CHANGED.
- Notifications: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, NOTIFICATIONS_EMAIL_FROM, NOTIFICATIONS_EMAIL_TO.
- Дополнительно: AUTH_INTERNAL_TOKEN для запроса email, TELEGRAM_BOT_TOKEN и BFF_BASE_URL для бота.

## 7. Как запустить
1. Установите Docker Desktop и приготовьте файл .env, куда внесете все секреты.
2. Выполните `docker compose up --build` — Docker сам создаст volumes для Postgres и Kafka.
3. Откройте http://localhost:3000, авторизуйтесь, создайте заказ и проверьте чат.
4. Для Kubernetes обновите deploy/helm/delivery/values.yaml и выполните helm upgrade --install delivery ./deploy/helm/delivery -f values.yaml.
Перед установкой не забудьте helm dependency update, чтобы подтянуть поддиаграммы.

## 8. Частые вопросы и ответы
- **Зачем нужен JWT_SECRET: change-me?** Это значение по умолчанию в .env, его нужно заменить на длинную случайную строку.
- **Почему в docker compose указаны пустые volumes?** Docker создаст их автоматически при первом запуске, чтобы базы не потеряли данные.
- **Где сервис discovery?** В Kubernetes имена Service играют роль реестра, а в docker compose это делает внутренняя сеть.
- **Почему выбран BFF?** Он дает одну точку входа, защищает внутренние сервисы и упрощает фронту работу с JWT.
Если появятся новые сервисы, добавляйте их описание сюда и относитесь к файлу как к внутренней вики.



