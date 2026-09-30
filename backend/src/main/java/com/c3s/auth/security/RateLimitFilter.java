package com.c3s.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@SuppressWarnings("null")
public class RateLimitFilter extends OncePerRequestFilter {

    // Simple in-memory rate limiter per IP with window rotation
    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> windowStartTimes = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 180;
    private static final long WINDOW_MS = 60000;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/movement") || path.startsWith("/api/sos")) {
            String clientIp = getClientIp(request);
            long now = System.currentTimeMillis();

            windowStartTimes.compute(clientIp, (k, start) -> {
                if (start == null || (now - start) > WINDOW_MS) {
                    requestCounts.put(clientIp, new AtomicInteger(1));
                    return now;
                } else {
                    requestCounts.get(clientIp).incrementAndGet();
                    return start;
                }
            });

            AtomicInteger count = requestCounts.get(clientIp);
            if (count != null && count.get() > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"errorCode\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please wait a moment.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : request.getRemoteAddr();
    }
}