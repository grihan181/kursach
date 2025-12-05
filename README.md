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
