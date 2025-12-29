package com.example.orders.service.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public class CreateStageRequest {

    @NotBlank
    private String title;
    private String location;
    private String note;
    private Instant happenedAt;
    private UUID warehouseId;

    public CreateStageRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Instant getHappenedAt() {
        return happenedAt;
    }

    public void setHappenedAt(Instant happenedAt) {
        this.happenedAt = happenedAt;
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
}
