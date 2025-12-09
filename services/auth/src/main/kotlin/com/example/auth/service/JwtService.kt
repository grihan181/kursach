package com.example.auth.service

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.Date
import java.util.UUID

data class TokenPair(val accessToken: String, val refreshToken: String)

@Service
class JwtService(
    @Value("\${auth.jwt.secret}") private val secret: String,
    @Value("\${auth.jwt.accessTtlMinutes}") private val accessTtlMinutes: Long,
    @Value("\${auth.jwt.refreshTtlMinutes}") private val refreshTtlMinutes: Long,
) {

    private val algorithm = Algorithm.HMAC256(secret)

    fun issueTokens(userId: UUID, role: String): TokenPair {
        val now = Instant.now()
        val access = JWT.create()
            .withSubject(userId.toString())
            .withClaim("role", role)
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(accessTtlMinutes * 60)))
            .sign(algorithm)

        val refresh = JWT.create()
            .withSubject(userId.toString())
            .withClaim("type", "refresh")
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(now.plusSeconds(refreshTtlMinutes * 60)))
            .sign(algorithm)

        return TokenPair(access, refresh)
    }

    fun parseAccess(token: String): AccessPrincipal? {
        return try {
            val decoded = JWT.require(algorithm).build().verify(token)
            val role = decoded.getClaim("role").asString()
            val sub = decoded.subject ?: return null
            AccessPrincipal(UUID.fromString(sub), role ?: "user")
        } catch (ex: Exception) {
            null
        }
    }

    fun refreshTtlSeconds(): Long = refreshTtlMinutes * 60
}

data class AccessPrincipal(val userId: UUID, val role: String)
