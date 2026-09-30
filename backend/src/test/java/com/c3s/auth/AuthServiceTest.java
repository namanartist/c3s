package com.c3s.auth;

import com.c3s.auth.dto.LoginRequest;
import com.c3s.auth.dto.TokenResponse;
import com.c3s.auth.entity.Role;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.RefreshTokenRepository;
import com.c3s.auth.repository.UserRepository;
import com.c3s.auth.security.JwtService;
import com.c3s.auth.service.AuthService;
import com.c3s.common.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User studentUser;

    @BeforeEach
    void setUp() {
        Role studentRole = Role.builder().name("STUDENT").permissions(Set.of()).build();
        studentUser = User.builder()
                .id(UUID.randomUUID())
                .universityId("2023CS001")
                .fullName("Aarav Sharma")
                .email("aarav@mits.ac.in")
                .passwordHash("hashedSecret")
                .status("ACTIVE")
                .roles(Set.of(studentRole))
                .build();
    }

    @Test
    void testLogin_Success() {
        LoginRequest request = new LoginRequest();
        request.setUniversityId("2023CS001");
        request.setPassword("correctPassword");

        when(userRepository.findByUniversityId("2023CS001")).thenReturn(Optional.of(studentUser));
        when(passwordEncoder.matches("correctPassword", "hashedSecret")).thenReturn(true);
        when(jwtService.generateAccessToken(any())).thenReturn("mock.jwt.token");
        when(jwtService.generateRefreshToken(any())).thenReturn("mock.refresh.token");

        TokenResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals("Aarav Sharma", response.getUser().getFullName());
    }

    @Test
    void testLogin_InvalidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setUniversityId("2023CS001");
        request.setPassword("wrongPassword");

        when(userRepository.findByUniversityId("2023CS001")).thenReturn(Optional.of(studentUser));
        when(passwordEncoder.matches("wrongPassword", "hashedSecret")).thenReturn(false);

        assertThrows(ApiException.class, () -> authService.login(request));
    }
}
