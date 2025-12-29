package com.example.orders.web;

import com.example.orders.model.Order;
import com.example.orders.service.OrderService;
import com.example.orders.service.dto.CreateOrderRequest;
import com.example.orders.service.dto.CreateStageRequest;
import com.example.orders.service.dto.OrderView;
import com.example.orders.service.dto.UpdateOrderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/healthz")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok().body(java.util.Map.of("status", "ok"));
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                   @RequestHeader(value = "X-User-Role", required = false) String role) {
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        if (!isAdmin && (userId == null || userId.isBlank())) {
            return unauthorized();
        }
        String scopedUser = isAdmin ? null : userId;
        List<Order> orders = orderService.listOrders(scopedUser);
        List<OrderView> views = orders.stream()
                .map(order -> orderService.toView(order, userId, isAdmin, false))
                .toList();
        return ResponseEntity.ok(views);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                    @RequestHeader(value = "X-User-Role", required = false) String role,
                                    @RequestHeader(value = "X-User-Email", required = false) String userEmail,
                                    @Valid @RequestBody CreateOrderRequest request) {
        String uid = userId;
        if (uid == null || uid.isBlank()) {
            return unauthorized();
        }
        if (userEmail == null || userEmail.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Map.of("message", "missing user email"));
        }
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        Order saved = orderService.createOrder(uid, userEmail, request);
        OrderView view = orderService.toView(saved, uid, isAdmin, true);
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                 @RequestHeader(value = "X-User-Role", required = false) String role,
                                 @PathVariable UUID id) {
        Order order = orderService.getOrder(id);
        if (order == null) {
            return notFound();
        }
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        if (!isAdmin) {
            if (userId == null || userId.isBlank()) {
                return unauthorized();
            }
            if (!order.getUserId().equals(userId)) {
                return forbidden();
            }
        }
        OrderView view = orderService.toView(order, userId, isAdmin, true);
        return ResponseEntity.ok(view);
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                          @RequestHeader(value = "X-User-Role", required = false) String role,
                                          @PathVariable UUID id,
                                          @RequestBody StatusUpdateRequest body) {
        if (!"admin".equalsIgnoreCase(role)) {
            return forbidden();
        }
        if (userId == null || userId.isBlank()) {
            return unauthorized();
        }
        Order order = orderService.getOrder(id);
        if (order == null) {
            return notFound();
        }
        String status = body.status();
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "status required"));
        }
        try {
            Order updated = orderService.updateStatus(order, userId, status);
            OrderView view = orderService.toView(updated, userId, true, true);
            return ResponseEntity.ok(view);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                    @RequestHeader(value = "X-User-Role", required = false) String role,
                                    @PathVariable UUID id,
                                    @Valid @RequestBody UpdateOrderRequest body) {
        Order order = orderService.getOrder(id);
        if (order == null) {
            return notFound();
        }
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        if (!isAdmin) {
            if (userId == null || userId.isBlank()) {
                return unauthorized();
            }
            if (!order.getUserId().equals(userId)) {
                return forbidden();
            }
        }
        String requester = userId != null ? userId : order.getUserId();
        try {
            Order updated = orderService.updateOrderDetails(order, body);
            OrderView view = orderService.toView(updated, requester, isAdmin, true);
            return ResponseEntity.ok(view);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                    @RequestHeader(value = "X-User-Role", required = false) String role,
                                    @PathVariable UUID id) {
        Order order = orderService.getOrder(id);
        if (order == null) {
            return notFound();
        }
        boolean isAdmin = "admin".equalsIgnoreCase(role);
        if (!isAdmin) {
            if (userId == null || userId.isBlank()) {
                return unauthorized();
            }
            if (!order.getUserId().equals(userId)) {
                return forbidden();
            }
        }
        if (orderService.deleteOrder(id)) {
            return ResponseEntity.noContent().build();
        }
        return notFound();
    }

    private ResponseEntity<?> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("message", "not found"));
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(java.util.Map.of("message", "unauthorized"));
    }

    private ResponseEntity<?> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("message", "forbidden"));
    }

    @PostMapping("/{id}/stages")
    public ResponseEntity<?> addStage(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                      @RequestHeader(value = "X-User-Role", required = false) String role,
                                      @PathVariable UUID id,
                                      @Valid @RequestBody CreateStageRequest request) {
        if (!"admin".equalsIgnoreCase(role)) {
            return forbidden();
        }
        if (userId == null || userId.isBlank()) {
            return unauthorized();
        }
        Order order = orderService.getOrder(id);
        if (order == null) {
            return notFound();
        }
        var stage = orderService.addStage(order, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(stage);
    }
}
