# ClaimSwift Authentication & Authorization Service Architecture

## Executive Summary

This document provides a **complete enterprise-grade authentication and authorization architecture** for the ClaimSwift insurance claims platform. The design implements defense-in-depth security, privilege escalation prevention, and scalable JWT-based authentication across microservices.

---

## 1️⃣ System Architecture

### Authentication Flow Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────────┐
│   Client    │──────▶│ API Gateway  │──────▶│Auth Service │──────▶│   MySQL DB      │
│  (Browser)  │      │  (:8080)     │      │  (:8081)    │      │  (auth_db)      │
└─────────────┘      └──────────────┘      └─────────────┘      └─────────────────┘
                              │
                              │ Validates JWT
                              ▼
                       ┌──────────────┐
                       │ Other Svcs   │
                       │ (Claims,     │
                       │  Payment,    │
                       │  Assessment) │
                       └──────────────┘
```

### JWT Issuance and Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           JWT LIFECYCLE                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  STEP 1: LOGIN                                                                      │
│  ┌──────────┐    POST /api/auth/login    ┌──────────────┐    Validate Creds       │
│  │  Client  │───────────────────────────▶│ Auth Service │◄───────────────────┐    │
│  └──────────┘                            └──────────────┘                      │    │
│                                                 │                              │    │
│                                                 ▼                              │    │
│                                          ┌──────────────┐                      │    │
│                                          │   Sign JWT   │                      │    │
│                                          │  (HS256/RS256)                     │    │
│                                          └──────────────┘                      │    │
│                                                 │                              │    │
│  STEP 2: RETURN TOKEN                           ▼                              │    │
│  ┌──────────┐    {accessToken, user}    ┌──────────────┐                      │    │
│  │  Client  │◄──────────────────────────│ Auth Service │                      │    │
│  └──────────┘                            └──────────────┘                      │    │
│       │                                                                        │    │
│       │ Store Token (HttpOnly Cookie / LocalStorage)                           │    │
│       ▼                                                                        │    │
│  ┌─────────────────────────────────────┐                                       │    │
│  │  Authorization: Bearer <jwt_token>  │                                       │    │
│  └─────────────────────────────────────┘                                       │    │
│                                                                                  │    │
│  STEP 3: API REQUEST                                                             │    │
│  ┌──────────┐    Bearer Token          ┌──────────────┐    Validate Signature   │    │
│  │  Client  │──────────────────────────▶│ API Gateway  │────────────────────────┘    │
│  └──────────┘                            └──────────────┘                           │
│                                                 │                                   │
│                                                 ▼                                   │
│                                          ┌──────────────┐                          │
│                                          │ Extract Claims│                          │
│                                          │ - userId      │                          │
│                                          │ - username    │                          │
│                                          │ - roles[]     │                          │
│                                          └──────────────┘                          │
│                                                 │                                   │
│  STEP 4: FORWARD TO SERVICE                     ▼                                   │
│  ┌──────────┐    X-User-Id: 123         ┌──────────────┐                          │
│  │  Service │◄──────────────────────────│ API Gateway  │                          │
│  └──────────┘    X-User-Role: ADMIN     └──────────────┘                          │
│       │                                         ▲                                  │
│       │ Validate Roles via @PreAuthorize        │                                  │
│       └─────────────────────────────────────────┘                                  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Components

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **API Gateway** | Route requests, JWT validation, header enrichment | Spring Cloud Gateway |
| **Auth Service** | User registration, login, token generation, user management | Spring Boot + Spring Security |
| **Eureka** | Service discovery and registration | Netflix Eureka |
| **Config Server** | Centralized configuration management | Spring Cloud Config |
| **MySQL** | Persistent user and role storage | MySQL 8.0 |

---

## 2️⃣ User Registration Flow

### Security Rule
> **CRITICAL**: Public registration **ONLY** creates `ROLE_POLICYHOLDER`. Privileged roles (`ROLE_ADJUSTER`, `ROLE_MANAGER`, `ROLE_ADMIN`) can **ONLY** be assigned via admin endpoints.

### Registration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC REGISTRATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐                                                               │
│  │  Client  │ POST /api/auth/register                                       │
│  └────┬─────┘                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  REGISTRATION REQUEST (NO ROLE FIELD ALLOWED)                   │       │
│  │  {                                                              │       │
│  │    "username": "john_doe",     ← 3-50 chars, unique             │       │
│  │    "email": "john@example.com", ← valid email, unique           │       │
│  │    "password": "SecureP@ss123", ← 8+ chars                      │       │
│  │    "firstName": "John",                                         │       │
│  │    "lastName": "Doe",                                           │       │
│  │    "phoneNumber": "+1234567890"  ← optional                     │       │
│  │  }                                                              │       │
│  │                                                                 │       │
│  │  ❌ NO "role" field allowed in request                          │       │
│  │  ❌ NO "roles" field allowed in request                         │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  AUTH SERVICE VALIDATION                                        │       │
│  │  ─────────────────────                                          │       │
│  │  1. Validate request body (@Valid)                              │       │
│  │  2. Check username uniqueness                                   │       │
│  │  3. Check email uniqueness                                      │       │
│  │  4. ❌ REJECT if any role field present                         │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  AUTO-ASSIGN ROLE_POLICYHOLDER                                  │       │
│  │  ─────────────────────────────                                  │       │
│  │  Role role = roleRepository.findByName(ROLE_POLICYHOLDER)       │       │
│  │  user.setRoles(Set.of(role))  ← HARD-CODED, NO OVERRIDE         │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  RESPONSE                                                       │       │
│  │  {                                                              │       │
│  │    "code": "SUCCESS",                                           │       │
│  │    "message": "User registered successfully",                   │       │
│  │    "data": {                                                    │       │
│  │      "accessToken": "eyJhbGciOiJIUzI1NiIs...",                  │       │
│  │      "tokenType": "Bearer",                                     │       │
│  │      "expiresIn": 86400000,                                     │       │
│  │      "user": {                                                  │       │
│  │        "id": 15,                                                │       │
│  │        "username": "john_doe",                                  │       │
│  │        "email": "john@example.com",                             │       │
│  │        "roles": ["ROLE_POLICYHOLDER"],  ← ONLY THIS ROLE        │       │
│  │        "status": "ACTIVE"                                       │       │
│  │      }                                                          │       │
│  │    }                                                            │       │
│  │  }                                                              │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Code

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validate username/email uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        // 2. SECURITY: Hard-code ROLE_POLICYHOLDER - ignore any role in request
        Role policyholderRole = roleRepository.findByName(Role.RoleName.ROLE_POLICYHOLDER)
                .orElseThrow(() -> new SystemException("Default role not found"));

        // 3. Create user with ONLY policyholder role
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(policyholderRole))  // ← HARD-CODED
                .status(User.UserStatus.ACTIVE)
                .emailVerified(false)
                .build();

        User savedUser = userRepository.save(user);
        
        // 4. Generate and return JWT
        String token = generateToken(savedUser);
        
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(mapToUserDTO(savedUser))
                .build();
    }
}
```

