package com.example.orders.service.dto;

import java.time.Instant;
import java.util.UUID;

public class OrderHistoryEntryDto {
    private final UUID id;
    private final String status;
    private final Instant changedAt;
    private final String changedBy;

    public OrderHistoryEntryDto(UUID id, String status, Instant changedAt, String changedBy) {
        this.id = id;
        this.status = status;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
    }

    public UUID getId() {
        return id;
    }

    public String getStatus() {
        return status;
    }

    public Instant getChangedAt() {
        return changedAt;
    }

    public String getChangedBy() {
        return changedBy;
    }
}
