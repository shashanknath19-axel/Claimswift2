# Reporting Service

Reporting and analytics service for claims and payments.

## Port

- `8087`

## Database

- Default schema: `report_db`
- Main env vars:
  - `REPORTING_DB_URL`
  - `REPORTING_DB_USERNAME`
  - `REPORTING_DB_PASSWORD`

## API Endpoints

Base path: `/api/reports`

- `GET /claims/summary`
- `GET /claims/summary/pdf`
- `GET /payments`
- `GET /payments/pdf`
- `GET /adjusters/performance`
- `GET /adjusters/performance/pdf`
- `POST /claim-event`
- `POST /status-change`

## Notes

- Consumes internal APIs from claim-service and payment-service for aggregation.
- Supports export/report generation, including PDF endpoints.

## Run

```bash
mvn -pl reporting-service spring-boot:run
```
