package com.example.orders.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

@Component
public class PricingClient {

    private static final Logger log = LoggerFactory.getLogger(PricingClient.class);

    private final RestClient restClient = RestClient.create();
    private final String pricingUrl;

    public PricingClient(@Value("${orders.pricingUrl}") String pricingUrl) {
        this.pricingUrl = pricingUrl;
    }

    public QuoteResponse quote(QuoteRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            return restClient.post()
                    .uri(pricingUrl + "/quotes")
                    .headers(httpHeaders -> httpHeaders.addAll(headers))
                    .body(request)
                    .retrieve()
                    .body(QuoteResponse.class);
        } catch (Exception ex) {
            log.warn("Pricing request failed: {}", ex.getMessage());
            return null;
        }
    }

    public static class QuoteRequest {
        private double weightKg;
        private double lengthCm;
        private double widthCm;
        private double heightCm;
        private String origin;
        private String destination;
        private String currency;

        public QuoteRequest() {
        }

        public QuoteRequest(double weightKg, double lengthCm, double widthCm, double heightCm, String origin, String destination, String currency) {
            this.weightKg = weightKg;
            this.lengthCm = lengthCm;
            this.widthCm = widthCm;
            this.heightCm = heightCm;
            this.origin = origin;
            this.destination = destination;
            this.currency = currency;
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class QuoteResponse {
        private String id;
        private BigDecimal amount;
        private String currency;
        private Integer etaDays;

        public QuoteResponse() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(BigDecimal amount) {
            this.amount = amount;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public Integer getEtaDays() {
            return etaDays;
        }

        public void setEtaDays(Integer etaDays) {
            this.etaDays = etaDays;
        }
    }
}
