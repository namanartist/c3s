package com.c3s.common.exception;

import com.c3s.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@SuppressWarnings("null")
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .errorCode(ex.getErrorCode())
                .message(ex.getMessage())
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .errorCode("VALIDATION_ERROR")
                .message("Request validation failed")
                .validationErrors(errors)
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .errorCode("INVALID_CREDENTIALS")
                .message("Invalid university ID or password")
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .errorCode("ACCESS_DENIED")
                .message("You do not have permission to perform this action")
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .errorCode("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred. Please contact security dispatch.")
                .timestamp(OffsetDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}