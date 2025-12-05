# Smoke-тест после установки Helm chart

Этот сценарий помогает проверить связность сервисов после `helm upgrade --install delivery ./deploy/helm/delivery -f deploy/helm/delivery/values.yaml`. Хост ingress задаётся переменной `HOST` (по умолчанию `delivery.local`).

## Предустановки
- Известен ingress host, например `delivery.local`.
- Доступен `curl` и `jq`.

## Шаги
1. **Регистрация**
   ```bash
   curl -X POST https://delivery.local/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@example.com","password":"password123"}'
   ```
2. **Логин и получение токена**
   ```bash
   TOKEN=$(curl -s -X POST https://delivery.local/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"demo@example.com","password":"password123"}' | jq -r '.accessToken')
   ```
3. **Создание заказа**
   ```bash
   ORDER=$(curl -s -X POST https://delivery.local/api/orders \
     -H "Authorization: Bearer ${TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"items":[{"name":"Box","qty":1,"price":100}],"route":"US-RU"}')
   ORDER_ID=$(echo "$ORDER" | jq -r '.id')
   ```
4. **Смена статуса (опционально)**
   ```bash
   curl -X PATCH https://delivery.local/api/orders/${ORDER_ID} \
     -H "Authorization: Bearer ${TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"status":"shipping"}'
   ```
5. **Отправка сообщения в чат**
   ```bash
   curl -X POST https://delivery.local/api/chat/${ORDER_ID}/messages \
     -H "Authorization: Bearer ${TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test message"}'
   ```
6. **WebSocket проверка**
   - Открыть WebSocket клиент на `wss://delivery.local/api/chat/ws?token=${TOKEN}&orderId=${ORDER_ID}` и убедиться, что сообщение приходит.

Ожидаемые результаты: все HTTP-запросы возвращают 2xx, сообщения видны в истории и через WebSocket.

Альтернатива: запустить `HOST=delivery.local scripts/smoke.sh` (требуется `jq`).
