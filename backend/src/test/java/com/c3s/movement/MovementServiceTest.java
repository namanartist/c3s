package com.c3s.movement;

import com.c3s.audit.service.AuditService;
import com.c3s.auth.entity.User;
import com.c3s.auth.repository.UserRepository;
import com.c3s.common.exception.DuplicateActionException;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateQrToken;
import com.c3s.gates.service.QrService;
import com.c3s.movement.dto.CheckInRequest;
import com.c3s.movement.dto.CheckOutRequest;
import com.c3s.movement.dto.MovementResultDto;
import com.c3s.movement.entity.UserCampusStatus;
import com.c3s.movement.repository.MovementEventRepository;
import com.c3s.movement.repository.UserCampusStatusRepository;
import com.c3s.movement.service.CampusOccupancyService;
import com.c3s.movement.service.MovementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class MovementServiceTest {

    @Mock private MovementEventRepository movementEventRepository;
    @Mock private UserCampusStatusRepository campusStatusRepository;
    @Mock private UserRepository userRepository;
    @Mock private QrService qrService;
    @Mock private CampusOccupancyService occupancyService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private AuditService auditService;

    @InjectMocks
    private MovementService movementService;

    private User student;
    private Gate gate;
    private GateQrToken qrToken;

    @BeforeEach
    void setUp() {
        student = User.builder().id(UUID.randomUUID()).fullName("Aarav").universityId("2023CS001").build();
        gate = Gate.builder().id(UUID.randomUUID()).gateCode("GATE-MAIN").name("Main Gate").status("ACTIVE").build();
        qrToken = GateQrToken.builder().id(UUID.randomUUID()).gate(gate).status("ACTIVE").build();
    }

    @Test
    void testCheckIn_SuccessWhenOutside() {
        CheckInRequest req = new CheckInRequest();
        req.setQrToken("validSignedPayload");

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(qrService.validateQr("validSignedPayload")).thenReturn(qrToken);
        when(campusStatusRepository.findById(student.getId())).thenReturn(Optional.of(
                UserCampusStatus.builder().status("OUTSIDE").lastChangedAt(OffsetDateTime.now()).build()
        ));

        MovementResultDto result = movementService.checkIn(student.getId(), req, "127.0.0.1", "MockBrowser");

        assertTrue(result.isSuccess());
        assertEquals("CHECK_IN", result.getMovementType());
        verify(movementEventRepository, times(1)).save(any());
        verify(campusStatusRepository, times(1)).save(any());
    }

    @Test
    void testCheckIn_DuplicateRejectedWhenInside() {
        CheckInRequest req = new CheckInRequest();
        req.setQrToken("validSignedPayload");

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(qrService.validateQr("validSignedPayload")).thenReturn(qrToken);
        when(campusStatusRepository.findById(student.getId())).thenReturn(Optional.of(
                UserCampusStatus.builder().status("INSIDE").lastChangedAt(OffsetDateTime.now()).build()
        ));

        assertThrows(DuplicateActionException.class, () -> movementService.checkIn(student.getId(), req, "127.0.0.1", "MockBrowser"));
    }

    @Test
    void testCheckOut_RejectedWhenAlreadyOutside() {
        CheckOutRequest req = new CheckOutRequest();
        req.setQrToken("validSignedPayload");

        when(userRepository.findById(student.getId())).thenReturn(Optional.of(student));
        when(qrService.validateQr("validSignedPayload")).thenReturn(qrToken);
        when(campusStatusRepository.findById(student.getId())).thenReturn(Optional.of(
                UserCampusStatus.builder().status("OUTSIDE").lastChangedAt(OffsetDateTime.now()).build()
        ));

        assertThrows(DuplicateActionException.class, () -> movementService.checkOut(student.getId(), req, "127.0.0.1", "MockBrowser"));
    }
}
