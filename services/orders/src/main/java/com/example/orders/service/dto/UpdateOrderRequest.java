package com.example.orders.service.dto;

import jakarta.validation.Valid;

import java.util.List;

public class UpdateOrderRequest {

    @Valid
    private List<OrderItem> items;

    @Valid
    private DirectionInput direction;

    @Valid
    private PricingInput pricing;

    public UpdateOrderRequest() {
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public DirectionInput getDirection() {
        return direction;
    }

    public void setDirection(DirectionInput direction) {
        this.direction = direction;
    }

    public PricingInput getPricing() {
        return pricing;
    }

    public void setPricing(PricingInput pricing) {
        this.pricing = pricing;
    }
}
