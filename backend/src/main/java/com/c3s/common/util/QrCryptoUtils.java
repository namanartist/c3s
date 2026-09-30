package com.c3s.common.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.UUID;

public class QrCryptoUtils {

    public static String generateSignedToken(String gateCode, UUID gateId, String dateStr, String secret) {
        try {
            String payload = gateCode + ":" + gateId + ":" + dateStr + ":" + UUID.randomUUID().toString().substring(0, 8);
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] signature = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String signatureStr = Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
            String payloadEncoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
            return "C3S-QR-" + payloadEncoded + "." + signatureStr;
        } catch (Exception e) {
            throw new RuntimeException("Error signing gate QR token", e);
        }
    }

    public static String createSignedQrPayload(String rawToken, String secret) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] signature = hmac.doFinal(rawToken.getBytes(StandardCharsets.UTF_8));
            String signatureStr = Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
            String payloadEncoded = Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));
            return "C3S-QR-" + payloadEncoded + "." + signatureStr;
        } catch (Exception e) {
            throw new RuntimeException("Error creating signed QR payload", e);
        }
    }

    public static String hashToken(String rawToken) {
        if (rawToken == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error hashing token", e);
        }
    }

    public static String sha256(String rawToken) {
        return hashToken(rawToken);
    }

    public static boolean verifySignature(String rawToken, String secret) {
        try {
            if (rawToken == null || !rawToken.startsWith("C3S-QR-")) return false;
            String tokenData = rawToken.substring("C3S-QR-".length());
            String[] parts = tokenData.split("\\.");
            if (parts.length != 2) return false;

            String payloadEncoded = parts[0];
            String expectedSig = parts[1];
            String payload = new String(Base64.getUrlDecoder().decode(payloadEncoded), StandardCharsets.UTF_8);

            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(secretKey);
            byte[] actualSigBytes = hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String actualSig = Base64.getUrlEncoder().withoutPadding().encodeToString(actualSigBytes);

            return MessageDigest.isEqual(expectedSig.getBytes(StandardCharsets.UTF_8), actualSig.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean verifySignedQrPayload(String rawToken, String secret) {
        return verifySignature(rawToken, secret);
    }

    public static String extractPayload(String rawToken) {
        try {
            if (rawToken == null || !rawToken.startsWith("C3S-QR-")) return null;
            String tokenData = rawToken.substring("C3S-QR-".length());
            String[] parts = tokenData.split("\\.");
            return new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
