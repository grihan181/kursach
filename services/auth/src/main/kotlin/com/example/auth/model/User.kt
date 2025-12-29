package com.example.auth.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    val id: UUID? = null,

    @Column(nullable = false, unique = true)
    val email: String,

    @Column(nullable = false)
    val passwordHash: String,

    @Column(nullable = false)
    var role: String = "user",

    @Column(nullable = true, length = 100)
    var firstName: String? = null,

    @Column(nullable = true, length = 100)
    var lastName: String? = null,

    @Column(nullable = true, length = 100)
    var middleName: String? = null,

    @Column(nullable = true, length = 32)
    var phone: String? = null,
)
