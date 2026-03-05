# Eureka Server

Service discovery registry for ClaimSwift microservices.

## Port

- `8761`

## Purpose

- Hosts Eureka registry/dashboard.
- Accepts service registrations from all backend modules.

## Security

- HTTP Basic and form login enabled.
- Defaults (override in environment):
  - `EUREKA_USERNAME=eureka`
  - `EUREKA_PASSWORD=eurekapass`

## Run

```bash
mvn -pl eureka-server spring-boot:run
```

## Access

- Dashboard: `http://localhost:8761`
- Health: `GET /actuator/health`
