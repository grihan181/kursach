#!/usr/bin/env bash
set -euo pipefail

HOST=${HOST:-delivery.local}
EMAIL=${EMAIL:-demo@example.com}
PASSWORD=${PASSWORD:-password123}
BASE="https://${HOST}/api"

echo "Using host ${HOST}"
echo "Registering user ${EMAIL}..."
curl -s -X POST "${BASE}/auth/register" -H "Content-Type: application/json" -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" >/dev/null || true

echo "Logging in..."
TOKEN=$(curl -s -X POST "${BASE}/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" | jq -r '.accessToken')
if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "Failed to obtain token" >&2
  exit 1
fi

echo "Creating order..."
ORDER=$(curl -s -X POST "${BASE}/orders" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d '{"items":[{"name":"Box","qty":1,"price":100}],"route":"US-RU"}')
ORDER_ID=$(echo "${ORDER}" | jq -r '.id')
if [[ -z "${ORDER_ID}" || "${ORDER_ID}" == "null" ]]; then
  echo "Failed to create order" >&2
  exit 1
fi

curl -s -X POST "${BASE}/chat/${ORDER_ID}/messages" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d '{"text":"Test message"}' >/dev/null || true

echo "Smoke test finished. Order ID: ${ORDER_ID}"
