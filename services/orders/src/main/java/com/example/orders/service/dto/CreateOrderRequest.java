package com.example.orders.service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateOrderRequest {

    @Size(min = 1, max = 20)
    @Valid
    private List<OrderItem> items = new ArrayList<>();

    @Valid
    @NotNull
    private DirectionInput direction;

    @Valid
    private PricingInput pricing;

    private String route;

    private String status;

    public CreateOrderRequest() {
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

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
