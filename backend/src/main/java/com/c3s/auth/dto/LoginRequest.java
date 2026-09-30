package com.c3s.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "University ID or Email is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

    // Convenience getters/setters for frontend and tests
    public String getUniversityId() {
        return identifier;
    }

    public void setUniversityId(String universityId) {
        this.identifier = universityId;
    }
}
