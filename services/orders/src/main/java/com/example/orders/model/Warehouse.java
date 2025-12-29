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
@Table(name = "warehouses")
public class Warehouse {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 2)
    private String countryCode;

    @Column(nullable = false)
    private String countryName;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String address;

    @Column
    private String contactPhone;

    @Column
    private String workingHours;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Warehouse() {
    }

    public Warehouse(String code,
                     String name,
                     String countryCode,
                     String countryName,
                     String city,
                     String address,
                     String contactPhone,
                     String workingHours) {
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

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public String getCountryName() {
        return countryName;
    }

    public void setCountryName(String countryName) {
        this.countryName = countryName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getWorkingHours() {
        return workingHours;
    }

    public void setWorkingHours(String workingHours) {
        this.workingHours = workingHours;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
