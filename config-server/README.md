# Config Server

Centralized Spring Cloud Config Server for all ClaimSwift services.

## Port

- `8888`

## Purpose

- Serves shared and service-specific configuration.
- Provides native config from `classpath:/config`.
- Registers itself with Eureka.

## Security

- HTTP Basic authentication is enabled for config endpoints.
- Defaults (override in environment):
  - `CONFIG_SERVER_USERNAME=configuser`
  - `CONFIG_SERVER_PASSWORD=configpass`

## Key Files

- `src/main/resources/application.yml`
- `src/main/resources/config/application.yml`
- `src/main/resources/config/*.yml`

## Run

```bash
mvn -pl config-server spring-boot:run
```

## Health

- `GET /actuator/health`
