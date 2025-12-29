package com.example.orders.service.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public class PricingInput {

    @DecimalMin("0.1")
    @DecimalMax("500.0")
    private double weightKg;

    @DecimalMin("1.0")
    @DecimalMax("400.0")
    private double lengthCm;

    @DecimalMin("1.0")
    @DecimalMax("400.0")
    private double widthCm;

    @DecimalMin("1.0")
    @DecimalMax("400.0")
    private double heightCm;

    @NotBlank
    private String origin;

    @NotBlank
    private String destination;

    private String currency;

    public PricingInput() {
    }

    public double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(double weightKg) {
        this.weightKg = weightKg;
    }

    public double getLengthCm() {
        return lengthCm;
    }

    public void setLengthCm(double lengthCm) {
        this.lengthCm = lengthCm;
    }

    public double getWidthCm() {
        return widthCm;
    }

    public void setWidthCm(double widthCm) {
        this.widthCm = widthCm;
    }

    public double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(double heightCm) {
        this.heightCm = heightCm;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
