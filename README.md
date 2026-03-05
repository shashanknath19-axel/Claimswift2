# ClaimSwift - Vehicle Insurance Claims Processing Platform

## Overview
ClaimSwift is an enterprise-level microservices-based platform for processing vehicle insurance claims. Built with Spring Boot 3.x, Spring Cloud, and AngularJS.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     AngularJS Frontend                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              API Gateway (Port 8080)                        │
│         (JWT Auth, Rate Limiting, Routing)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────┐              ┌─────────────▼────────┐
│ Eureka Server  │              │   Config Server      │
│  (Port 8761)   │              │     (Port 8888)      │
└────────────────┘              └──────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│  Auth   │  │  Claim   │  │ Document │  │ Assessment   │
│ (8081)  │  │  (8082)  │  │  (8083)  │  │   (8084)     │
└─────────┘  └──────────┘  └──────────┘  └──────────────┘
    │             │             │               │
    ▼             ▼             ▼               ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│ Payment │  │Notification│  │ Reporting│  │   MySQL      │
│ (8085)  │  │  (8086)   │  │  (8087)  │  │ (Separate    │
└─────────┘  └──────────┘  └──────────┘  │  Schemas)    │
                                         └──────────────┘
```

## Prerequisites

### Required Software
1. **Java 17** - [Download](https://adoptium.net/)
2. **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
3. **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
4. **Node.js** (for frontend development) - [Download](https://nodejs.org/)

### Verify Installation
```bash
java -version          # Should show Java 17
mvn -version           # Should show Maven 3.8+
mysql --version        # Should show MySQL 8.0+
```

## Step-by-Step Setup

### Step 1: Database Setup

Connect to MySQL and create the required databases:

```sql
-- Connect to MySQL
mysql -u root -p

-- Create databases for each microservice

CREATE DATABASE claim_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE document_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE assessment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE report_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Verify databases
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### Step 2: Update Database Credentials

Edit each service's `application.yml` or config-repo files with your MySQL credentials:

Default configuration (update if your MySQL credentials are different):
- **Username**: root
- **Password**: root
- **URL**: jdbc:mysql://localhost:3306/{database_name}

### Step 3: Build All Services

Navigate to the project root and build all services:

```
# Build parent POM
cd c:/Users/shashank.nath/Desktop/Claimswift
mvn clean install -N

# Build Config Server
cd config-server
mvn clean install

# Build Eureka Server
cd ../eureka-server
mvn clean install

# Build API Gateway
cd ../api-gateway
mvn clean install

# Build all microservices
cd ../auth-service && mvn clean install
cd ../claim-service && mvn clean install
cd ../document-service && mvn clean install
cd ../assessment-service && mvn clean install
cd ../payment-service && mvn clean install
cd ../notification-service && mvn clean install
cd ../reporting-service && mvn clean install
```

Or build all at once from root:
```bash
cd c:/Users/shashank.nath/Desktop/Claimswift
mvn clean install -DskipTests
```

### Step 4: Start Services in Order

**IMPORTANT**: Services must be started in the following order:

#### Terminal 1: Config Server
```bash
cd c:/Users/shashank.nath/Desktop/Claimswift/config-server
mvn spring-boot:run
```
Wait for: `Completed initialization in X ms`

#### Terminal 2: Eureka Server
```bash
cd c:/Users/shashank.nath/Desktop/Claimswift/eureka-server
mvn spring-boot:run
```
Open browser: http://localhost:8761

#### Terminal 3: Auth Service
```bash
cd c:/Users/shashank.nath/Desktop/Claimswift/auth-service
mvn spring-boot:run
```

#### Terminal 4-10: Other Services (any order after Auth)
```bash
# Claim Service
cd c:/Users/shashank.nath/Desktop/Claimswift/claim-service
mvn spring-boot:run

# Document Service
cd c:/Users/shashank.nath/Desktop/Claimswift/document-service
mvn spring-boot:run

# Assessment Service
cd c:/Users/shashank.nath/Desktop/Claimswift/assessment-service
mvn spring-boot:run

# Payment Service
cd c:/Users/shashank.nath/Desktop/Claimswift/payment-service
mvn spring-boot:run

# Notification Service
cd c:/Users/shashank.nath/Desktop/Claimswift/notification-service
mvn spring-boot:run

# Reporting Service
cd c:/Users/shashank.nath/Desktop/Claimswift/reporting-service
mvn spring-boot:run
```

