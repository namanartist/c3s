package com.c3s.common.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {
    public ResourceNotFoundException(String message) {
        super("NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }

    public ResourceNotFoundException(String resource, Object identifier) {
        super("NOT_FOUND", String.format("%s not found with identifier: %s", resource, identifier), HttpStatus.NOT_FOUND);
    }
}
