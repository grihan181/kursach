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
    fun register(
        email: String,
        password: String,
        role: String = "user",
        firstName: String? = null,
        lastName: String? = null,
        middleName: String? = null,
        phone: String? = null,
    ): User {
        userRepository.findByEmail(email).ifPresent {
            throw IllegalArgumentException("already exists")
        }
        val hash = BCrypt.hashpw(password, BCrypt.gensalt())
        val user = userRepository.save(
            User(
                email = email.lowercase(),
                passwordHash = hash,
                role = normalizeRole(role),
                firstName = normalizeName(firstName),
                lastName = normalizeName(lastName),
                middleName = normalizeName(middleName),
                phone = normalizePhone(phone),
            ),
        )
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
        val tokens = jwtService.issueTokens(user.id, user.role, user.email)
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
        val tokens = jwtService.issueTokens(user.id, user.role, user.email)
        saveRefresh(user.id, tokens.refreshToken)
        return user to tokens
    }

    fun getUser(id: UUID): User? = userRepository.findById(id).orElse(null)

    fun listUsers(): List<User> = userRepository.findAll().sortedBy { it.email }

    @Transactional
    fun updateRole(userId: UUID, nextRole: String): User {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("user not found") }
        user.role = normalizeRole(nextRole)
        return userRepository.save(user)
    }

    @Transactional
    fun updateProfile(
        userId: UUID,
        firstName: String?,
        lastName: String?,
        middleName: String?,
        phone: String?,
    ): User {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("user not found") }
        user.firstName = normalizeName(firstName)
        user.lastName = normalizeName(lastName)
        user.middleName = normalizeName(middleName)
        user.phone = normalizePhone(phone)
        return userRepository.save(user)
    }

    @Transactional
    fun deleteUser(userId: UUID) {
        if (!userRepository.existsById(userId)) {
            throw IllegalArgumentException("user not found")
        }
        refreshTokenRepository.deleteByUserId(userId)
        userRepository.deleteById(userId)
    }

    private fun saveRefresh(userId: UUID, token: String) {
        val expiresAt = Instant.now().plusSeconds(jwtService.refreshTtlSeconds())
        refreshTokenRepository.save(RefreshToken(token = token, userId = userId, expiresAt = expiresAt))
    }

    private fun normalizeRole(role: String?): String =
        if (role.equals("admin", ignoreCase = true)) "admin" else "user"

    private fun normalizeName(value: String?): String? = value?.trim()?.takeIf { it.isNotEmpty() }

    private fun normalizePhone(value: String?): String? =
        value
            ?.replace(Regex("[^+0-9]"), "")
            ?.takeIf { it.isNotEmpty() }
}
