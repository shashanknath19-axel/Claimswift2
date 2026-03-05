# ClaimSwift

ClaimSwift is a Spring Boot microservices platform with an Angular 17 frontend for vehicle insurance claim lifecycle management.

## Stack
- Java 17, Spring Boot 3, Spring Cloud
- API Gateway: Spring Cloud Gateway (`http://localhost:8080`)
- Service discovery: Eureka (`http://localhost:8761`)
- Central config: Config Server (`http://localhost:8888`)
- Frontend: Angular 17 + Angular Material + Bootstrap 5 (`http://localhost:4200`)
- Database: MySQL 8 (separate schema per service)

## Service Ports
- `auth-service`: `8081`
- `claim-service`: `8082`
- `document-service`: `8083`
- `assessment-service`: `8084`
- `payment-service`: `8085`
- `notification-service`: `8086`
- `reporting-service`: `8087`

## API Base Paths (through Gateway)
- `/api/auth/*`
- `/api/claims/*`
- `/api/documents/*`
- `/api/assessments/*`
- `/api/payments/*`
- `/api/notifications/*`
- `/api/reports/*`

All client traffic should go through `http://localhost:8080/api/*`.

## Security Model
- Gateway auth policy is deny-by-default with explicit public allowlist.
- Public endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`
  - health/fallback routes
- Public registration always creates `ROLE_POLICYHOLDER`.
- Privileged users are created only from admin-only endpoints:
  - `POST /api/auth/admin/users`
  - `PUT /api/auth/admin/users/{id}/roles`
  - `PATCH /api/auth/admin/users/{id}/status`

## Unified API Response Schema
All services return:

```json
{
  "code": "SUCCESS",
  "message": "Operation completed",
  "data": {},
  "requestId": "c1c8c4c9-9a32-4e45-b853-2edbf16b6f95"
}
```

`requestId` is the correlation ID used for support tracing.

## Claim Search
Policyholder search endpoint:

`GET /api/claims/my-claims/search?query=&status=&fromDate=&toDate=`

Supported filters:
- claim id / claim number
- policy number
- policyholder name
- policyholder phone
- incident date range
- status

## Document Upload Policy
- Only PDF files are allowed.
- Validation is enforced in both frontend and backend:
  - extension check (`.pdf`)
  - MIME check (`application/pdf`)
  - server-side PDF signature validation (`%PDF-`)
- Invalid uploads return explicit `400` / `415` responses.

## Local Startup
1. Start config server, eureka, gateway, then domain services.
2. Start frontend:

```bash
cd frontend-angular
npm install
npm start
```

3. Open `http://localhost:4200`.

## Operational Docs
- [RUNBOOK.md](RUNBOOK.md)
- [WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md)
- `run-logs/api-smoke-test.ps1` for local API smoke execution
