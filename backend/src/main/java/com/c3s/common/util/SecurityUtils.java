package com.c3s.common.util;

import com.c3s.auth.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class SecurityUtils {

    public static UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }

    public static UUID getCurrentUserId() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null ? principal.getId() : null;
    }

    public static String getCurrentUserRole() {
        UserPrincipal principal = getCurrentPrincipal();
        return principal != null && !principal.getAuthorities().isEmpty()
                ? principal.getAuthorities().iterator().next().getAuthority()
                : "ROLE_ANONYMOUS";
    }
}