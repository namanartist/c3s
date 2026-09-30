package com.c3s.auth.controller;

import com.c3s.auth.dto.*;
import com.c3s.auth.service.AuthService;
import com.c3s.common.response.ApiResponse;
import com.c3s.common.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Secure university login, JWT access & refresh token rotation")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user via University ID / Email and password")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse tokens = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(tokens, "Login successful"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange valid refresh token for a new access token and rotated refresh token")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse tokens = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok(tokens, "Token refreshed"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Terminate session and revoke tokens")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user identity and roles")
    public ResponseEntity<ApiResponse<UserDto>> getMe() {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        UserDto user = authService.getCurrentUser(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}