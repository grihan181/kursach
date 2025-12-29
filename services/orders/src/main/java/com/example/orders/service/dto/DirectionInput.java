package com.example.orders.service.dto;

import jakarta.validation.constraints.NotBlank;

public class DirectionInput {

    @NotBlank
    private String origin;

    @NotBlank
    private String destination;

    public DirectionInput() {
    }

    public DirectionInput(String origin, String destination) {
        this.origin = origin;
        this.destination = destination;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }
}
