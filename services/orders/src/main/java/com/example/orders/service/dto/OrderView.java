package com.example.orders.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class OrderView {
    private final UUID id;
    private final String reference;
    private final String userId;
    private final String userEmail;
    private final String status;
    private final String items;
    private final String route;
    private final String originCountry;
    private final String destinationCountry;
    private final BigDecimal price;
    private final String currency;
    private final Double weightKg;
    private final Double lengthCm;
    private final Double widthCm;
    private final Double heightCm;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final OrderPermissionsDto permissions;
    private final List<OrderHistoryEntryDto> history;
    private final List<OrderStageDto> stages;

    public OrderView(UUID id,
                     String reference,
                     String userId,
                     String userEmail,
                     String status,
                     String items,
                     String route,
                     String originCountry,
                     String destinationCountry,
                     BigDecimal price,
                     String currency,
                     Double weightKg,
                     Double lengthCm,
                     Double widthCm,
                     Double heightCm,
                     Instant createdAt,
                     Instant updatedAt,
                     OrderPermissionsDto permissions,
                     List<OrderHistoryEntryDto> history,
                     List<OrderStageDto> stages) {
        this.id = id;
        this.reference = reference;
        this.userId = userId;
        this.userEmail = userEmail;
        this.status = status;
        this.items = items;
        this.route = route;
        this.originCountry = originCountry;
        this.destinationCountry = destinationCountry;
        this.price = price;
        this.currency = currency;
        this.weightKg = weightKg;
        this.lengthCm = lengthCm;
        this.widthCm = widthCm;
        this.heightCm = heightCm;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.permissions = permissions;
        this.history = history;
        this.stages = stages;
    }

    public UUID getId() {
        return id;
    }

    public String getReference() {
        return reference;
    }

    public String getUserId() {
        return userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getStatus() {
        return status;
    }

    public String getItems() {
        return items;
    }

    public String getRoute() {
        return route;
    }

    public String getOriginCountry() {
        return originCountry;
    }

    public String getDestinationCountry() {
        return destinationCountry;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCurrency() {
        return currency;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public Double getLengthCm() {
        return lengthCm;
    }

    public Double getWidthCm() {
        return widthCm;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public OrderPermissionsDto getPermissions() {
        return permissions;
    }

    public List<OrderHistoryEntryDto> getHistory() {
        return history;
    }

    public List<OrderStageDto> getStages() {
        return stages;
    }
}
