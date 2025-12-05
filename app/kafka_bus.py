import asyncio
import json
import logging
from typing import Optional
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from .config import settings

logger = logging.getLogger(__name__)


class KafkaBus:
    def __init__(self) -> None:
        self._producer: Optional[AIOKafkaProducer] = None
        self._status_consumer: Optional[AIOKafkaConsumer] = None
        self._loop = asyncio.get_event_loop()

    async def start(self):
        self._producer = AIOKafkaProducer(bootstrap_servers=settings.kafka_bootstrap_servers)
        await self._producer.start()
        self._status_consumer = AIOKafkaConsumer(
            settings.kafka_status_update_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=f"{settings.service_name}-status",
            enable_auto_commit=True,
        )
        await self._status_consumer.start()
        logger.info("Kafka producer and consumer started")

    async def stop(self):
        if self._producer:
            await self._producer.stop()
        if self._status_consumer:
            await self._status_consumer.stop()

    async def send(self, topic: str, event: dict):
        if not self._producer:
            raise RuntimeError("Producer is not initialized")
        payload = json.dumps(event).encode("utf-8")
        await self._producer.send_and_wait(topic, payload)

    async def consume_status_updates(self, handler):
        if not self._status_consumer:
            logger.warning("Status consumer is not initialized")
            return
        async for msg in self._status_consumer:
            try:
                data = json.loads(msg.value.decode("utf-8"))
                await handler(data)
            except Exception:  # pragma: no cover - logging path
                logger.exception("Failed to process status update")


kafka_bus = KafkaBus()
