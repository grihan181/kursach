package com.example.payments.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PaymentForm {

    @NotBlank(message = "Введите номер карты")
    @Pattern(regexp = "\\d{16}", message = "Номер карты должен содержать 16 цифр")
    private String cardNumber;

    @NotBlank(message = "Введите срок действия")
    @Pattern(regexp = "(0[1-9]|1[0-2])\\/(2[4-9]|3[0-9])", message = "Формат MM/YY")
    private String expiry;

    @NotBlank(message = "Введите CVC")
    @Pattern(regexp = "\\d{3}", message = "CVC состоит из 3 цифр")
    private String cvv;

    @NotBlank(message = "Введите имя на карте")
    private String cardholder;

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getExpiry() {
        return expiry;
    }

    public void setExpiry(String expiry) {
        this.expiry = expiry;
    }

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }

    public String getCardholder() {
        return cardholder;
    }

    public void setCardholder(String cardholder) {
        this.cardholder = cardholder;
    }
}
