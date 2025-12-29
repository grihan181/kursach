package com.example.payments.client;

import com.example.payments.PaymentGatewayException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class OrderClient {

    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(5);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public OrderClient(WebClient.Builder builder,
                       ObjectMapper objectMapper,
                       @Value("${orders.service.url:http://orders:8080}") String baseUrl,
                       @Value("${orders.service.admin-user:payments-service}") String systemUser) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-User-Id", systemUser)
                .defaultHeader("X-User-Role", "admin")
                .build();
        this.objectMapper = objectMapper;
    }

    public OrderSummary fetchOrder(UUID orderId) {
        OrderViewResponse response = requestOrder(orderId);
        return mapToSummary(response);
    }

    public OrderSummary markPaid(UUID orderId) {
        OrderViewResponse updated = updateStatus(orderId, "paid");
        return mapToSummary(updated);
    }

    private OrderViewResponse requestOrder(UUID orderId) {
        try {
            return webClient.get()
                    .uri("/orders/{id}", orderId)
                    .retrieve()
                    .bodyToMono(OrderViewResponse.class)
                    .timeout(REQUEST_TIMEOUT)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new PaymentGatewayException("Не удалось получить заказ: " + ex.getStatusCode(), ex);
        } catch (Exception ex) {
            throw new PaymentGatewayException("Ошибка обращения к orders", ex);
        }
    }

    private OrderViewResponse updateStatus(UUID orderId, String status) {
        try {
            return webClient.post()
                    .uri("/orders/{id}/status", orderId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("status", status))
                    .retrieve()
                    .bodyToMono(OrderViewResponse.class)
                    .timeout(REQUEST_TIMEOUT)
                    .block();
        } catch (WebClientResponseException ex) {
            throw new PaymentGatewayException("Не удалось обновить статус заказа: " + ex.getStatusCode(), ex);
        } catch (Exception ex) {
            throw new PaymentGatewayException("Ошибка обновления статуса", ex);
        }
    }

    private OrderSummary mapToSummary(OrderViewResponse response) {
        if (response == null || response.id() == null) {
            throw new PaymentGatewayException("Пустой ответ от сервиса заказов");
        }
        String title = resolveTitle(response);
        BigDecimal amount = resolveAmount(response);
        return new OrderSummary(
                response.id(),
                response.reference() != null ? response.reference() : fallbackReference(response.id()),
                title,
                response.route(),
                amount,
                response.currency() != null ? response.currency() : "USD",
                response.status(),
                response.userEmail()
        );
    }

    private String resolveTitle(OrderViewResponse response) {
        if (response.items() != null && !response.items().isBlank()) {
            try {
                List<ItemPayload> items = objectMapper.readValue(response.items(), new TypeReference<>() {});
                if (!items.isEmpty() && items.get(0).name() != null && !items.get(0).name().isBlank()) {
                    return items.get(0).name();
                }
            } catch (Exception ignored) {
            }
        }
        if (response.route() != null && !response.route().isBlank()) {
            return response.route();
        }
        return "Заказ";
    }

    private BigDecimal resolveAmount(OrderViewResponse response) {
        if (response.price() != null) {
            return response.price();
        }
        if (response.items() != null && !response.items().isBlank()) {
            try {
                List<ItemPayload> items = objectMapper.readValue(response.items(), new TypeReference<>() {});
                BigDecimal total = items.stream()
                        .map(item -> item.price() != null ? item.price() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (total.compareTo(BigDecimal.ZERO) > 0) {
                    return total.setScale(2, RoundingMode.HALF_UP);
                }
            } catch (Exception ignored) {
            }
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private record ItemPayload(String name, Integer qty, BigDecimal price) {}

    private record OrderViewResponse(
            java.util.UUID id,
            String reference,
            String userId,
            String userEmail,
            String status,
            String items,
            String route,
            String originCountry,
            String destinationCountry,
            BigDecimal price,
            String currency
    ) {}

    private String fallbackReference(UUID id) {
        if (id == null) {
            return "test_delivery-000";
        }
        long seed = Math.abs(id.getMostSignificantBits() ^ id.getLeastSignificantBits());
        long digits = seed % 1000;
        return String.format("test_delivery-%03d", digits);
    }
}
