package com.c3s.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String universityId;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private List<String> roles;
    private String departmentName;
}