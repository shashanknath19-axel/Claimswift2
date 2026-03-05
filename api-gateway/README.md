# API Gateway

Spring Cloud Gateway entrypoint for all ClaimSwift APIs.

## Port

- `8080`

## Purpose

- Routes external API traffic to backend services.
- Applies JWT gateway filter for protected routes.
- Uses circuit breaker fallbacks per service route.

## Routed API Prefixes

- `/api/auth/**` -> `auth-service`
- `/api/claims/**` -> `claim-service`
- `/api/documents/**` -> `document-service`
- `/api/assessments/**` -> `assessment-service`
- `/api/payments/**` -> `payment-service`
- `/api/notifications/**` -> `notification-service`
- `/api/reports/**` -> `reporting-service`

## Fallback Endpoints

- `GET /fallback/auth`
- `GET /fallback/claims`
- `GET /fallback/documents`
- `GET /fallback/assessments`
- `GET /fallback/payments`
- `GET /fallback/notifications`
- `GET /fallback/reports`

## Run

```bash
mvn -pl api-gateway spring-boot:run
```

## Health

- `GET /actuator/health`
