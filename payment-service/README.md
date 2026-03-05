# Payment Service

Simulated payment gateway for claim disbursements (sandbox).

## Port

- `8085`

## Database

- Default schema: `payment_db`
- Main env vars:
  - `PAYMENT_DB_URL`
  - `PAYMENT_DB_USERNAME`
  - `PAYMENT_DB_PASSWORD`

## Important

- This service is configured as a simulation/sandbox.
- No real payment provider integration is implied by default config.

## API Endpoints

Base path: `/api/payments`

- `POST /`
- `GET /{id}`
- `GET /claim/{claimId}`
- `GET /internal/all`
- `GET /internal/status/{status}`
- `GET /internal/summary`
- `GET /internal/claim/{claimId}`

## Run

```bash
mvn -pl payment-service spring-boot:run
```
