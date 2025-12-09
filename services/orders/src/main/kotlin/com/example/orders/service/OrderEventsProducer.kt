package com.example.orders.service

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

@Component
class OrderEventsProducer(
    private val kafkaTemplate: KafkaTemplate<String, String>,
    private val objectMapper: ObjectMapper,
    @Value("\${orders.topics.created}") private val createdTopic: String,
    @Value("\${orders.topics.statusChanged}") private val statusChangedTopic: String,
) {

    private val log = LoggerFactory.getLogger(OrderEventsProducer::class.java)

    fun orderCreated(orderId: UUID, userId: String, status: String, route: String?, price: Number?, currency: String?) {
        val payload = mapOf(
            "id" to orderId.toString(),
            "userId" to userId,
            "status" to status,
            "route" to route,
            "price" to price,
            "currency" to currency,
            "createdAt" to Instant.now().toString(),
        )
        send(createdTopic, orderId.toString(), payload)
    }

    fun orderStatusChanged(orderId: UUID, userId: String, status: String) {
        val payload = mapOf(
            "id" to orderId.toString(),
            "userId" to userId,
            "status" to status,
            "changedAt" to Instant.now().toString(),
        )
        send(statusChangedTopic, orderId.toString(), payload)
    }

    private fun send(topic: String, key: String, payload: Any) {
        try {
            val json = objectMapper.writeValueAsString(payload)
            kafkaTemplate.send(topic, key, json)
            log.info("Sent event to {} key={}", topic, key)
        } catch (ex: Exception) {
            log.warn("Failed to send Kafka event to {}: {}", topic, ex.message)
        }
    }
}
