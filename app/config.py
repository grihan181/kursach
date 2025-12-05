from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="APP_", case_sensitive=False)

    database_url: str = "postgresql://order:order@localhost:5432/orders"
    jwt_secret: str = "secret"
    jwt_algorithm: str = "HS256"
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_order_created_topic: str = "order.created"
    kafka_order_status_topic: str = "order.status.changed"
    kafka_status_update_topic: str = "order.status.update"
    service_name: str = "order-service"
    otlp_endpoint: str = "http://localhost:4317"
    allowed_roles: List[str] = ["admin", "user"]


settings = Settings()
