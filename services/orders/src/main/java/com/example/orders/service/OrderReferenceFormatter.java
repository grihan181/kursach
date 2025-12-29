package com.example.orders.service;

import java.util.UUID;

public final class OrderReferenceFormatter {

    private static final String PREFIX = "test_delivery-";

    private OrderReferenceFormatter() {
    }

    public static String referenceFor(UUID id) {
        if (id == null) {
            return PREFIX + "000";
        }
        long seed = Math.abs(id.getMostSignificantBits() ^ id.getLeastSignificantBits());
        long digits = seed % 1000;
        return String.format("%s%03d", PREFIX, digits);
    }
}
