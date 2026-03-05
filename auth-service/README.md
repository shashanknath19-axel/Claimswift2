# Auth Service

Authentication and authorization service (JWT-based).

## Port

- `8081`

## Database

- Default schema: `auth_db`
- Main env vars:
  - `AUTH_DB_URL`
  - `AUTH_DB_USERNAME`
  - `AUTH_DB_PASSWORD`

## API Endpoints

Base path: `/api/auth`

- `POST /register`
- `POST /login`
- `POST /logout`
- `POST /refresh`
- `GET /me`
- `GET /health`

## Run

```bash
mvn -pl auth-service spring-boot:run
```

## Notes

- Issues JWT tokens used by gateway and other services.
- Registers with Eureka and consumes Config Server settings.