### Request/Response Examples

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Success Response (201 Created):**
```json
{
  "code": "SUCCESS",
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 15,
      "username": "john_doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "+1234567890",
      "roles": ["ROLE_POLICYHOLDER"],
      "status": "ACTIVE",
      "emailVerified": false,
      "createdAt": "2024-01-15T10:30:00"
    }
  },
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error Response (400 Bad Request - Duplicate):**
```json
{
  "code": "DUPLICATE_RESOURCE",
  "message": "Username already exists",
  "data": null,
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f23456789012"
}
```

---

## 3️⃣ Login Flow

### Login Sequence Diagram

```
┌─────────┐          ┌──────────────┐          ┌─────────────────────┐          ┌──────────────┐
│ Client  │          │ Auth Service │          │ AuthenticationManager│          │  Database    │
└────┬────┘          └──────┬───────┘          └──────────┬──────────┘          └──────┬───────┘
     │                      │                              │                          │
     │ POST /api/auth/login │                              │                          │
     │─────────────────────▶│                              │                          │
     │                      │                              │                          │
     │                      │ authenticate()               │                          │
     │                      │─────────────────────────────▶│                          │
     │                      │                              │                          │
     │                      │                              │ loadUserByUsername()     │
     │                      │                              │─────────────────────────▶│
     │                      │                              │                          │
     │                      │                              │◀─────────────────────────│
     │                      │                              │     UserDetails          │
     │                      │                              │                          │
     │                      │                              │ PasswordEncoder.matches()│
     │                      │                              │─────────────────────────▶│
     │                      │                              │◀─────────────────────────│
     │                      │                              │     true/false           │
     │                      │                              │                          │
     │                      │◀─────────────────────────────│ Authentication           │
     │                      │                              │                          │
     │                      │                              │                          │
     │                      │ findByUsernameOrEmail()                                 │
     │                      │────────────────────────────────────────────────────────▶│
     │                      │◀────────────────────────────────────────────────────────│
     │                      │     User entity                                        │
     │                      │                                                         │
     │                      │ updateLastLoginAt()                                     │
     │                      │────────────────────────────────────────────────────────▶│
     │                      │                                                         │
     │                      │ generateToken()                                         │
     │                      │──────────┐                                              │
     │                      │          │ Create JWT payload                           │
     │                      │          │ { sub, userId, username, roles, iat, exp }   │
     │                      │◀─────────┘                                              │
     │                      │                                                         │
     │  200 OK + AuthResponse                                                        │
     │◀─────────────────────│                                                         │
     │                      │                                                         │
```

### Login Implementation

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate credentials
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsernameOrEmail(),
                request.getPassword()
            )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // 2. Load user details
        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(), 
                request.getUsernameOrEmail()
            )
            .orElseThrow(() -> new AuthenticationException("User not found"));
        
        // 3. Check user status
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AccountStatusException("Account is " + user.getStatus());
        }
        
        // 4. Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        // 5. Generate JWT with roles
        String token = generateToken(user);
        
        log.info("User logged in: {}", user.getUsername());
        
        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getExpirationTime())
            .user(mapToUserDTO(user))
            .build();
    }
    
    private String generateToken(User user) {
        Set<String> roles = user.getRoles().stream()
            .map(r -> r.getName().name())
            .collect(Collectors.toSet());
            
        return jwtTokenProvider.generateToken(
            user.getId(), 
            user.getUsername(), 
            roles
        );
    }
}
```

### JWT Token Provider

```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration:86400000}") // 24 hours
    private long jwtExpirationInMs;
    
    private final Set<String> invalidatedTokens = ConcurrentHashMap.newKeySet();
    
    public String generateToken(Long userId, String username, Set<String> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);
        
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("userId", userId)
            .claim("username", username)
            .claim("roles", roles)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }
    
    public boolean validateToken(String token) {
        if (token == null || invalidatedTokens.contains(token)) {
            return false;
        }
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.warn("JWT token is expired");
        } catch (UnsupportedJwtException ex) {
            log.warn("JWT token is unsupported");
        } catch (MalformedJwtException ex) {
            log.warn("JWT token is malformed");
        } catch (SignatureException ex) {
            log.warn("JWT signature validation failed");
        } catch (IllegalArgumentException ex) {
            log.warn("JWT token is empty or null");
        }
        return false;
    }
    
    public void invalidateToken(String token) {
        invalidatedTokens.add(token);
    }
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}
```

