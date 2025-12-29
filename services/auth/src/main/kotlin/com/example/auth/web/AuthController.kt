package com.example.auth.web

import com.example.auth.model.User
import com.example.auth.service.AccessPrincipal
import com.example.auth.service.AuthService
import com.example.auth.service.JwtService
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class RegisterRequest(
    @field:Email val email: String,
    @field:NotBlank val password: String,
    val role: String? = "user",
    @field:Size(max = 100) val firstName: String? = null,
    @field:Size(max = 100) val lastName: String? = null,
    @field:Size(max = 100) val middleName: String? = null,
    @field:Size(max = 32) val phone: String? = null,
)

data class LoginRequest(
    @field:Email val email: String,
    @field:NotBlank val password: String,
)

data class RefreshRequest(@field:NotBlank val refreshToken: String)

data class ProfileResponse(
    val id: UUID,
    val email: String,
    val role: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val middleName: String? = null,
    val phone: String? = null,
)

data class AuthResponse(
    val id: UUID,
    val email: String,
    val role: String,
    val accessToken: String,
    val refreshToken: String,
    val profile: ProfileResponse,
)

data class UpdateProfileRequest(
    @field:Size(max = 100) val firstName: String? = null,
    @field:Size(max = 100) val lastName: String? = null,
    @field:Size(max = 100) val middleName: String? = null,
    @field:Pattern(regexp = "^[0-9+()\\-\\s]{0,32}\$", message = "телефон должен содержать только цифры, + и -")
    val phone: String? = null,
)

typealias MeResponse = ProfileResponse
typealias UserResponse = ProfileResponse
data class UpdateRoleRequest(@field:NotBlank val role: String)

@RestController
@RequestMapping("/auth")
class AuthController(
    private val authService: AuthService,
    private val jwtService: JwtService,
    @Value("\${auth.internalToken:}") private val internalToken: String?,
) {

    @GetMapping("/healthz")
    fun health() = mapOf("status" to "ok")

    @PostMapping("/register")
    fun register(@Valid @RequestBody req: RegisterRequest): ResponseEntity<Any> {
        return try {
            val user = authService.register(
                req.email,
                req.password,
                req.role ?: "user",
                req.firstName,
                req.lastName,
                req.middleName,
                req.phone,
            )
            ResponseEntity.status(HttpStatus.CREATED).body(toProfileResponse(user))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody req: LoginRequest): ResponseEntity<Any> {
        return try {
            val (user, tokens) = authService.login(req.email, req.password)
            ResponseEntity.ok(
                AuthResponse(
                    id = user.id!!,
                    email = user.email,
                    role = user.role,
                    accessToken = tokens.accessToken,
                    refreshToken = tokens.refreshToken,
                    profile = toProfileResponse(user),
                ),
            )
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to ex.message))
        }
    }

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody req: RefreshRequest): ResponseEntity<Any> {
        return try {
            val (user, tokens) = authService.refresh(req.refreshToken)
            ResponseEntity.ok(
                AuthResponse(
                    id = user.id!!,
                    email = user.email,
                    role = user.role,
                    accessToken = tokens.accessToken,
                    refreshToken = tokens.refreshToken,
                    profile = toProfileResponse(user),
                ),
            )
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to ex.message))
        }
    }

    @GetMapping("/me")
    fun me(@RequestHeader("Authorization", required = false) authHeader: String?): ResponseEntity<Any> {
        val (principal, error) = resolvePrincipal(authHeader)
        if (principal == null) return unauthorized(error ?: "invalid token")
        val user = authService.getUser(principal.userId) ?: return unauthorized("user not found")
        return ResponseEntity.ok(toProfileResponse(user))
    }

    @GetMapping("/profile")
    fun profile(@RequestHeader("Authorization", required = false) authHeader: String?): ResponseEntity<Any> {
        return me(authHeader)
    }

    @PutMapping("/profile")
    fun updateProfile(
        @RequestHeader("Authorization", required = false) authHeader: String?,
        @Valid @RequestBody body: UpdateProfileRequest,
    ): ResponseEntity<Any> {
        val (principal, error) = resolvePrincipal(authHeader)
        if (principal == null) return unauthorized(error ?: "invalid token")
        return try {
            val updated = authService.updateProfile(principal.userId, body.firstName, body.lastName, body.middleName, body.phone)
            ResponseEntity.ok(toProfileResponse(updated))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to ex.message))
        }
    }

    @GetMapping("/admin/users")
    fun listUsers(@RequestHeader("X-User-Role", required = false) role: String?): ResponseEntity<Any> {
        if (!role.equals("admin", ignoreCase = true)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to "admin only"))
        }
        val users = authService.listUsers().map { toProfileResponse(it) }
        return ResponseEntity.ok(users)
    }

    @PatchMapping("/admin/users/{id}/role")
    fun changeRole(
        @RequestHeader("X-User-Role", required = false) role: String?,
        @PathVariable id: UUID,
        @Valid @RequestBody body: UpdateRoleRequest,
    ): ResponseEntity<Any> {
        if (!role.equals("admin", ignoreCase = true)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to "admin only"))
        }
        return try {
            val updated = authService.updateRole(id, body.role)
            ResponseEntity.ok(toProfileResponse(updated))
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to ex.message))
        }
    }

    @DeleteMapping("/admin/users/{id}")
    fun deleteUser(
        @RequestHeader("X-User-Role", required = false) role: String?,
        @PathVariable id: UUID,
    ): ResponseEntity<Any> {
        if (!role.equals("admin", ignoreCase = true)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to "admin only"))
        }
        return try {
            authService.deleteUser(id)
            ResponseEntity.noContent().build()
        } catch (ex: IllegalArgumentException) {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to ex.message))
        }
    }

    @GetMapping("/internal/users/{id}")
    fun internalUser(
        @RequestHeader("X-Internal-Token", required = false) token: String?,
        @PathVariable id: UUID,
    ): ResponseEntity<Any> {
        if (internalToken.isNullOrBlank() || token.isNullOrBlank() || token != internalToken) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to "forbidden"))
        }
        val user = authService.getUser(id) ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to "not found"))
        return ResponseEntity.ok(toProfileResponse(user))
    }

    private fun resolvePrincipal(authHeader: String?): Pair<AccessPrincipal?, String?> {
        val token = authHeader?.takeIf { it.startsWith("Bearer ") }?.substring("Bearer ".length)
        if (token.isNullOrBlank()) return Pair(null, "missing token")
        val principal = jwtService.parseAccess(token) ?: return Pair(null, "invalid token")
        return Pair(principal, null)
    }

    private fun unauthorized(message: String): ResponseEntity<Any> =
        ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("message" to message))

    private fun toProfileResponse(user: User): ProfileResponse =
        ProfileResponse(
            id = user.id!!,
            email = user.email,
            role = user.role,
            firstName = user.firstName,
            lastName = user.lastName,
            middleName = user.middleName,
            phone = user.phone,
        )
}
