# ClaimSwift

ClaimSwift is a Spring Cloud microservices platform for vehicle insurance claim processing.

## Documentation Index

- System documentation (architecture, responsibilities, deployment): `SYSTEM_DOCUMENTATION.md`
- API behavior by endpoint: `API_CALLS_EXPLAINED.md`
- Postman usage and import: `POSTMAN_TESTING.md`
- Testing strategy and commands: `TESTING.md`

## Quick Start (Local)

1. Start MySQL and create databases: `auth_db`, `claim_db`, `document_db`, `assessment_db`, `payment_db`, `notification_db`, `report_db`.
2. In VS Code CMD terminal, set Maven for current terminal session:
   ```cmd
   set "MAVEN_HOME=C:\Users\shashank.nath\tools\apache-maven-3.9.12\apache-maven-3.9.12"
   set "PATH=%MAVEN_HOME%\bin;%PATH%"
   ```
3. Build all modules from repo root:
   ```cmd
   mvn clean install -DskipTests
   ```
4. Start services in order:
   - `config-server` (8888)
   - `eureka-server` (8761)
   - `auth-service`, `claim-service`, `document-service`, `assessment-service`, `payment-service`, `notification-service`, `reporting-service`
   - `api-gateway` (8080)
5. Start frontend:
   ```cmd
   cd frontend-angular
   npm install
   npm start
   ```
6. Open:
   - UI: `http://localhost:4200`
   - Eureka: `http://localhost:8761`
   - Gateway health: `http://localhost:8080/actuator/health`

## Service Ports

| Component | Port |
|---|---:|
| Config Server | 8888 |
| Eureka Server | 8761 |
| API Gateway | 8080 |
| Auth Service | 8081 |
| Claim Service | 8082 |
| Document Service | 8083 |
| Assessment Service | 8084 |
| Payment Service | 8085 |
| Notification Service | 8086 |
| Reporting Service | 8087 |

## UI-to-Backend Rule

Frontend calls only API Gateway (`http://localhost:8080/api`) and does not call domain services directly.