### Login Request/Response Examples

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "john_doe",
  "password": "SecureP@ss123"
}
```

**Success Response (200 OK):**
```json
{
  "code": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNSIsInVzZXJJZCI6MTUsInVzZXJuYW1lIjoiam9obl9kb2UiLCJyb2xlcyI6WyJST0xFX1BPTElDWUhPTERFUiJdLCJpYXQiOjE3MTAwMDAwMDAsImV4cCI6MTcxMDA4NjQwMH0...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "user": {
      "id": 15,
      "username": "john_doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["ROLE_POLICYHOLDER"],
      "status": "ACTIVE",
      "lastLoginAt": "2024-01-15T14:30:00"
    }
  },
  "requestId": "c3d4e5f6-a7b8-9012-cdef-345678901234"
}
```

---

## 4️⃣ Admin User Management

### Admin Endpoints Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ADMIN ENDPOINT SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  LAYER 1: API GATEWAY                                                           │
│  ─────────────────                                                              │
│  • Route to auth-service                                                        │
│  • JWT validation                                                               │
│  • Header enrichment (X-User-Id, X-User-Role)                                   │
│                                                                                 │
│  LAYER 2: AUTH SERVICE SECURITY CONFIG                                          │
│  ────────────────────────────────                                               │
│  • @PreAuthorize("hasRole('ADMIN')") on all admin endpoints                     │
│  • Method-level security                                                        │
│  • Role hierarchy: ROLE_ADMIN > ROLE_MANAGER > ROLE_ADJUSTER > ROLE_POLICYHOLDER│
│                                                                                 │
│  LAYER 3: SERVICE LAYER VALIDATION                                              │
│  ───────────────────────────────                                                │
│  • Verify actor has ADMIN role (defense in depth)                               │
│  • Audit logging of all admin actions                                           │
│  • Validate role assignments against whitelist                                  │
│                                                                                 │
│  LAYER 4: DATABASE CONSTRAINTS                                                  │
│  ───────────────────────────                                                    │
│  • Foreign key constraints                                                      │
│  • Role enum validation                                                         │
│  • Unique constraints on username/email                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Admin Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/admin/users` | POST | ROLE_ADMIN | Create privileged users (Adjuster, Manager, Admin) |
| `/api/auth/admin/users/{id}/roles` | PUT | ROLE_ADMIN | Update user roles |
| `/api/auth/admin/users/{id}/status` | PATCH | ROLE_ADMIN | Activate/Deactivate/Suspend user |
| `/api/auth/admin/users` | GET | ROLE_ADMIN | List all users |
| `/api/auth/admin/users/{id}` | GET | ROLE_ADMIN | Get user details |

### Admin Controller Implementation

```java
@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminController {
    
    private final AuthService authService;
    
    /**
     * Create internal users with privileged roles
     * ONLY accessible to ROLE_ADMIN
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StandardResponse<UserDTO>> createInternalUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            @RequestAttribute("username") String actorUsername) {
        
        UserDTO user = authService.createInternalUser(request, actorUsername);
        
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(StandardResponse.success("User created successfully", user));
    }
    
    /**
     * Update user roles - can assign any valid role combination
     * ONLY accessible to ROLE_ADMIN
     */
    @PutMapping("/users/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StandardResponse<UserDTO>> updateUserRoles(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UserRoleUpdateRequest request,
            @RequestAttribute("username") String actorUsername) {
        
        UserDTO user = authService.updateUserRoles(userId, request.getRoles(), actorUsername);
        
        return ResponseEntity.ok(StandardResponse.success("User roles updated", user));
    }
    
    /**
     * Update user status (ACTIVE, INACTIVE, SUSPENDED)
     */
    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StandardResponse<UserDTO>> updateUserStatus(
            @PathVariable("id") Long userId,
            @Valid @RequestBody UserStatusUpdateRequest request,
            @RequestAttribute("username") String actorUsername) {
        
        UserDTO user = authService.updateUserStatus(userId, request.getStatus(), actorUsername);
        
        return ResponseEntity.ok(StandardResponse.success("User status updated", user));
    }
}
```

### Admin Create User Request/Response

**Create Manager Request:**
```http
POST /api/auth/admin/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "username": "manager_smith",
  "email": "manager.smith@claimswift.com",
  "password": "MgrSecure@2024",
  "firstName": "Sarah",
  "lastName": "Smith",
  "phoneNumber": "+1987654321",
  "roles": ["ROLE_MANAGER"],
  "status": "ACTIVE"
}
```

**Create Admin Request:**
```http
POST /api/auth/admin/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "username": "admin_jones",
  "email": "admin.jones@claimswift.com",
  "password": "Adm1n$Secure",
  "firstName": "Michael",
  "lastName": "Jones",
  "roles": ["ROLE_ADMIN"],
  "status": "ACTIVE"
}
```

**Create Adjuster Request:**
```http
POST /api/auth/admin/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "username": "adjuster_wilson",
  "email": "adjuster.wilson@claimswift.com",
  "password": "Adjuster@789",
  "firstName": "Robert",
  "lastName": "Wilson",
  "phoneNumber": "+1122334455",
  "roles": ["ROLE_ADJUSTER"],
  "status": "ACTIVE"
}
```

**Success Response (201 Created):**
```json
{
  "code": "SUCCESS",
  "message": "User created successfully",
  "data": {
    "id": 42,
    "username": "adjuster_wilson",
    "email": "adjuster.wilson@claimswift.com",
    "firstName": "Robert",
    "lastName": "Wilson",
    "phoneNumber": "+1122334455",
    "roles": ["ROLE_ADJUSTER"],
    "status": "ACTIVE",
    "emailVerified": true,
    "createdAt": "2024-01-15T16:45:00"
  },
  "requestId": "d4e5f6a7-b8c9-0123-defa-456789012345"
}
```

**Forbidden Response (non-admin trying to access):**
```json
{
  "code": "ACCESS_DENIED",
  "message": "Access is denied",
  "data": null,
  "requestId": "e5f6a7b8-c9d0-1234-efab-567890123456"
}
```

---

