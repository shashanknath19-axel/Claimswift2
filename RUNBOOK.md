# ClaimSwift Runbook

## Prerequisites

- Java 17
- Maven 3.9+
- Node.js 18+ and npm 9+
- MySQL 8+

## 1. Backend Startup Order

Run services in this order:

1. `config-server` (`8888`)
2. `eureka-server` (`8761`)
3. `api-gateway` (`8080`)
4. Domain services:
   - `auth-service` (`8081`)
   - `claim-service` (`8082`)
   - `document-service` (`8083`)
   - `assessment-service` (`8084`)
   - `payment-service` (`8085`)
   - `notification-service` (`8086`)
   - `reporting-service` (`8087`)

## 2. Start Commands

From repository root:

```bash
mvn -pl config-server spring-boot:run
mvn -pl eureka-server spring-boot:run
mvn -pl api-gateway spring-boot:run
mvn -pl auth-service spring-boot:run
mvn -pl claim-service spring-boot:run
mvn -pl document-service spring-boot:run
mvn -pl assessment-service spring-boot:run
mvn -pl payment-service spring-boot:run
mvn -pl notification-service spring-boot:run
mvn -pl reporting-service spring-boot:run
```

## 3. Frontend Startup

```bash
cd frontend-angular
npm install
npm start
```

Open `http://localhost:4200`.

## 4. Health Checks

Common actuator health endpoints:

- `http://localhost:8888/actuator/health`
- `http://localhost:8761/actuator/health`
- `http://localhost:8080/actuator/health`
- `http://localhost:8081/actuator/health` ... `http://localhost:8087/actuator/health`

Eureka dashboard:

- `http://localhost:8761`

## 5. Configuration Notes

- Services import config via Config Server (`spring.config.import=optional:configserver:`).
- Shared defaults are in:
  - `config-server/src/main/resources/config/application.yml`
- Service-specific configs are in:
  - `config-server/src/main/resources/config/*.yml`

## 6. Security Notes (Dev Defaults)

The configuration contains local default credentials/secrets for development convenience:

- MySQL users/password fallbacks
- Config Server credentials
- Eureka credentials
- JWT fallback secret

Change these values for any shared or production environment.

## 7. Troubleshooting

- Service fails to start with config errors:
  - Verify `config-server` is up first on `8888`.
- Service not visible in Eureka:
  - Verify `eureka-server` is up and credentials match.
- Frontend API errors:
  - Confirm `api-gateway` is running on `8080`.
- Notification/WebSocket issues:
  - Confirm `notification-service` is running on `8086` and frontend `wsUrl` matches.
