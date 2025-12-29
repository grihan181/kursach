package com.example.orders.repo;

import com.example.orders.model.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, UUID> {
    List<OrderStatusHistory> findAllByOrderIdOrderByChangedAtAsc(UUID orderId);

    void deleteByOrderId(UUID orderId);
}
