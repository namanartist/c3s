package com.c3s.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidQrException extends ApiException {
    public InvalidQrException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_QR");
    }
}