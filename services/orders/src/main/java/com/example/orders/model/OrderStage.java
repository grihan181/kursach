package com.example.orders.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_stages")
public class OrderStage {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private String title;

    @Column
    private String location;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column
    private UUID warehouseId;

    @Column(nullable = false)
    private Instant happenedAt = Instant.now();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public OrderStage() {
    }

    public OrderStage(UUID orderId, String title, String location, String note, Instant happenedAt, UUID warehouseId) {
        this.orderId = orderId;
        this.title = title;
        this.location = location;
        this.note = note;
        this.happenedAt = happenedAt != null ? happenedAt : Instant.now();
        this.warehouseId = warehouseId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrderId() {
        return orderId;
    }

    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
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

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }

    public Instant getHappenedAt() {
        return happenedAt;
    }

    public void setHappenedAt(Instant happenedAt) {
        this.happenedAt = happenedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
