package com.c3s.common.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public ApiException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public ApiException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public ApiException(String message, HttpStatus status) {
        this(message, status, "API_ERROR");
    }

    public HttpStatus getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
}