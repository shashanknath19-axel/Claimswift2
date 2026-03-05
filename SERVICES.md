# ClaimSwift Service Map

## Core Platform Services

| Service | Port | Responsibility |
|---|---:|---|
| `config-server` | 8888 | Centralized configuration (native profile, classpath config files) |
| `eureka-server` | 8761 | Service discovery registry |
| `api-gateway` | 8080 | Single entrypoint, route forwarding, JWT filter, circuit breaker fallback |

## Domain Services

| Service | Port | Main Area |
|---|---:|---|
| `auth-service` | 8081 | Login, registration, JWT token flows |
| `claim-service` | 8082 | Claim CRUD, assignment, status, search/statistics |
| `document-service` | 8083 | Document upload/download and metadata management |
| `assessment-service` | 8084 | Claim assessment and decision workflow |
| `payment-service` | 8085 | Simulated payment transactions |
| `notification-service` | 8086 | Notification APIs + WebSocket/STOMP events |
| `reporting-service` | 8087 | Aggregated reports and exports |

## Gateway Routes

Configured in `config-server/src/main/resources/config/api-gateway.yml`:

- `/api/auth/**` -> `auth-service`
- `/api/claims/**` -> `claim-service`
- `/api/documents/**` -> `document-service`
- `/api/assessments/**` -> `assessment-service`
- `/api/payments/**` -> `payment-service`
- `/api/notifications/**` -> `notification-service`
- `/api/reports/**` -> `reporting-service`

## Frontend

| Module | Port | Notes |
|---|---:|---|
| `frontend-angular` | 4200 (dev) | Angular 17 app consuming gateway APIs (`http://localhost:8080/api`) |

## Datastores

Each domain service is configured for its own MySQL schema:

- `auth_db`
- `claim_db`
- `document_db`
- `assessment_db`
- `payment_db`
- `notification_db`
- `report_db`

Database URLs and credentials are externalized via environment variables with local defaults in Config Server files.
