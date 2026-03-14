package com.example.telos.exception;


import com.example.telos.dto.ErrorDto;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class RestExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(RestExceptionHandler.class);

    @ExceptionHandler({NullEntityReferenceException.class,IllegalArgumentException.class, MethodArgumentNotValidException.class})
    @ResponseStatus(value = HttpStatus.BAD_REQUEST)
    public ErrorDto nullEntityReferenceExceptionHandler(HttpServletRequest request, RuntimeException exception) {
        return new ErrorDto(exception.getMessage());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorDto entityNotFoundExceptionHandler(HttpServletRequest request, EntityNotFoundException exception) {
        return new ErrorDto(exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(value = HttpStatus.FORBIDDEN)
    public ErrorDto accessDeniedExceptionHandler(HttpServletRequest request) {
        return new ErrorDto("You do not have permission to perform this action");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(value = HttpStatus.NOT_FOUND)
    public ErrorDto entityNotFoundExceptionHandler(HttpServletRequest request) {
        return new ErrorDto("API endpoint was not found");
    }

    @ExceptionHandler(UsernameAlreadyTakenException.class)
    @ResponseStatus(value = HttpStatus.CONFLICT)
    public ErrorDto usernameAlreadyTakenExceptionHandler(HttpServletRequest request, UsernameAlreadyTakenException exception) {
        return new ErrorDto(exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorDto exceptionHandler(HttpServletRequest request, Exception exception) {
        logger.error("Exception raised = {} :: URL = {}", exception.getMessage(), request.getRequestURL());
        return new ErrorDto("Unexpected server error");
    }
}