#### Terminal 11: API Gateway (Last)
```bash
cd c:/Users/shashank.nath/Desktop/Claimswift/api-gateway
mvn spring-boot:run
```

### Step 5: Verify Services

Check Eureka Dashboard: http://localhost:8761

All services should appear as registered.

### Step 6: Start Frontend

cd frontend-angular
npm install
npm start

Open `http://localhost:4200`.

### Step 7: Test APIs

Use Postman or curl to test endpoints through the gateway (port 8080).

Example login request:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
  
## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Eureka Dashboard | http://localhost:8761 | Service registry |
| Config Server | http://localhost:8888 | Configuration |
| API Gateway | http://localhost:8080 | Main entry point |
| Auth Service | http://localhost:8081 | Authentication |
| Claim Service | http://localhost:8082 | Claims management |
| Document Service | http://localhost:8083 | File uploads |
| Assessment Service | http://localhost:8084 | Claim assessment |
| Payment Service | http://localhost:8085 | Payments |
| Notification Service | http://localhost:8086 | Notifications |
| Reporting Service | http://localhost:8087 | Reports |
| Frontend | http://localhost:9000 | AngularJS UI |

## API Endpoints (via Gateway)

### Authentication
- POST http://localhost:8080/api/v1/auth/login
- POST http://localhost:8080/api/v1/auth/register
- POST http://localhost:8080/api/v1/auth/refresh

### Claims
- GET http://localhost:8080/api/v1/claims
- POST http://localhost:8080/api/v1/claims
- GET http://localhost:8080/api/v1/claims/{id}
- PUT http://localhost:8080/api/v1/claims/{id}
- PATCH http://localhost:8080/api/v1/claims/{id}/status

### Documents
- POST http://localhost:8080/api/v1/documents/claim/{claimId}
- GET http://localhost:8080/api/v1/documents/claim/{claimId}
- GET http://localhost:8080/api/v1/documents/{id}/download

### Reports
- GET http://localhost:8080/api/v1/reports/claims/summary
- GET http://localhost:8080/api/v1/reports/payments
- GET http://localhost:8080/api/v1/reports/adjusters/performance

## Default Test Users

After starting the Auth Service, register users with these roles:

1. **Policyholder** - Can submit claims, view own claims
2. **Adjuster** - Can review and process claims
3. **Manager** - Can view reports, manage adjusters
4. **Admin** - Full system access

## Troubleshooting

### Port Conflicts
If ports are already in use, update them in each service's `application.yml`:
```yaml
server:
  port: [new_port]
```

### Database Connection Issues
1. Verify MySQL is running
2. Check credentials in application.yml
3. Ensure databases exist: `SHOW DATABASES;`

### Service Registration Issues
1. Ensure Eureka Server is running first
2. Check Config Server is accessible
3. Verify bootstrap.yml has correct config server URL

### Build Errors
1. Clean Maven cache: `mvn clean`
2. Ensure Java 17 is set: `java -version`
3. Check internet connection for dependencies

## Technology Stack

- **Backend**: Java 17, Spring Boot 3.2.0, Spring Cloud 2023.0.0
- **Database**: MySQL 8.0
- **Security**: JWT (JJWT), BCrypt
- **Service Discovery**: Netflix Eureka
- **API Gateway**: Spring Cloud Gateway
- **Frontend**: AngularJS 1.8.2, Bootstrap 5
- **PDF Generation**: OpenPDF
- **Real-time**: WebSocket STOMP

## Project Structure

```
Claimswift/
├── pom.xml (Parent POM)
├── README.md
├── config-server/ (Port 8888)
├── eureka-server/ (Port 8761)
├── api-gateway/ (Port 8080)
├── auth-service/ (Port 8081)
├── claim-service/ (Port 8082)
├── document-service/ (Port 8083)
├── assessment-service/ (Port 8084)
├── payment-service/ (Port 8085)
├── notification-service/ (Port 8086)
├── reporting-service/ (Port 8087)
├── config-repo/ (Configuration files)
└── frontend/ (AngularJS application)
```

## Support

For issues or questions, refer to the project documentation or contact the development team.

---
**Version**: 1.0.0  
**Last Updated**: 2026-03-02