# Assessment Service

Claim assessment and adjustment decision service.

## Port

- `8084`

## Database

- Default schema: `assessment_db`
- Main env vars:
  - `ASSESSMENT_DB_URL`
  - `ASSESSMENT_DB_USERNAME`
  - `ASSESSMENT_DB_PASSWORD`

## API Endpoints

Base path: `/api/assessments`

- `POST /`
- `POST /decision`
- `POST /adjustment`
- `GET /{id}`
- `GET /claim/{claimId}`
- `GET /my-assessments`
- `GET /{assessmentId}/adjustments`
- `GET /health`
- `POST /request`
- `POST /notify-complete`

## Run

```bash
mvn -pl assessment-service spring-boot:run
```
