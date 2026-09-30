package com.c3s.sos;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.DuplicateActionException;
import com.c3s.incidents.repository.IncidentRepository;
import com.c3s.incidents.repository.IncidentTimelineRepository;
import com.c3s.notifications.service.NotificationService;
import com.c3s.responders.repository.SecurityPersonnelRepository;
import com.c3s.sos.dto.SosEventDto;
import com.c3s.sos.dto.SosRequest;
import com.c3s.sos.entity.SosEvent;
import com.c3s.sos.repository.SosEventRepository;
import com.c3s.sos.service.SosService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class SosServiceTest {

    @Mock private SosEventRepository sosEventRepository;
    @Mock private IncidentRepository incidentRepository;
    @Mock private IncidentTimelineRepository timelineRepository;
    @Mock private SecurityPersonnelRepository personnelRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private AuditService auditService;

    @InjectMocks
    private SosService sosService;

    private User student;

    @BeforeEach
    void setUp() {
        student = User.builder().id(UUID.randomUUID()).fullName("Aarav").universityId("2023CS001").phone("9876543210").build();
    }

    @Test
    void testTriggerSos_Success() {
        SosRequest req = new SosRequest();
        req.setLatitude(26.2183);
        req.setLongitude(78.1828);
        req.setAccuracy(8.4);

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(sosEventRepository.findActiveSosByUser(student.getId())).thenReturn(Optional.empty());
        when(personnelRepository.findByStatus("AVAILABLE")).thenReturn(List.of());
        when(sosEventRepository.save(any(SosEvent.class))).thenAnswer(inv -> {
            SosEvent e = inv.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        SosEventDto result = sosService.triggerSos(student.getId(), req, "127.0.0.1", "Android");

        assertNotNull(result);
        assertEquals("TRIGGERED", result.getStatus());
        assertEquals("Aarav", result.getStudentName());
        verify(incidentRepository, times(1)).save(any());
        verify(sosEventRepository, times(1)).save(any());
        verify(timelineRepository, times(1)).save(any());
    }

    @Test
    void testTriggerSos_DuplicateActive_ThrowsException() {
        SosRequest req = new SosRequest();
        req.setLatitude(26.2183);
        req.setLongitude(78.1828);

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(sosEventRepository.findActiveSosByUser(student.getId())).thenReturn(Optional.of(
                SosEvent.builder().status("TRIGGERED").triggeredAt(OffsetDateTime.now()).build()
        ));

        assertThrows(DuplicateActionException.class, () -> sosService.triggerSos(student.getId(), req, "127.0.0.1", "Android"));
    }
}
