package com.example.auth.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "refresh_tokens")
data class RefreshToken(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(nullable = false, unique = true)
    val token: String,

@Column(nullable = false)
val userId: UUID,

@Column(nullable = false)
val expiresAt: Instant,
)