## 5️⃣ Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────┐         ┌─────────────────────┐                       │
│  │       users         │         │       roles         │                       │
│  ├─────────────────────┤         ├─────────────────────┤                       │
│  │ PK id (BIGINT)      │◄────┐   │ PK id (BIGINT)      │                       │
│  │    username (VARCHAR│     │   │    name (ENUM)      │                       │
│  │    email (VARCHAR)  │     │   │    description      │                       │
│  │    password (VARCHAR│     │   │    created_at       │                       │
│  │    first_name       │     │   │    updated_at       │                       │
│  │    last_name        │     └───┤                     │                       │
│  │    phone_number     │         └─────────────────────┘                       │
│  │    status (ENUM)    │                                                       │
│  │    email_verified   │         ┌─────────────────────┐                       │
│  │    last_login_at    │         │    user_roles       │                       │
│  │    created_at       │         ├─────────────────────┤                       │
│  │    updated_at       │◄────┐   │ PK user_id (BIGINT) │                       │
│  └─────────────────────┘     └──►│ PK role_id (BIGINT) │                       │
│                                  └─────────────────────┘                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### MySQL Schema

```sql
-- =====================================================
-- ClaimSwift Auth Service Database Schema
-- =====================================================

CREATE DATABASE IF NOT EXISTS claimswift_auth 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE claimswift_auth;

-- -----------------------------------------------------
-- Table: roles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('ROLE_ADMIN', 'ROLE_POLICYHOLDER', 'ROLE_ADJUSTER', 'ROLE_MANAGER') 
        NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') 
        DEFAULT 'ACTIVE' NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone_number),
    INDEX idx_users_status (status),
    INDEX idx_users_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: user_roles (Many-to-Many Junction)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role 
        FOREIGN KEY (role_id) REFERENCES roles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_roles_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Seed Data: Default Roles
-- -----------------------------------------------------
INSERT INTO roles (name, description) VALUES
('ROLE_ADMIN', 'System administrator with full access to all operations'),
('ROLE_POLICYHOLDER', 'Policyholder can submit and track own claims'),
('ROLE_ADJUSTER', 'Adjuster can review claims and process decisions'),
('ROLE_MANAGER', 'Manager can assign claims and access reports')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- -----------------------------------------------------
-- Create Default Admin User (password: 'Admin@123')
-- Change password immediately after first login!
-- -----------------------------------------------------
INSERT INTO users (username, email, password, first_name, last_name, status, email_verified)
SELECT * FROM (SELECT 
    'system_admin' as username,
    'admin@claimswift.com' as email,
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1G2JH8YpfB0Bqy' as password, -- Admin@123
    'System' as first_name,
    'Administrator' as last_name,
    'ACTIVE' as status,
    TRUE as email_verified
) AS tmp
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'system_admin'
) LIMIT 1;

-- Assign ADMIN role to default admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'system_admin' 
  AND r.name = 'ROLE_ADMIN'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = u.id AND role_id = r.id
  );

-- -----------------------------------------------------
-- Security Audit Table (Optional but Recommended)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    performed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at),
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### JPA Entity Definitions

```java
// Role Entity
@Entity
@Table(name = "roles")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 50)
    private RoleName name;
    
    @Column(length = 255)
    private String description;
    
    @ManyToMany(mappedBy = "roles")
    @Builder.Default
    private Set<User> users = new HashSet<>();
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum RoleName {
        ROLE_ADMIN,
        ROLE_POLICYHOLDER,
        ROLE_ADJUSTER,
        ROLE_MANAGER
    }
}

// User Entity
@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_phone", columnList = "phone_number"),
        @Index(name = "idx_users_name", columnList = "first_name,last_name")
    }
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;
    
    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;
    
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private UserStatus status;
    
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;
    
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION
    }
}
```

---

## 6️⃣ JWT Design

### JWT Token Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         JWT TOKEN STRUCTURE                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Header (Base64Url Encoded)                                                     │
│  ─────────────────────────                                                      │
│  {                                                                              │
│    "alg": "HS512",          ← HMAC-SHA512 for symmetric signing               │
│    "typ": "JWT"                                                                 │
│  }                                                                              │
│                                                                                 │
│  Payload (Base64Url Encoded)                                                    │
│  ───────────────────────────                                                    │
│  {                                                                              │
│    "sub": "15",               ← Subject: User ID (standard claim)             │
│    "userId": 15,              ← Numeric user ID for easy access               │
│    "username": "john_doe",    ← Human-readable identifier                     │
│    "roles": ["ROLE_POLICYHOLDER"],  ← Array of all user roles                 │
│    "role": "ROLE_POLICYHOLDER",     ← Primary role (for gateway filtering)    │
│    "iat": 1710000000,         ← Issued at (Unix timestamp)                    │
│    "exp": 1710086400,         ← Expiration (24 hours default)                 │
│    "jti": "uuid-v4"           ← JWT ID for token revocation (optional)        │
│  }                                                                              │
│                                                                                 │
│  Signature                                                                      │
│  ─────────                                                                      │
│  HMACSHA512(                                                                    │
│    base64UrlEncode(header) + "." +                                            │
│    base64UrlEncode(payload),                                                    │
│    secret_key                                                                   │
│  )                                                                              │
│                                                                                 │
│  Final Token: header.payload.signature                                          │
│  eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNSJ9...signature            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### JWT Token Payload Example

```json
{
  "sub": "15",
  "userId": 15,
  "username": "john_doe",
  "roles": ["ROLE_POLICYHOLDER"],
  "role": "ROLE_POLICYHOLDER",
  "iat": 1710000000,
  "exp": 1710086400,
  "jti": "550e8400-e29b-41d4-a716-446655440000"
}
```

### JWT Validation Flow in Microservices

```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * Extract all claims from token
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
    
    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("username", String.class);
    }
    
    /**
     * Extract user ID from token
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object userId = claims.get("userId");
        if (userId instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(claims.getSubject());
    }
    
    /**
     * Extract authorities/roles from token
     */
    public Collection<? extends GrantedAuthority> extractAuthorities(String token) {
        Claims claims = extractAllClaims(token);
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        if (roles != null) {
            roles.stream()
                .map(SimpleGrantedAuthority::new)
                .forEach(authorities::add);
        }
        return authorities;
    }
    
    /**
     * Validate token signature and expiration
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }
}
```

### Token Refresh Strategy

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    
    /**
     * Refresh token - issue new token if current is valid
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String token) {
        // 1. Validate current token
        if (!jwtTokenProvider.validateToken(token)) {
            throw new InvalidTokenException("Invalid or expired token");
        }
        
        // 2. Extract user info
        String username = jwtTokenProvider.getUsernameFromToken(token);
        
        // 3. Verify user still exists and is active
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
            
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new AccountStatusException("Account is not active");
        }
        
        // 4. Check if token is blacklisted
        if (jwtTokenProvider.isTokenBlacklisted(token)) {
            throw new InvalidTokenException("Token has been revoked");
        }
        
        // 5. Generate new token
        String newToken = generateToken(user);
        
        // 6. Blacklist old token (optional - for security)
        jwtTokenProvider.invalidateToken(token);
        
        return AuthResponse.builder()
            .accessToken(newToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getExpirationTime())
            .user(mapToUserDTO(user))
            .build();
    }
}
```

---

## 7️⃣ Spring Security Implementation

### Security Components Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SPRING SECURITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     SECURITY FILTER CHAIN                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │   Request ──▶ CorrelationIdFilter ──▶ JwtAuthenticationFilter ──▶ ... │   │
│  │                (Add trace ID)          (Validate JWT & set context)     │   │
│  │                                                                         │   │
│  │   ... ──▶ UsernamePasswordAuthenticationFilter ──▶ SecurityContext     │   │
│  │                              (Standard Spring Security)                 │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     KEY COMPONENTS                                      │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                    │   │
│  │  │ UserDetailsService  │    │ JwtTokenProvider    │                    │   │
│  │  │ ─────────────────── │    │ ─────────────────── │                    │   │
│  │  │ loadUserByUsername()│    │ generateToken()     │                    │   │
│  │  │ • Load from DB      │    │ validateToken()     │                    │   │
│  │  │ • Check status      │    │ extractClaims()     │                    │   │
│  │  │ • Map roles         │    │ invalidateToken()   │                    │   │
│  │  └─────────────────────┘    └─────────────────────┘                    │   │
│  │                                                                         │   │
│  │  ┌─────────────────────┐    ┌─────────────────────┐                    │   │
│  │  │ AuthenticationManager│   │ PasswordEncoder     │                    │   │
│  │  │ ─────────────────── │    │ ─────────────────── │                    │   │
│  │  │ authenticate()      │    │ BCryptPasswordEncoder│                   │   │
│  │  │ • Credential check  │    │ • Hash passwords    │                    │   │
│  │  │ • Delegate providers│    │ • Verify matches    │                    │   │
│  │  └─────────────────────┘    └─────────────────────┘                    │   │
│  │                                                                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │ RoleHierarchy                                                    │   │   │
│  │  │ ─────────────                                                    │   │   │
│  │  │ ROLE_ADMIN > ROLE_MANAGER > ROLE_ADJUSTER > ROLE_POLICYHOLDER   │   │   │
│  │  │                                                                  │   │   │
│  │  │ Implication: ADMIN inherits all permissions                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    /**
     * Main security filter chain configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (stateless JWT)
            .csrf(csrf -> csrf.disable())
            
            // Stateless session management
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // URL-based authorization
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register", 
                    "/api/auth/refresh",
                    "/api/auth/health"
                ).permitAll()
                
                // Actuator endpoints
                .requestMatchers(
                    "/actuator/health",
                    "/actuator/info",
                    "/actuator/prometheus"
                ).permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            
            // Authentication provider
            .authenticationProvider(authenticationProvider())
            
            // Add JWT filter before standard auth filter
            .addFilterBefore(jwtAuthenticationFilter, 
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * DAO Authentication Provider
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * BCrypt password encoder (strength 10)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * Authentication manager for programmatic authentication
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Role hierarchy configuration
     * Admin inherits all permissions from lower roles
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl roleHierarchy = new RoleHierarchyImpl();
        roleHierarchy.setHierarchy("""
            ROLE_ADMIN > ROLE_MANAGER
            ROLE_MANAGER > ROLE_ADJUSTER
            ROLE_ADJUSTER > ROLE_POLICYHOLDER
            """);
        return roleHierarchy;
    }

    /**
     * Method security expression handler with role hierarchy
     */
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(
            RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler expressionHandler = 
            new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setRoleHierarchy(roleHierarchy);
        return expressionHandler;
    }
}
```

### Custom UserDetailsService

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) 
            throws UsernameNotFoundException {
        
        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
            .orElseThrow(() -> new UsernameNotFoundException(
                "User not found with identifier: " + usernameOrEmail));
        
        // Check account status
        if (user.getStatus() == User.UserStatus.INACTIVE) {
            throw new DisabledException("Account is inactive. Please contact support.");
        }
        
        if (user.getStatus() == User.UserStatus.SUSPENDED) {
            throw new LockedException("Account has been suspended.");
        }
        
        if (user.getStatus() == User.UserStatus.PENDING_VERIFICATION) {
            throw new DisabledException("Account pending email verification.");
        }
        
        // Map roles to authorities
        Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority(role.getName().name()))
            .collect(Collectors.toSet());
        
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),
            user.getStatus() == User.UserStatus.ACTIVE,
            true,  // accountNonExpired
            true,  // credentialsNonExpired
            true,  // accountNonLocked
            authorities
        );
    }
}
```

