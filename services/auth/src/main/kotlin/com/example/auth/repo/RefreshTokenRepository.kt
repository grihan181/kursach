package com.example.auth.repo

import com.example.auth.model.RefreshToken
import org.springframework.data.jpa.repository.JpaRepository
import java.util.Optional
import java.util.UUID

interface RefreshTokenRepository : JpaRepository<RefreshToken, UUID> {
    fun findByToken(token: String): Optional<RefreshToken>
    fun deleteByUserId(userId: UUID)
}
