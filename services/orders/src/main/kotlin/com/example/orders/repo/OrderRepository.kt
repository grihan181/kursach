package com.example.orders.repo

import com.example.orders.model.Order
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface OrderRepository : JpaRepository<Order, UUID> {
    fun findAllByUserId(userId: String): List<Order>
}
