package com.claimswift.authservice.util;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.MDC;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private String code;
    private String message;
    private T data;
    private String requestId;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .code("SUCCESS")
                .message(message)
                .data(data)
                .requestId(currentRequestId())
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success("Success", data);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .code(errorCode == null || errorCode.isBlank() ? "ERROR" : errorCode)
                .message(message)
                .requestId(currentRequestId())
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return error(message, null);
    }

    public ApiResponse<T> withData(T data) {
        this.data = data;
        return this;
    }

    private static String currentRequestId() {
        return MDC.get("correlationId");
    }
}
