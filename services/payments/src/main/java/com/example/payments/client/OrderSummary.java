package com.example.payments.client;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderSummary(
        UUID id,
        String reference,
        String title,
        String route,
        BigDecimal amount,
        String currency,
        String status,
        String userEmail
) {
    public boolean isAlreadyPaid() {
        return status != null && !status.isBlank() && !status.equalsIgnoreCase("created");
    }
}
