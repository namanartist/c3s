package com.c3s.location;

import com.c3s.location.entity.CampusGeofence;
import com.c3s.location.repository.CampusGeofenceRepository;
import com.c3s.location.service.GeofenceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GeofenceServiceTest {

    @Mock
    private CampusGeofenceRepository geofenceRepository;

    @InjectMocks
    private GeofenceService geofenceService;

    @Test
    void testEvaluateLocation_InsideCampus() {
        // MITS Campus center ~ 26.2185, 78.1825
        when(geofenceRepository.findByActiveTrue()).thenReturn(List.of(
                CampusGeofence.builder()
                        .name("MITS Campus")
                        .fenceType("CIRCLE")
                        .centerLat(26.2185)
                        .centerLng(78.1825)
                        .radiusMeters(500.0)
                        .active(true)
                        .build()
        ));

        String status = geofenceService.evaluateLocation(26.2186, 78.1826);
        assertEquals("INSIDE", status);
    }

    @Test
    void testEvaluateLocation_OutsideCampus() {
        when(geofenceRepository.findByActiveTrue()).thenReturn(List.of(
                CampusGeofence.builder()
                        .name("MITS Campus")
                        .fenceType("CIRCLE")
                        .centerLat(26.2185)
                        .centerLng(78.1825)
                        .radiusMeters(500.0)
                        .active(true)
                        .build()
        ));

        // 10 km away
        String status = geofenceService.evaluateLocation(26.3000, 78.2500);
        assertEquals("OUTSIDE", status);
    }
}
