package com.example.orders.service

import com.example.orders.model.Order
import com.example.orders.repo.OrderRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

data class CreateOrderRequest(
    val items: List<OrderItem>,
    val route: String?,
    val pricing: PricingInput? = null,
    // status игнорируем при создании, используем дефолт
    val status: String? = null,
)

data class OrderItem(val name: String, val qty: Int, val price: BigDecimal?)
data class PricingInput(
    val weightKg: Double,
    val lengthCm: Double,
    val widthCm: Double,
    val heightCm: Double,
    val origin: String,
    val destination: String,
    val currency: String?,
)

@Service
class OrderService(
    private val orderRepository: OrderRepository,
    private val objectMapper: ObjectMapper,
    private val pricingClient: PricingClient,
    private val eventsProducer: OrderEventsProducer,
) {
    private val log = LoggerFactory.getLogger(OrderService::class.java)
    private val allowedStatuses = setOf("draft", "paid", "shipping", "delivered", "cancelled")

    @Transactional
    fun createOrder(userId: String, request: CreateOrderRequest): Order {
        val itemsJson = objectMapper.writeValueAsString(request.items)
        // Не проставляем статус вручную, оставляем значение по умолчанию из модели
        val order = Order(userId = userId, items = itemsJson, route = request.route)

        // Optionally call pricing service
        request.pricing?.let { input ->
            val quote = pricingClient.quote(
                QuoteRequest(
                    weightKg = input.weightKg,
                    lengthCm = input.lengthCm,
                    widthCm = input.widthCm,
                    heightCm = input.heightCm,
                    origin = input.origin,
                    destination = input.destination,
                    currency = input.currency,
                ),
            )
            if (quote != null) {
                order.price = quote.amount
                order.currency = quote.currency
            }
        }

        val saved = orderRepository.save(order)
        saved.id?.let {
            eventsProducer.orderCreated(
                it,
                userId,
                saved.status,
                saved.route,
                saved.price,
                saved.currency,
            )
        }
        return saved
    }

    fun listOrders(userId: String?): List<Order> =
        if (userId != null) orderRepository.findAllByUserId(userId) else orderRepository.findAll().toList()

    fun getOrder(id: UUID): Order? = orderRepository.findById(id).orElse(null)

    @Transactional
    fun deleteOrder(id: UUID): Boolean {
        if (!orderRepository.existsById(id)) return false
        orderRepository.deleteById(id)
        return true
    }

    @Transactional
    fun updateStatus(userId: String, id: UUID, status: String): Order? {
        if (!allowedStatuses.contains(status)) {
            throw IllegalArgumentException("invalid status")
        }
        val order = orderRepository.findById(id).orElse(null) ?: return null
        if (order.userId != userId) return null
        order.status = status
        val saved = orderRepository.save(order)
        eventsProducer.orderStatusChanged(saved.id!!, userId, status)
        return saved
    }
}
