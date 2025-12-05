# Delivery Umbrella Helm Chart

Этот chart поднимает инфраструктуру (Kafka + Postgres) и placeholder-сервисы (Auth, Orders, Chat, BFF, Frontend). Pre-install hook `kafka-create-topics` создаёт необходимые топики.

## Установка
```
helm dependency update ./deploy/helm/delivery
helm upgrade --install delivery ./deploy/helm/delivery -f ./deploy/helm/delivery/values.yaml
```

## Настройки
- `global.ingressHost` — домен ingress.
- `kafka.enabled` — включает зависимость bitnami/kafka (по умолчанию true).
- `kafka.bootstrap` — адрес bootstrap для топик-хука (по умолчанию `<release>-kafka:9092`).
- `auth/orders/chat.postgresql.enabled` — включает Postgres зависимость для сервисов.
- `auth/orders/chat.database.*` — настройки подключения (host по умолчанию `<release>-<service>-postgres`, порт 5432, креды из значений) и секреты `*-db`.
- `auth/orders/chat/bff/frontend.image` — образы сервисов.
- `ingress.paths` — правила маршрутизации (по умолчанию `/api` → bff, `/` → frontend).
- `kafka.topics` — список топиков, которые создаются Job’ом перед установкой/обновлением.

## Что дальше
- Подставить реальные образы сервисов.
- Добавить init Job’ы для миграций БД (topic hook уже включён в шаблоны).
- Настроить переменные окружения под конкретные сервисы.
