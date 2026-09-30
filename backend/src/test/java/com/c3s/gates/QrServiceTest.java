package com.c3s.gates;

import com.c3s.common.exception.InvalidQrException;
import com.c3s.common.util.QrCryptoUtils;
import com.c3s.gates.dto.GateQrDto;
import com.c3s.gates.entity.Gate;
import com.c3s.gates.entity.GateQrToken;
import com.c3s.gates.repository.GateQrTokenRepository;
import com.c3s.gates.repository.GateRepository;
import com.c3s.gates.service.QrService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class QrServiceTest {

    @Mock
    private GateQrTokenRepository qrTokenRepository;

    @Mock
    private GateRepository gateRepository;

    @InjectMocks
    private QrService qrService;

    private Gate mainGate;
    private final String secret = "TEST_SECRET_KEY_FOR_QR_TESTS_1234567890";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(qrService, "qrSigningSecret", secret);
        mainGate = Gate.builder()
                .id(UUID.randomUUID())
                .gateCode("GATE-MAIN")
                .name("Main Gate")
                .status("ACTIVE")
                .build();
    }

    @Test
    void testRotateQr_GeneratesSignedValidPayload() {
        when(gateRepository.findById(mainGate.getId())).thenReturn(Optional.of(mainGate));

        GateQrDto qrDto = qrService.rotateQr(mainGate.getId());

        assertNotNull(qrDto);
        assertEquals("GATE-MAIN", qrDto.getGateCode());
        assertNotNull(qrDto.getQrPayload());
        assertTrue(QrCryptoUtils.verifySignedQrPayload(qrDto.getQrPayload(), secret));
        verify(qrTokenRepository, times(1)).save(any(GateQrToken.class));
    }

    @Test
    void testValidateQr_TamperedSignature_ThrowsInvalidQrException() {
        String fakePayload = "InvalidPayloadWithoutValidHmacSignature";
        assertThrows(InvalidQrException.class, () -> qrService.validateQr(fakePayload));
    }
}
