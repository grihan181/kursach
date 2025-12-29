package com.example.orders.service.dto;

import java.time.Instant;
import java.util.UUID;

public class OrderStageDto {
    private final UUID id;
    private final String title;
    private final String location;
    private final String note;
    private final Instant happenedAt;
    private final UUID warehouseId;
    private final String warehouseName;

    public OrderStageDto(UUID id,
                         String title,
                         String location,
                         String note,
                         Instant happenedAt,
                         UUID warehouseId,
                         String warehouseName) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.note = note;
        this.happenedAt = happenedAt;
        this.warehouseId = warehouseId;
        this.warehouseName = warehouseName;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getLocation() {
        return location;
    }

    public String getNote() {
        return note;
    }

    public Instant getHappenedAt() {
        return happenedAt;
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public String getWarehouseName() {
        return warehouseName;
    }
}
