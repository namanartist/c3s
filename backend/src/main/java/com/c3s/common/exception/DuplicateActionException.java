package com.c3s.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateActionException extends ApiException {
    public DuplicateActionException(String message) {
        super(message, HttpStatus.CONFLICT, "DUPLICATE_ACTION");
    }
}