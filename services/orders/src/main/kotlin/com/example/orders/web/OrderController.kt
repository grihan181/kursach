package com.example.orders.web

import com.example.orders.model.Order
import com.example.orders.service.CreateOrderRequest
import com.example.orders.service.OrderService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/orders")
class OrderController(
    private val orderService: OrderService,
) {

    @GetMapping("/healthz")
    fun health() = mapOf("status" to "ok")

    @GetMapping
    fun list(@RequestHeader("X-User-Id", required = false) userId: String?): ResponseEntity<Any> {
        val orders = orderService.listOrders(null)
        return ResponseEntity.ok(orders)
    }

    @PostMapping
    fun create(
        @RequestHeader("X-User-Id", required = false) userId: String?,
        @Valid @RequestBody req: CreateOrderRequest,
    ): ResponseEntity<Any> {
        val uid = userId ?: "anonymous"
        val order = orderService.createOrder(uid, req)
        return ResponseEntity.status(HttpStatus.CREATED).body(order)
    }

    @GetMapping("/{id}")
    fun get(
        @RequestHeader("X-User-Id", required = false) userId: String?,
        @PathVariable id: UUID,
    ): ResponseEntity<Any> {
        val order = orderService.getOrder(id) ?: return notFound()
        return ResponseEntity.ok(order)
    }

    @PostMapping("/{id}/status")
    fun updateStatus(
        @RequestHeader("X-User-Id", required = false) userId: String?,
        @PathVariable id: UUID,
        @RequestBody body: Map<String, String>,
    ): ResponseEntity<Any> {
        val uid = userId ?: "anonymous"
        val status = body["status"] ?: return ResponseEntity.badRequest().body(mapOf("message" to "status required"))
        return try {
            val order = orderService.updateStatus(uid, id, status) ?: return notFound()
            ResponseEntity.ok(order)
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("message" to ex.message))
        }
    }

    private fun notFound(): ResponseEntity<Any> =
        ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to "not found"))

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Any> {
        val deleted = orderService.deleteOrder(id)
        return if (deleted) ResponseEntity.noContent().build() else notFound()
    }
}
