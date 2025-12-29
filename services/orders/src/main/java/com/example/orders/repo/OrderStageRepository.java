package com.example.orders.repo;

import com.example.orders.model.OrderStage;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderStageRepository extends JpaRepository<OrderStage, UUID> {
    List<OrderStage> findAllByOrderIdOrderByHappenedAtAsc(UUID orderId);
}

