package com.example.payments.web;

import com.example.payments.PaymentGatewayException;
import com.example.payments.client.OrderClient;
import com.example.payments.client.OrderSummary;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Controller
@RequestMapping("/payments")
public class PaymentController {

    private final OrderClient orderClient;
    private final String frontendUrl;

    public PaymentController(OrderClient orderClient,
                             @Value("${frontend.url:http://localhost}") String frontendUrl) {
        this.orderClient = orderClient;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/{orderId}")
    public String checkout(@PathVariable UUID orderId, Model model) {
        OrderSummary order = orderClient.fetchOrder(orderId);
        model.addAttribute("order", order);
        model.addAttribute("orderNumber", order.reference());
        model.addAttribute("frontendUrl", frontendUrl);
        PaymentForm form = new PaymentForm();
        model.addAttribute("form", form);
        return "checkout";
    }

    @PostMapping("/{orderId}")
    public String submit(@PathVariable UUID orderId,
                         @Valid @ModelAttribute("form") PaymentForm form,
                         BindingResult bindingResult,
                         Model model) {
        OrderSummary order = orderClient.fetchOrder(orderId);
        if (bindingResult.hasErrors()) {
            model.addAttribute("order", order);
            model.addAttribute("orderNumber", order.reference());
            model.addAttribute("frontendUrl", frontendUrl);
            return "checkout";
        }
        OrderSummary updated = orderClient.markPaid(orderId);
        model.addAttribute("order", updated);
        model.addAttribute("orderNumber", updated.reference());
        model.addAttribute("frontendUrl", frontendUrl);
        model.addAttribute("message", "Оплата успешно подтверждена. Средства не списываются, заказ переведён в статус 'оплачен'.");
        return "result";
    }

    @ExceptionHandler(PaymentGatewayException.class)
    public String handleError(PaymentGatewayException ex, Model model) {
        model.addAttribute("error", ex.getMessage());
        model.addAttribute("frontendUrl", frontendUrl);
        return "result";
    }
}
