package com.example.auth.service

import com.example.auth.model.RefreshToken
import com.example.auth.model.User
import com.example.auth.repo.RefreshTokenRepository
import com.example.auth.repo.UserRepository
import org.springframework.security.crypto.bcrypt.BCrypt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtService: JwtService,
) {
    @Transactional
    fun register(email: String, password: String, role: String = "user"): User {
        userRepository.findByEmail(email).ifPresent {
            throw IllegalArgumentException("already exists")
        }
        val hash = BCrypt.hashpw(password, BCrypt.gensalt())
        val user = userRepository.save(User(email = email.lowercase(), passwordHash = hash, role = role))
        return user
    }

    @Transactional
    fun login(email: String, password: String): Pair<User, TokenPair> {
        val user = userRepository.findByEmail(email.lowercase()).orElseThrow {
            IllegalArgumentException("invalid credentials")
        }
        if (!BCrypt.checkpw(password, user.passwordHash)) {
            throw IllegalArgumentException("invalid credentials")
        }
        refreshTokenRepository.deleteByUserId(user.id!!)
        val tokens = jwtService.issueTokens(user.id, user.role)
        saveRefresh(user.id, tokens.refreshToken)
        return user to tokens
    }

    @Transactional
    fun refresh(token: String): Pair<User, TokenPair> {
        val stored = refreshTokenRepository.findByToken(token).orElseThrow {
            IllegalArgumentException("invalid refresh")
        }
        if (stored.expiresAt.isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored)
            throw IllegalArgumentException("expired refresh")
        }
        val user = userRepository.findById(stored.userId).orElseThrow {
            IllegalArgumentException("user not found")
        }
        refreshTokenRepository.deleteByUserId(user.id!!)
        val tokens = jwtService.issueTokens(user.id, user.role)
        saveRefresh(user.id, tokens.refreshToken)
        return user to tokens
    }

    fun getUser(id: UUID): User? = userRepository.findById(id).orElse(null)

    private fun saveRefresh(userId: UUID, token: String) {
        val expiresAt = Instant.now().plusSeconds(jwtService.refreshTtlSeconds())
        refreshTokenRepository.save(RefreshToken(token = token, userId = userId, expiresAt = expiresAt))
    }
}
