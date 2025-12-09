package com.example.auth.web

import com.example.auth.service.AuthService
import com.example.auth.service.JwtService
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class RegisterRequest(
    @field:Email val email: String,
    @field:NotBlank val password: String,
    val role: String? = "user",
)

data class LoginRequest(
    @field:Email val email: String,
    @field:NotBlank val password: String,
)

data class RefreshRequest(@field:NotBlank val refreshToken: String)

data class AuthResponse(val id: UUID, val email: String, val role: String, val accessToken: String, val refreshToken: String)
data class MeResponse(val id: UUID, val email: String, val role: String)

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService,
    private val jwtService: JwtService,
) {

    @GetMapping("/healthz")
    fun health() = mapOf("status" to "ok")

    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): ResponseEntity<Any> {
        return try {
            val user = authService.register(req.email, req.password, req.role ?: "user")
            ResponseEntity.status(HttpStatus.CREATED).body(mapOf("id" to user.id, "email" to user.email, "role" to user.role))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): ResponseEntity<Any> {
        return try {
            val (user, tokens) = authService.login(req.email, req.password)
            ResponseEntity.ok(AuthResponse(user.id!!, user.email, user.role, tokens.accessToken, tokens.refreshToken))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody req: RefreshRequest): ResponseEntity<Any> {
        return try {
            val (user, tokens) = authService.refresh(req.refreshToken)
            ResponseEntity.ok(AuthResponse(user.id!!, user.email, user.role, tokens.accessToken, tokens.refreshToken))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to ex.message))
        }
    }

    @GetMapping("/me")
    fun me(@RequestHeader("Authorization", required = false) authHeader: String?): ResponseEntity<Any> {
        val token = authHeader?.takeIf { it.startsWith("Bearer ") }?.substring("Bearer ".length)
        if (token.isNullOrBlank()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to "missing token"))
        val principal = jwtService.parseAccess(token) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to "invalid token"))
        val user = authService.getUser(principal.userId) ?: return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to "user not found"))
        return ResponseEntity.ok(MeResponse(user.id!!, user.email, user.role))
    }
}
