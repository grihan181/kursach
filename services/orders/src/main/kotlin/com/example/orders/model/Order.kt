package com.example.orders.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "orders")
data class Order(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(nullable = false)
    val userId: String,

    @Column(nullable = false)
    var status: String = "draft",

    @Column(columnDefinition = "TEXT", nullable = false)
    val items: String,

    @Column(nullable = true)
    val route: String? = null,

    @Column(nullable = true, scale = 2, precision = 12)
    var price: BigDecimal? = null,

    @Column(nullable = true)
    var currency: String? = null,

    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),
)
