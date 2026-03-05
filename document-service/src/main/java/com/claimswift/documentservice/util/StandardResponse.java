package com.claimswift.documentservice.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Standard API Response Wrapper
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StandardResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String errorCode;
    private String path;

    public StandardResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public static <T> StandardResponse<T> success(T data) {
        StandardResponse<T> response = new StandardResponse<>();
        response.setSuccess(true);
        response.setMessage("Success");
        response.setData(data);
        return response;
    }

    public static <T> StandardResponse<T> success(String message, T data) {
        StandardResponse<T> response = new StandardResponse<>();
        response.setSuccess(true);
        response.setMessage(message);
        response.setData(data);
        return response;
    }

    public static <T> StandardResponse<T> error(String message) {
        return error(message, "ERROR");
    }

    public static <T> StandardResponse<T> error(String message, String errorCode) {
        return error(message, errorCode, null);
    }

    public static <T> StandardResponse<T> error(String message, String errorCode, T data) {
        StandardResponse<T> response = new StandardResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setErrorCode(errorCode);
        response.setData(data);
        return response;
    }

    public static <T> StandardResponse<T> errorWithPath(String message, String errorCode, String path) {
        StandardResponse<T> response = new StandardResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setErrorCode(errorCode);
        response.setPath(path);
        return response;
    }

    public static <T> StandardResponse<T> errorWithPath(String message, String path) {
        return errorWithPath(message, "ERROR", path);
    }
}
