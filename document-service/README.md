# Document Service

Document upload/download and claim document metadata service.

## Port

- `8083`

## Database

- Default schema: `document_db`
- Main env vars:
  - `DOCUMENT_DB_URL`
  - `DOCUMENT_DB_USERNAME`
  - `DOCUMENT_DB_PASSWORD`

## File Storage

- Config key: `file.storage.path`
- Default: `./uploads`
- Multipart limits: 10MB

## API Endpoints

Base path: `/api/documents`

- `POST /upload` (multipart)
- `GET /{id}`
- `GET /claim/{claimId}`
- `GET /user/{userId}`
- `GET /claim/{claimId}/type/{documentType}`
- `DELETE /{id}`
- `GET /{id}/download`

## Run

```bash
mvn -pl document-service spring-boot:run
```
