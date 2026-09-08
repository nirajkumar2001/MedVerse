package com.tcs.medverse.exception;

import com.tcs.medverse.dto.ApiErrorResponseDto;
import com.tcs.medverse.util.ResponseHandler;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(ex.getMessage());
    }



    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<?> handleBadRequest(BadRequestException ex) {
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, ex.getMessage(), Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException ex) {
        return ResponseHandler.error(HttpStatus.NOT_FOUND, ex.getMessage(), Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenException ex) {
        return ResponseHandler.error(HttpStatus.FORBIDDEN, ex.getMessage(), Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<?> handleUnauthorized(UnauthorizedException ex) {
        String message = "Unauthorized access. Please login first.";
        return ResponseHandler.error(HttpStatus.UNAUTHORIZED, message, Map.of("error", message));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<?> handleConflict(ConflictException ex) {
        return ResponseHandler.error(HttpStatus.CONFLICT, ex.getMessage(), Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex) {
        String rootMessage = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String message = "This record already exists. Please check the entered details and try again.";
        if (rootMessage != null && rootMessage.toLowerCase().contains("value too long")) {
            message = "One of the submitted fields is too long. Please shorten title/disease/document name and try again.";
        }
        return ResponseHandler.error(HttpStatus.CONFLICT, message, Map.of("error", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, msg, Map.of("error", msg));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseHandler.error(status, ex.getReason() == null ? "Request failed" : ex.getReason(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleOther(Exception ex) {
        return ResponseHandler.error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", Map.of("error", ex.getMessage()));
    }
    @ExceptionHandler(OfficerNotFoundException.class)
    public ResponseEntity<String> handleOfficerNotFound(OfficerNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AuthenticationProfileValidationException.class)
    public ResponseEntity<String> handleValidation(AuthenticationProfileValidationException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(CaseVerificationNotFoundException.class)
    public ResponseEntity<String> handleNotFound(
            CaseVerificationNotFoundException ex) {

        return new ResponseEntity<>(ex.getMessage(),HttpStatus.NOT_FOUND);

    }

    @ExceptionHandler(InvalidRemarksException.class)
    public ResponseEntity<String> handleInvalidRemarks(InvalidRemarksException ex) {
        return ResponseEntity.status(400).body(ex.getMessage());
    }


    @ExceptionHandler(InvalidSearchInputException.class)
    public ResponseEntity<ApiErrorResponseDto> invalid(InvalidSearchInputException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiErrorResponseDto(400, ex.getMessage()));
    }

    @ExceptionHandler(PatientNotFoundException.class)
    public ResponseEntity<ApiErrorResponseDto> notFound(PatientNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiErrorResponseDto(404, ex.getMessage()));
    }

    @ExceptionHandler(EmergencyLookupDaoException.class)
    public ResponseEntity<ApiErrorResponseDto> dao(EmergencyLookupDaoException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorResponseDto(500, ex.getMessage()));
    }

}
