package com.system.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                ex.getStatus().value(), ex.getStatus().getReasonPhrase(), ex.getMessage(), request.getRequestURI());
        return new ResponseEntity<>(errorResponse, ex.getStatus());
    }

    // Concurrent registration can pass application checks; the DB remains authoritative.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegrityConflict(DataIntegrityViolationException ex,
                                                                HttpServletRequest request) {
        Throwable cause = ex;
        Set<String> identityKeys = Set.of("app_users_username_key", "app_users_email_key",
                "uq_app_users_username_ci", "uq_app_users_email_ci");
        while (cause != null) {
            if (cause instanceof ConstraintViolationException violation
                    && "23505".equals(violation.getSQLState())
                    && violation.getConstraintName() != null
                    && identityKeys.contains(violation.getConstraintName())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(409, "Conflict",
                        "Tên đăng nhập hoặc email đã được sử dụng.", request.getRequestURI()));
            }
            cause = cause.getCause();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(500,
                "Internal Server Error", "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", request.getRequestURI()));
    }

    // 1. Xử lý lỗi không tìm thấy dữ liệu (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // 2. Xử lý lỗi cọc trùng / Xe không khả dụng (409 Conflict)
    @ExceptionHandler({VehicleNotAvailableException.class, VehicleAlreadyReservedException.class})
    public ResponseEntity<ErrorResponse> handleVehicleConflictException(
            RuntimeException ex, HttpServletRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.CONFLICT.value(),
                "Conflict",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // 3. Xử lý lỗi dữ liệu đầu vào không hợp lệ (400)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage(),
                request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 4. Xử lý tất cả các lỗi không lường trước được của Server (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {

        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                request.getRequestURI()
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
