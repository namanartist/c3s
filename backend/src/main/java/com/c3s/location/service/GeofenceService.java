package com.c3s.location.service;

import com.c3s.location.entity.CampusGeofence;
import com.c3s.location.repository.CampusGeofenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeofenceService {
    private final CampusGeofenceRepository geofenceRepository;

    // Approximate MITS Campus bounding radius
    private static final double CAMPUS_CENTER_LAT = 26.2185;
    private static final double CAMPUS_CENTER_LNG = 78.1825;
    private static final double CAMPUS_RADIUS_METERS = 500.0;

    public String evaluateLocation(double lat, double lng) {
        List<CampusGeofence> activeFences = geofenceRepository.findByActiveTrue();

        if (activeFences.isEmpty()) {
            double distance = calculateDistanceMeters(lat, lng, CAMPUS_CENTER_LAT, CAMPUS_CENTER_LNG);
            if (distance <= CAMPUS_RADIUS_METERS) {
                return "INSIDE";
            } else if (distance <= CAMPUS_RADIUS_METERS + 50) {
                return "NEAR_BOUNDARY";
            } else {
                return "OUTSIDE";
            }
        }

        for (CampusGeofence fence : activeFences) {
            if ("CIRCLE".equalsIgnoreCase(fence.getFenceType())) {
                double dist = calculateDistanceMeters(lat, lng, fence.getCenterLat(), fence.getCenterLng());
                if (dist <= fence.getRadiusMeters()) {
                    return "INSIDE";
                } else if (dist <= fence.getRadiusMeters() + 50) {
                    return "NEAR_BOUNDARY";
                }
            }
        }

        return "OUTSIDE";
    }

    public static double calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
