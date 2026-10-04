package com.waypoint.backend.common;

import org.springframework.http.HttpStatus;
import lombok.Getter;

/**
 * Thrown anywhere in a service/controller to signal a client-facing error
 * (404, 400, 403, etc). GlobalExceptionHandler turns this into a consistent
 * JSON error body instead of a raw stack trace.
 */
@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}