### JWT Authentication Filter

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response, 
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            // 1. Extract JWT from request
            String jwt = getJwtFromRequest(request);
            
            // 2. Validate and authenticate
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                
                // Extract claims
                String username = jwtTokenProvider.getUsernameFromToken(jwt);
                Long userId = jwtTokenProvider.getUserIdFromToken(jwt);
                
                // Load user details
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                // Create authentication token
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                
                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Set security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Add user info to request attributes for controllers
                request.setAttribute("userId", userId);
                request.setAttribute("username", username);
                
                log.debug("Authenticated user: {}, URI: {}", username, request.getRequestURI());
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }
        
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Skip filter for public endpoints
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/refresh") ||
               path.startsWith("/actuator/");
    }
}
```

---

## 8️⃣ Role-Based Access Control (RBAC)

### Permission Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ROLE PERMISSION MATRIX                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Endpoint                          │ POLICYHOLDER │ ADJUSTER │ MANAGER │ ADMIN │
│  ──────────────────────────────────┼──────────────┼──────────┼─────────┼───────┤
│                                                                                 │
│  AUTH SERVICE                                                                   │
│  POST /api/auth/register           │      ✓       │    ✓     │    ✓    │   ✓   │
│  POST /api/auth/login              │      ✓       │    ✓     │    ✓    │   ✓   │
│  GET  /api/auth/me                 │      ✓       │    ✓     │    ✓    │   ✓   │
│  POST /api/auth/logout             │      ✓       │    ✓     │    ✓    │   ✓   │
│  POST /api/auth/admin/users        │      ✗       │    ✗     │    ✗    │   ✓   │
│  PUT  /api/auth/admin/users/{id}/* │      ✗       │    ✗     │    ✗    │   ✓   │
│                                                                                 │
│  CLAIM SERVICE                                                                  │
│  POST /api/claims                  │      ✓       │    ✓     │    ✓    │   ✓   │
│  GET  /api/claims/my-claims        │      ✓       │    ✗     │    ✗    │   ✓   │
│  GET  /api/claims                  │      ✗       │    ✓     │    ✓    │   ✓   │
│  PUT  /api/claims/{id}             │      ✗       │    ✓     │    ✓    │   ✓   │
│  PATCH /api/claims/{id}/assign     │      ✗       │    ✗     │    ✓    │   ✓   │
│  DELETE /api/claims/{id}           │      ✗       │    ✗     │    ✗    │   ✓   │
│                                                                                 │
│  ASSESSMENT SERVICE                                                             │
│  POST /api/assessments             │      ✗       │    ✓     │    ✓    │   ✓   │
│  GET  /api/assessments             │      ✗       │    ✓     │    ✓    │   ✓   │
│  PUT  /api/assessments/{id}        │      ✗       │    ✓     │    ✓    │   ✓   │
│                                                                                 │
│  PAYMENT SERVICE                                                                │
│  POST /api/payments                │      ✗       │    ✗     │    ✓    │   ✓   │
│  GET  /api/payments                │      ✗       │    ✗     │    ✓    │   ✓   │
│                                                                                 │
│  REPORTING SERVICE                                                              │
│  GET  /api/reports/*               │      ✗       │    ✓     │    ✓    │   ✓   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### RBAC Implementation Examples

```java
/**
 * ClaimController - Demonstrates comprehensive RBAC
 */
