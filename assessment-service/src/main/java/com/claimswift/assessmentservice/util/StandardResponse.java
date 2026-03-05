package com.claimswift.assessmentservice.util;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandardResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private int statusCode;
    private String errorCode;

    public static <T> StandardResponse<T> success(T data) {
        return StandardResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .errorCode(null)
                .build();
    }

    public static <T> StandardResponse<T> success(String message, T data) {
        return StandardResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .errorCode(null)
                .build();
    }

    public static <T> StandardResponse<T> error(String message, int statusCode) {
        return error(message, statusCode, null);
    }

    public static <T> StandardResponse<T> error(String message, int statusCode, T data) {
        return StandardResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(statusCode)
                .errorCode(mapStatusToErrorCode(statusCode))
                .build();
    }

    public static <T> StandardResponse<T> error(String message, String errorCode) {
        return error(message, errorCode, null, 400);
    }

    public static <T> StandardResponse<T> error(String message, String errorCode, T data) {
        return error(message, errorCode, data, 400);
    }

    public static <T> StandardResponse<T> error(String message, String errorCode, T data, int statusCode) {
        return StandardResponse.<T>builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(statusCode)
                .errorCode(errorCode)
                .build();
    }

    private static String mapStatusToErrorCode(int statusCode) {
        return switch (statusCode) {
            case 400 -> "BAD_REQUEST";
            case 401 -> "UNAUTHORIZED";
            case 403 -> "ACCESS_DENIED";
            case 404 -> "NOT_FOUND";
            case 409 -> "CONFLICT";
            case 422 -> "UNPROCESSABLE_ENTITY";
            case 500 -> "INTERNAL_ERROR";
            default -> "ERROR";
        };
    }
}
