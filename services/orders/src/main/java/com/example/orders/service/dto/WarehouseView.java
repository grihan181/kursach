package com.example.orders.service.dto;

import java.util.UUID;

public class WarehouseView {

    private final UUID id;
    private final String code;
    private final String name;
    private final String countryCode;
    private final String countryName;
    private final String city;
    private final String address;
    private final String contactPhone;
    private final String workingHours;

    public WarehouseView(UUID id,
                         String code,
                         String name,
                         String countryCode,
                         String countryName,
                         String city,
                         String address,
                         String contactPhone,
                         String workingHours) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.city = city;
        this.address = address;
        this.contactPhone = contactPhone;
        this.workingHours = workingHours;
    }

    public UUID getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public String getCountryName() {
        return countryName;
    }

    public String getCity() {
        return city;
    }

    public String getAddress() {
        return address;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public String getWorkingHours() {
        return workingHours;
    }
}
