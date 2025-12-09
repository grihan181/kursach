package com.example.orders.service

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.math.BigDecimal

@Component
class PricingClient(
    @Value("\${orders.pricingUrl}") private val pricingUrl: String,
) {

    private val log = LoggerFactory.getLogger(PricingClient::class.java)
    private val restClient = RestClient.create()

    fun quote(request: QuoteRequest): QuoteResponse? {
        return try {
            val headers = HttpHeaders()
            headers.contentType = MediaType.APPLICATION_JSON
            restClient.post()
                .uri("$pricingUrl/quotes")
                .headers { it.addAll(headers) }
                .body(request)
                .retrieve()
                .body(QuoteResponse::class.java)
        } catch (ex: Exception) {
            log.warn("Pricing request failed: {}", ex.message)
            null
        }
    }
}

data class QuoteRequest(
    val weightKg: Double,
    val lengthCm: Double,
    val widthCm: Double,
    val heightCm: Double,
    val origin: String,
    val destination: String,
    val currency: String? = null,
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class QuoteResponse(
    val id: String?,
    val amount: BigDecimal,
    val currency: String,
    val etaDays: Int?,
)
