package com.claimswift.authservice.service;

import com.claimswift.authservice.dto.*;
import com.claimswift.authservice.entity.Role;
import com.claimswift.authservice.entity.User;
import com.claimswift.authservice.repository.RoleRepository;
import com.claimswift.authservice.repository.UserRepository;
import com.claimswift.authservice.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Authentication Service
 * Handles user registration, login, logout, and role management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role policyholderRole = roleRepository.findByName(Role.RoleName.ROLE_POLICYHOLDER)
                .orElseThrow(() -> new RuntimeException("Default policyholder role not found"));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(policyholderRole))
                .status(User.UserStatus.ACTIVE)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        String token = generateToken(savedUser);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(mapToUserDTO(savedUser))
                .build();
    }

    @Transactional
    public UserDTO createInternalUser(AdminCreateUserRequest request, String actorUsername) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Set<Role> roles = resolveRoles(request.getRoles());
        User.UserStatus status = resolveStatus(request.getStatus(), User.UserStatus.ACTIVE);

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
                .status(status)
                .emailVerified(true)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin {} created internal user {} with roles {}", actorUsername, saved.getUsername(), request.getRoles());
        return mapToUserDTO(saved);
    }

    @Transactional
    public UserDTO updateUserRoles(Long userId, Set<String> roleNames, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Set<Role> roles = resolveRoles(roleNames);
        user.setRoles(roles);
        User saved = userRepository.save(user);
        log.info("Admin {} updated roles for user {} to {}", actorUsername, saved.getUsername(), roleNames);
        return mapToUserDTO(saved);
    }

    @Transactional
    public UserDTO updateUserStatus(Long userId, String status, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User.UserStatus resolved = resolveStatus(status, user.getStatus());
        user.setStatus(resolved);
        User saved = userRepository.save(user);
        log.info("Admin {} updated status for user {} to {}", actorUsername, saved.getUsername(), resolved);
        return mapToUserDTO(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String token = generateToken(user);

        log.info("User logged in successfully: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(mapToUserDTO(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }

        String username = jwtTokenProvider.getUsernameFromToken(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = generateToken(user);
        return AuthResponse.builder()
                .accessToken(newToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(mapToUserDTO(user))
                .build();
    }

    @Transactional
    public void logout(String token) {
        jwtTokenProvider.invalidateToken(token);
        SecurityContextHolder.clearContext();
        log.info("User logged out successfully");
    }

    public UserDTO getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAdjusters() {
        return userRepository.findDistinctByRoles_Name(Role.RoleName.ROLE_ADJUSTER).stream()
                .map(this::mapToUserDTO)
                .toList();
    }

    private String generateToken(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());
        return jwtTokenProvider.generateToken(user.getId(), user.getUsername(), roles);
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet()))
                .status(user.getStatus().name())
                .emailVerified(user.getEmailVerified())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        return roleNames.stream()
                .map(this::parseRoleName)
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName)))
                .collect(Collectors.toSet());
    }

    private Role.RoleName parseRoleName(String roleName) {
        String normalized = roleName == null ? "" : roleName.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        try {
            return Role.RoleName.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role: " + roleName);
        }
    }

    private User.UserStatus resolveStatus(String status, User.UserStatus defaultStatus) {
        if (status == null || status.isBlank()) {
            return defaultStatus;
        }
        try {
            return User.UserStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }
}
