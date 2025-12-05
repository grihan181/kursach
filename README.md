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
