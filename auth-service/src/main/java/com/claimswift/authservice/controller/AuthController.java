package com.claimswift.authservice.controller;

import com.claimswift.authservice.dto.*;
import com.claimswift.authservice.service.AuthService;
import com.claimswift.authservice.util.StandardResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<StandardResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(StandardResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<StandardResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(StandardResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<StandardResponse<Void>> logout(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        authService.logout(token);
        return ResponseEntity.ok(StandardResponse.success("Logout successful", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<StandardResponse<AuthResponse>> refresh(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        AuthResponse response = authService.refreshToken(token);
        return ResponseEntity.ok(StandardResponse.success("Token refreshed", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADJUSTER', 'MANAGER')")
    public ResponseEntity<StandardResponse<UserDTO>> getCurrentUser(@RequestAttribute("userId") Long userId) {
        UserDTO user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(StandardResponse.success(user));
    }

    @GetMapping("/adjusters")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<List<UserDTO>>> getAdjusters() {
        return ResponseEntity.ok(StandardResponse.success(authService.getAdjusters()));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth Service is running");
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