@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    /**
     * Policyholders submit their own claims
     * Admins can submit on behalf (for support purposes)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> submitClaim(
            @Valid @RequestBody ClaimRequest request,
            @RequestAttribute("userId") Long claimantId,
            @RequestAttribute("username") String username) {
        
        ClaimResponse response = claimService.submitClaim(request, claimantId, username);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(StandardResponse.success("Claim submitted", response));
    }

    /**
     * Policyholders can only view their own claims
     */
    @GetMapping("/my-claims")
    @PreAuthorize("hasRole('POLICYHOLDER')")
    public ResponseEntity<StandardResponse<List<ClaimResponse>>> getMyClaims(
            @RequestAttribute("userId") Long claimantId) {
        
        List<ClaimResponse> responses = claimService.getClaimsByClaimant(claimantId);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    /**
     * Adjusters and Managers can view all claims (with pagination)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADJUSTER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<Page<ClaimResponse>>> getAllClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<ClaimResponse> responses = claimService.getClaimsPage(page, size);
        return ResponseEntity.ok(StandardResponse.success(responses));
    }

    /**
     * Only Managers can assign claims to adjusters
     */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<StandardResponse<ClaimResponse>> assignClaim(
            @PathVariable Long id,
            @RequestParam Long adjusterId,
            @RequestAttribute("username") String assignedBy) {
        
        ClaimResponse response = claimService.assignClaim(id, adjusterId, assignedBy);
        return ResponseEntity.ok(StandardResponse.success("Claim assigned", response));
    }

    /**
     * Only Admins can delete claims
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StandardResponse<Void>> deleteClaim(@PathVariable Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok(StandardResponse.success("Claim deleted", null));
    }
}
```

### Data-Level Security (Service Layer)

```java
@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;

    /**
     * Policyholders can only access their own claims
     */
    @PreAuthorize("hasRole('POLICYHOLDER')")
    public List<ClaimResponse> getClaimsByClaimant(Long claimantId) {
        // Verify the requesting user is accessing their own data
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        
        User currentUser = userRepository.findByUsername(currentUsername)
            .orElseThrow(() -> new AuthenticationException("User not found"));
            
        // Extra security: ensure user can only see their own claims
        if (!currentUser.getId().equals(claimantId)) {
            throw new AccessDeniedException("Cannot access other user's claims");
        }
        
        return claimRepository.findByClaimantId(claimantId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Get claim by ID with ownership check for policyholders
     */
    @PreAuthorize("hasAnyRole('POLICYHOLDER', 'ADJUSTER', 'MANAGER', 'ADMIN')")
    public ClaimResponse getClaimById(Long id) {
        Claim claim = claimRepository.findById(id)
            .orElseThrow(() -> new ClaimNotFoundException("Claim not found"));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isPolicyholder = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_POLICYHOLDER"));
        
        // If policyholder, verify ownership
        if (isPolicyholder) {
            User currentUser = getCurrentUser();
            if (!claim.getClaimantId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Not authorized to view this claim");
            }
        }
        
        return mapToResponse(claim);
    }
}
```

### Custom Permission Evaluator (Advanced)

```java
@Component
public class ClaimPermissionEvaluator implements PermissionEvaluator {

    private final ClaimRepository claimRepository;

    @Override
    public boolean hasPermission(Authentication authentication, 
                                  Object targetDomain, 
                                  Object permission) {
        
        if (targetDomain instanceof Claim claim) {
            return hasClaimPermission(authentication, claim, (String) permission);
        }
        
        if (targetDomain instanceof Long claimId) {
            return claimRepository.findById(claimId)
                .map(claim -> hasClaimPermission(authentication, claim, (String) permission))
                .orElse(false);
        }
        
        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication,
                                  Serializable targetId,
                                  String targetType,
                                  Object permission) {
        return false;
    }

    private boolean hasClaimPermission(Authentication auth, Claim claim, String permission) {
        String username = auth.getName();
        
        // Admin can do anything
        if (hasRole(auth, "ROLE_ADMIN")) {
            return true;
        }
        
        // Owner can view/update their own claim
        if ("READ".equals(permission) || "UPDATE".equals(permission)) {
            if (claim.getClaimantUsername().equals(username)) {
                return true;
            }
        }
        
        // Adjuster assigned to claim
        if (hasRole(auth, "ROLE_ADJUSTER") && claim.getAdjusterUsername() != null) {
            if (claim.getAdjusterUsername().equals(username)) {
                return permission.equals("READ") || permission.equals("UPDATE");
            }
        }
        
        // Manager can view all claims in their department
        if (hasRole(auth, "ROLE_MANAGER")) {
            return permission.equals("READ") || permission.equals("ASSIGN");
        }
        
        return false;
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(role));
    }
}
```

---

## 9️⃣ Microservices JWT Validation

### Architecture Options

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES JWT VALIDATION OPTIONS                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OPTION 1: Gateway-First Validation (RECOMMENDED)                               │
│  ────────────────────────────────────────────────                               │
│                                                                                 │
│   Client ──▶ Gateway ──[Validate JWT]──▶ Service                                │
│                    │                     │                                      │
│                    │                     └── Re-validate (defense in depth)     │
│                    │                                                            │
│                    └── Add headers: X-User-Id, X-Username, X-Roles              │
│                                                                                 │
│  Pros:                                                                          │
│  • Centralized validation                                                       │
│  • Reduced load on services                                                     │
│  • Single point for token blacklisting                                          │
│                                                                                 │
│  Cons:                                                                          │
│  • Services must trust gateway headers                                          │
│  • Additional validation needed for direct access                               │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  OPTION 2: Self-Validation (Most Secure)                                        │
│  ───────────────────────────────────────                                        │
│                                                                                 │
│   Client ──▶ Gateway ──[Pass-through]──▶ Service                                │
│                                               │                                 │
│                                               └── Validate JWT locally          │
│                                                                                 │
│  Pros:                                                                          │
│  • Each service validates independently                                         │
│  • Works with direct service-to-service calls                                   │
│  • No trust assumptions                                                         │
│                                                                                 │
│  Cons:                                                                          │
│  • Duplicated validation logic                                                  │
│  • Higher latency                                                               │
│  • Shared secret management complexity                                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Recommended: Hybrid Approach

```java
/**
 * API Gateway Filter - Centralized JWT Validation
 */
@Component
@Slf4j
public class GlobalJwtAuthFilter extends AbstractGatewayFilterFactory<Config> {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public GlobalJwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // Skip auth for public paths
            if (isPublicPath(request.getPath().value())) {
                return chain.filter(exchange);
            }
            
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
            }
            
            String token = authHeader.substring(7);
            
            try {
                // Validate JWT
                Claims claims = validateAndExtractClaims(token);
                
                // Enrich request with user info
                ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", claims.get("userId", String.class))
                    .header("X-Username", claims.get("username", String.class))
                    .header("X-User-Roles", String.join(",", 
                        claims.get("roles", List.class)))
                    .build();
                
                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (ExpiredJwtException e) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Token has expired");
            } catch (JwtException e) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Invalid token");
            }
        };
    }

    private Claims validateAndExtractClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private boolean isPublicPath(String path) {
        return path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/refresh") ||
               path.startsWith("/actuator/");
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        String body = String.format("{\"code\":\"%s\",\"message\":\"%s\"}", 
            status.name(), message);
        
        return response.writeWith(Mono.just(
            response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    public static class Config {
        // Configuration properties if needed
    }
}
```

### Service-Level JWT Filter (Defense in Depth)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                      HttpServletResponse response,
                                      FilterChain filterChain) throws ServletException, IOException {
        try {
            // Try to get token from header first
            String jwt = getJwtFromRequest(request);
            
            // If no token in header, check if gateway passed user info
            if (jwt == null && request.getHeader("X-User-Id") != null) {
                // Gateway has validated - trust the headers
                setupAuthenticationFromHeaders(request);
            } else if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
                // Validate locally
                setupAuthenticationFromToken(request, jwt);
            }
        } catch (Exception ex) {
            log.error("JWT processing error", ex);
        }

        filterChain.doFilter(request, response);
    }

    private void setupAuthenticationFromHeaders(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        String username = request.getHeader("X-Username");
        String rolesHeader = request.getHeader("X-User-Roles");
        
        List<SimpleGrantedAuthority> authorities = Arrays.stream(rolesHeader.split(","))
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
        
        UsernamePasswordAuthenticationToken auth = 
            new UsernamePasswordAuthenticationToken(
                username, null, authorities);
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        SecurityContextHolder.getContext().setAuthentication(auth);
        request.setAttribute("userId", Long.parseLong(userId));
        request.setAttribute("username", username);
    }

    private void setupAuthenticationFromToken(HttpServletRequest request, String jwt) {
        String username = jwtTokenProvider.extractUsername(jwt);
        Long userId = jwtTokenProvider.extractUserId(jwt);
        var authorities = jwtTokenProvider.extractAuthorities(jwt);
        
        UsernamePasswordAuthenticationToken auth = 
            new UsernamePasswordAuthenticationToken(
                username, null, authorities);
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        
        SecurityContextHolder.getContext().setAuthentication(auth);
        request.setAttribute("userId", userId);
        request.setAttribute("username", username);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### Shared JWT Library (Recommended for Multiple Services)

```java
/**
 * Shared JWT library that all services can include
 */
@Component
public class SharedJwtTokenProvider {
    
    private final SecretKey signingKey;
    
    public SharedJwtTokenProvider(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
    
    public Long extractUserId(String token) {
        Claims claims = extractClaims(token);
        Object userId = claims.get("userId");
        return userId instanceof Number ? ((Number) userId).longValue() : null;
    }
    
    public String extractUsername(String token) {
        return extractClaims(token).get("username", String.class);
    }
    
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return extractClaims(token).get("roles", List.class);
    }
    
    public Collection<? extends GrantedAuthority> extractAuthorities(String token) {
        return extractRoles(token).stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }
}
```

---

## 🔟 Security Best Practices

### 1. Privilege Escalation Prevention

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    /**
     * ENFORCED: Public registration can ONLY create POLICYHOLDER
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // CRITICAL: Never accept role from registration request
        // Always hard-code ROLE_POLICYHOLDER
        
        Role policyholderRole = roleRepository.findByName(Role.RoleName.ROLE_POLICYHOLDER)
            .orElseThrow(() -> new SystemException("Default role not found"));

        User user = User.builder()
            // ... other fields
            .roles(Set.of(policyholderRole))  // ← HARD-CODED
            .build();
            
        // ... save and return
    }

    /**
     * ENFORCED: Admin operations require explicit verification
     */
    @Transactional
    public UserDTO createInternalUser(AdminCreateUserRequest request, String actorUsername) {
        // 1. Verify actor exists and is ADMIN
        User actor = userRepository.findByUsername(actorUsername)
            .orElseThrow(() -> new AuthenticationException("Actor not found"));
            
        boolean isAdmin = actor.getRoles().stream()
            .anyMatch(r -> r.getName() == Role.RoleName.ROLE_ADMIN);
            
        if (!isAdmin) {
            log.warn("Non-admin {} attempted to create internal user", actorUsername);
            throw new AccessDeniedException("Admin privileges required");
        }
        
        // 2. Validate requested roles against whitelist
        Set<String> allowedRoles = Set.of(
            "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_ADJUSTER", "ROLE_POLICYHOLDER"
        );
        
        for (String role : request.getRoles()) {
            if (!allowedRoles.contains(role)) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
        }
        
        // 3. Prevent creating admin without approval (optional business rule)
        if (request.getRoles().contains("ROLE_ADMIN")) {
            log.info("Admin {} is creating another admin: {}", actorUsername, request.getUsername());
            // Could add: require second approval, notification, etc.
        }
        
        // ... create user
    }
}
```

### 2. Token Tampering Prevention

```java
@Component
public class JwtTokenProvider {
    
    // Use strong signing algorithm
    private static final SignatureAlgorithm SIGNATURE_ALGORITHM = SignatureAlgorithm.HS512;
    
    // Minimum secret length (512 bits for HS512)
    private static final int MIN_SECRET_LENGTH = 64;
    
    @PostConstruct
    public void validateSecret() {
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                "JWT secret must be at least " + MIN_SECRET_LENGTH + " bytes for HS512");
        }
    }
    
    public String generateToken(Long userId, String username, Set<String> roles) {
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("userId", userId)
            .claim("username", username)
            .claim("roles", roles)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + jwtExpirationInMs))
            .signWith(getSigningKey(), SIGNATURE_ALGORITHM)  // Strong algorithm
            .compact();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
            // Possible tampering attempt - log for security monitoring
            securityEventService.logTamperingAttempt(token);
        } catch (ExpiredJwtException e) {
            log.warn("JWT token expired");
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
        }
        return false;
    }
}
```

### 3. Header Spoofing Prevention

```java
@Component
public class HeaderValidationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                      HttpServletResponse response,
                                      FilterChain filterChain) throws ServletException, IOException {
        
        // Remove any spoofed internal headers from external requests
        HttpServletRequestWrapper wrappedRequest = new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                // Block internal headers if request came through external channel
                if (isInternalHeader(name) && isExternalRequest(request)) {
                    return null;
                }
                return super.getHeader(name);
            }
            
            @Override
            public Enumeration<String> getHeaders(String name) {
                if (isInternalHeader(name) && isExternalRequest(request)) {
                    return Collections.emptyEnumeration();
                }
                return super.getHeaders(name);
            }
        };
        
        filterChain.doFilter(wrappedRequest, response);
    }
    
    private boolean isInternalHeader(String name) {
        return name != null && (
            name.equalsIgnoreCase("X-User-Id") ||
            name.equalsIgnoreCase("X-Username") ||
            name.equalsIgnoreCase("X-User-Roles") ||
            name.equalsIgnoreCase("X-Internal-Token")
        );
    }
    
    private boolean isExternalRequest(HttpServletRequest request) {
        // Check if request came from external source (not from gateway)
        String forwardedFor = request.getHeader("X-Forwarded-For");
        return forwardedFor != null && !forwardedFor.isEmpty();
    }
}
```

### 4. Production Security Checklist

```yaml
# application-prod.yml

# JWT Configuration
jwt:
  secret: ${JWT_SECRET}  # From environment variable, NOT hardcoded
  expiration: 3600000    # 1 hour (shorter in production)
  refresh-expiration: 604800000  # 7 days for refresh tokens

# Security Headers
server:
  servlet:
    session:
      cookie:
        http-only: true
        secure: true
        same-site: strict

# Rate Limiting
resilience4j:
  ratelimiter:
    instances:
      auth:
        limit-for-period: 5
        limit-refresh-period: 1m
        timeout-duration: 0

# HTTPS Only
security:
  require-ssl: true
  
# CORS Configuration (restrictive)
cors:
  allowed-origins: ${ALLOWED_ORIGINS:https://claimswift.com}
  allowed-methods: GET,POST,PUT,DELETE,PATCH
  allowed-headers: Authorization,Content-Type,X-Request-ID
  allow-credentials: true
  max-age: 3600
```

### 5. Security Audit Logging

```java
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditAspect {

    private final AuditLogRepository auditLogRepository;

    @Around("@annotation(AdminOperation)")
    public Object logAdminOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : "anonymous";
        String method = joinPoint.getSignature().getName();
        String target = joinPoint.getTarget().getClass().getSimpleName();
        
        log.info("Admin operation: {}.{} by {}", target, method, username);
        
        AuditLog auditLog = AuditLog.builder()
            .username(username)
            .operation(method)
            .target(target)
            .timestamp(LocalDateTime.now())
            .ipAddress(RequestContextHolder.getIpAddress())
            .build();
        
        try {
            Object result = joinPoint.proceed();
            auditLog.setStatus("SUCCESS");
            return result;
        } catch (Exception e) {
            auditLog.setStatus("FAILURE");
            auditLog.setErrorMessage(e.getMessage());
            throw e;
        } finally {
            auditLogRepository.save(auditLog);
        }
    }
}

// Usage
@AdminOperation
@PostMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<UserDTO> createInternalUser(...) {
    // ...
}
```

### 6. Password Security

```java
@Configuration
public class PasswordSecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt with strength 12 (higher = more secure but slower)
        return new BCryptPasswordEncoder(12);
    }
    
    /**
     * Validate password strength
     */
    public static void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new WeakPasswordException("Password must be at least 8 characters");
        }
        
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        
        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            throw new WeakPasswordException(
                "Password must contain uppercase, lowercase, digit, and special character");
        }
        
        // Check against common passwords
        Set<String> commonPasswords = Set.of(
            "password123", "12345678", "qwerty123", "admin123"
        );
        if (commonPasswords.contains(password.toLowerCase())) {
            throw new WeakPasswordException("Password is too common");
        }
    }
}
```

---

## Summary

This architecture provides:

1. **Secure Public Registration**: Only `ROLE_POLICYHOLDER` can be self-registered
2. **Privileged Role Protection**: Admin-only endpoints for creating privileged users
3. **Defense in Depth**: Multiple layers of security validation
4. **JWT-Based Authentication**: Stateless, scalable token validation
5. **Role Hierarchy**: Clean permission inheritance (Admin > Manager > Adjuster > Policyholder)
6. **Microservices Ready**: Shared JWT validation across all services
7. **Audit Trail**: Complete logging of security events
8. **Production Hardened**: Security headers, rate limiting, HTTPS enforcement

The design prevents privilege escalation by design and provides enterprise-grade security for the ClaimSwift insurance platform.
