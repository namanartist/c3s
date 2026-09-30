package com.c3s.auth.security;

import com.c3s.auth.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Getter
public class UserPrincipal implements UserDetails {
    private final UUID id;
    private final String universityId;
    private final String fullName;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean active;

    public UserPrincipal(UUID id, String universityId, String fullName, String email, String password,
                         Collection<? extends GrantedAuthority> authorities, boolean active) {
        this.id = id;
        this.universityId = universityId;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.active = active;
    }

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.universityId = user.getUniversityId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.active = "ACTIVE".equalsIgnoreCase(user.getStatus());

        List<GrantedAuthority> authList = new ArrayList<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                authList.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(perm ->
                            authList.add(new SimpleGrantedAuthority(perm.getCode() != null ? perm.getCode() : "PERM"))
                    );
                }
            });
        }
        this.authorities = authList;
    }

    public static UserPrincipal create(User user) {
        return new UserPrincipal(user);
    }

    public String getPrimaryRole() {
        if (authorities == null || authorities.isEmpty()) return "STUDENT";
        for (GrantedAuthority ga : authorities) {
            if (ga.getAuthority().startsWith("ROLE_")) {
                return ga.getAuthority().substring(5);
            }
        }
        return "STUDENT";
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return universityId;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
