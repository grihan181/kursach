package com.example.orders.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class OrderEventsProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderEventsProducer.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String createdTopic;
    private final String statusChangedTopic;
    private final String stageTopic;

    public OrderEventsProducer(KafkaTemplate<String, String> kafkaTemplate,
                               ObjectMapper objectMapper,
                               @Value("${orders.topics.created}") String createdTopic,
                               @Value("${orders.topics.statusChanged}") String statusChangedTopic,
                               @Value("${orders.topics.stageChanged:order.stage.changed}") String stageTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.createdTopic = createdTopic;
        this.statusChangedTopic = statusChangedTopic;
        this.stageTopic = stageTopic;
    }

    public void orderCreated(UUID orderId,
                             String reference,
                             String userId,
                             String userEmail,
                             String status,
                             String route,
                             Number price,
                             String currency,
                             String orderTitle) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", orderId.toString());
        payload.put("userId", userId);
        payload.put("reference", reference);
        if (userEmail != null && !userEmail.isBlank()) {
            payload.put("userEmail", userEmail);
        }
        payload.put("status", status);
        payload.put("route", route);
        payload.put("price", price);
        payload.put("currency", currency);
        if (orderTitle != null && !orderTitle.isBlank()) {
            payload.put("orderTitle", orderTitle);
        }
        payload.put("createdAt", Instant.now().toString());
        send(createdTopic, orderId.toString(), payload);
    }

    public void orderStatusChanged(UUID orderId,
                                   String reference,
                                   String userId,
                                   String userEmail,
                                   String status,
                                   String changedBy,
                                   String orderTitle) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", orderId.toString());
        payload.put("userId", userId);
        payload.put("reference", reference);
        if (userEmail != null && !userEmail.isBlank()) {
            payload.put("userEmail", userEmail);
        }
        payload.put("status", status);
        payload.put("changedBy", changedBy);
        if (orderTitle != null && !orderTitle.isBlank()) {
            payload.put("orderTitle", orderTitle);
        }
        payload.put("changedAt", Instant.now().toString());
        send(statusChangedTopic, orderId.toString(), payload);
    }

    public void orderStageAdded(UUID orderId,
                                String reference,
                                String userId,
                                String userEmail,
                                String orderTitle,
                                String title,
                                String location,
                                String note,
                                Instant happenedAt,
                                UUID warehouseId,
                                String warehouseName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", orderId.toString());
        payload.put("userId", userId);
        payload.put("reference", reference);
        if (userEmail != null && !userEmail.isBlank()) {
            payload.put("userEmail", userEmail);
        }
        if (orderTitle != null && !orderTitle.isBlank()) {
            payload.put("orderTitle", orderTitle);
        }
        payload.put("title", title);
        payload.put("location", location);
        payload.put("note", note);
        payload.put("happenedAt", happenedAt != null ? happenedAt.toString() : Instant.now().toString());
        if (warehouseId != null) {
            payload.put("warehouseId", warehouseId.toString());
        }
        if (warehouseName != null && !warehouseName.isBlank()) {
            payload.put("warehouseName", warehouseName);
        }
        send(stageTopic, orderId.toString(), payload);
    }

    private void send(String topic, String key, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, json);
            log.info("Sent event to {} key={}", topic, key);
        } catch (Exception ex) {
            log.warn("Failed to send Kafka event to {}: {}", topic, ex.getMessage());
        }
    }
}

