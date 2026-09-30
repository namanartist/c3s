package com.c3s.responders.service;

import com.c3s.common.exception.ResourceNotFoundException;
import com.c3s.responders.dto.SecurityPersonnelDto;
import com.c3s.responders.entity.SecurityPersonnel;
import com.c3s.responders.repository.SecurityPersonnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ResponderService {
    private final SecurityPersonnelRepository personnelRepository;

    @Transactional(readOnly = true)
    public List<SecurityPersonnelDto> getAvailableResponders() {
        return personnelRepository.findByStatus("AVAILABLE").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SecurityPersonnelDto> getAllPersonnel() {
        return personnelRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SecurityPersonnelDto updateStatus(UUID personnelId, String status, String location) {
        SecurityPersonnel personnel = personnelRepository.findById(personnelId)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel not found: " + personnelId));

        personnel.setStatus(status);
        if (location != null) personnel.setCurrentLocation(location);
        personnel.setLastSeen(OffsetDateTime.now(ZoneId.of("Asia/Kolkata")));

        return toDto(personnelRepository.save(personnel));
    }

    public SecurityPersonnelDto toDto(SecurityPersonnel p) {
        return SecurityPersonnelDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .phone(p.getUser().getPhone())
                .employeeCode(p.getEmployeeCode())
                .designation(p.getDesignation())
                .status(p.getStatus())
                .currentLocation(p.getCurrentLocation())
                .lastSeen(p.getLastSeen())
                .build();
    }
}
