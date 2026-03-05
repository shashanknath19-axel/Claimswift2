# Claim Service

Claim lifecycle management service.

## Port

- `8082`

## Database

- Default schema: `claim_db`
- Main env vars:
  - `CLAIM_DB_URL`
  - `CLAIM_DB_USERNAME`
  - `CLAIM_DB_PASSWORD`

## API Endpoints

Base path: `/api/claims`

- `POST /`
- `GET /{id}`
- `GET /number/{claimNumber}`
- `GET /my-claims`
- `GET /history`
- `GET /`
- `PUT /{id}`
- `PUT /{id}/status`
- `PATCH /{id}/status`
- `GET /status/{status}`
- `GET /pending`
- `GET /assigned`
- `PATCH /{id}/assign`
- `GET /statistics`
- `GET /search`
- `GET /adjuster/{adjusterId}`
- `GET /summary`
- `GET /internal/all`
- `GET /internal/status/{status}`
- `GET /internal/adjuster/{adjusterId}`
- `GET /internal/summary`
- `DELETE /{id}`
- `GET /health`

## Run

```bash
mvn -pl claim-service spring-boot:run
```
