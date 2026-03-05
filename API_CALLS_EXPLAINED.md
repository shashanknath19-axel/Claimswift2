# ClaimSwift API Calls Explained

This document explains what each API endpoint does in ClaimSwift.

## Base URLs

- Config Server: `http://localhost:8888`
- Eureka Server: `http://localhost:8761`
- API Gateway: `http://localhost:8080`
- Auth Service: `http://localhost:8081`
- Claim Service: `http://localhost:8082`
- Document Service: `http://localhost:8083`
- Assessment Service: `http://localhost:8084`
- Payment Service: `http://localhost:8085`
- Notification Service: `http://localhost:8086`
- Reporting Service: `http://localhost:8087`

## Roles

- `ROLE_POLICYHOLDER`: submits and tracks own claims.
- `ROLE_ADJUSTER`: assesses claims and works claim queue.
- `ROLE_MANAGER`: assigns claims, approves flow, views advanced reports.

## Health and Routing APIs

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/actuator/health` (all services) | Returns service health status for uptime checks. |
| GET | `/api/auth/health` via gateway (`8080`) | Verifies gateway to auth-service routing. |
| GET | `/api/claims/health` via gateway (`8080`) | Verifies gateway to claim-service routing. |
| GET | `/api/reports/claims/summary` via gateway (`8080`) | Verifies gateway to reporting-service routing and manager/adjuster report route behavior. |

---

## Auth Service (`/api/auth`)

| Method | Endpoint | Auth | What it does | Key input |
|---|---|---|---|---|
| POST | `/register` | Public | Creates a new user with selected role and returns JWT + user profile. | `username`, `email`, `password`, `role`, profile fields |
| POST | `/login` | Public | Authenticates existing user and returns access token + user details. | `usernameOrEmail`, `password` |
| POST | `/refresh` | Bearer token | Issues a refreshed JWT based on existing token. | Authorization header |
| POST | `/logout` | Bearer token | Invalidates/logout flow for current token (service-side logout handling). | Authorization header |
| GET | `/me` | Policyholder/Adjuster/Manager | Returns current logged-in user profile. | Authorization header |
| GET | `/health` | Public | Lightweight auth service health text. | None |

---

## Claim Service (`/api/claims`)

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| POST | `/` | Policyholder | Submits a new claim. |
| GET | `/{id}` | Policyholder/Adjuster/Manager | Fetches claim details by claim ID. |
| GET | `/number/{claimNumber}` | Policyholder/Adjuster/Manager | Fetches claim by business claim number (for example `CLM-...`). |
| GET | `/my-claims` | Policyholder | Returns claims for logged-in policyholder. |
| GET | `/history` | Policyholder | Returns policyholder claim timeline/history. |
| GET | `/` | Adjuster/Manager | Returns paginated claims with filters (`page`, `size`, `status`, `sortBy`, `sortDir`). |
| PUT | `/{id}` | Adjuster/Manager | Updates editable claim fields. |
| PUT | `/{id}/status` | Adjuster/Manager | Updates claim status with full payload. |
| PATCH | `/{id}/status` | Adjuster/Manager | Partial-style status update (same workflow as PUT status). |
| GET | `/status/{status}` | Adjuster/Manager | Lists claims by status value. |
| GET | `/pending` | Adjuster/Manager | Shortcut list of pending claims (mapped to `UNDER_REVIEW`). |
| GET | `/assigned` | Adjuster/Manager | Lists claims assigned to current user. |
| PATCH | `/{id}/assign` | Manager | Assigns claim to an adjuster (`adjusterId`). |
| GET | `/statistics` | Adjuster/Manager | Returns aggregate stats (counts, totals, etc.). |
| GET | `/search?query=...` | Adjuster/Manager | Free-text search across claim fields. |
| GET | `/adjuster/{adjusterId}` | Adjuster/Manager | Lists claims linked to a specific adjuster ID. |
| GET | `/summary?startDate=&endDate=` | Adjuster/Manager | Date-range summary for claims and amounts. |
| GET | `/internal/all` | Adjuster/Manager | Internal normalized claim list used by reporting integrations. |
| GET | `/internal/status/{status}` | Adjuster/Manager | Internal claim list filtered by status for reporting. |
| GET | `/internal/adjuster/{adjusterId}` | Adjuster/Manager | Internal claim list filtered by adjuster for reporting. |
| GET | `/internal/summary?startDate=&endDate=` | Adjuster/Manager | Internal summary payload for reporting service. |
| GET | `/internal/{id}` | Adjuster/Manager | Internal point lookup by ID for service integrations (assessment/reporting flows). |
| DELETE | `/{id}` | Adjuster/Manager | Deletes a claim record. |
| GET | `/health` | Public | Claim service health text. |

### Claim Submission Payload (used by smoke tests)

Required business fields typically include:

- `policyNumber`
- `vehicleRegistration`
- `vehicleMake`
- `vehicleModel`
- `vehicleYear`
- `incidentDate`
- `incidentLocation`
- `incidentDescription`
- `claimAmount`

---

## Document Service (`/api/documents`)

| Method | Endpoint | Auth | What it does | Key input |
|---|---|---|---|---|
| POST | `/upload` | Policyholder/Adjuster/Manager | Uploads a file and stores document metadata against claim. | Multipart: `file`, `claimId`, optional `documentType`, `description` |
| GET | `/{id}` | Policyholder/Adjuster/Manager | Returns document metadata by document ID. | Path `id` |
| GET | `/claim/{claimId}` | Policyholder/Adjuster/Manager | Lists documents attached to a claim. | Path `claimId` |
| GET | `/user/{userId}` | Policyholder/Adjuster/Manager | Lists documents uploaded by user ID. | Path `userId` |
| GET | `/claim/{claimId}/type/{documentType}` | Policyholder/Adjuster/Manager | Lists claim documents filtered by document type. | Path `claimId`, `documentType` |
| GET | `/internal/claim/{claimId}/count` | Adjuster/Manager | Returns document count for claim, used in assessment validation workflow. | Path `claimId` |
| GET | `/{id}/download` | Policyholder/Adjuster/Manager | Downloads original binary file for document. | Path `id` |
| DELETE | `/{id}` | Policyholder/Adjuster/Manager | Deletes document metadata and file. | Path `id` |

---

## Assessment Service (`/api/assessments`)

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| POST | `/` | Adjuster/Manager | Creates claim assessment record with assessed amount and notes. |
| POST | `/decision` | Adjuster/Manager | Saves decision outcome for an assessment (for example adjusted/rejected). |
| POST | `/adjustment` | Adjuster/Manager | Adds adjustment details tied to assessment. |
| GET | `/{id}` | Adjuster/Manager | Fetches assessment by assessment ID. |
| GET | `/claim/{claimId}` | Adjuster/Manager | Fetches assessment by claim ID. |
| GET | `/my-assessments` | Adjuster/Manager | Lists assessments for logged-in assessor. |
| GET | `/{assessmentId}/adjustments` | Adjuster/Manager | Lists all adjustments linked to an assessment. |
| POST | `/request?claimId=...` | Adjuster/Manager | Creates/request marker for assessment workflow. |
| POST | `/notify-complete` | Adjuster/Manager | Acknowledges completion notification payload for assessment workflow integration. |
| GET | `/health` | Public | Assessment service health text. |

---

## Payment Service (`/api/payments`)

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| POST | `/` | Adjuster/Manager | Processes payout transaction for claim (simulated payment engine). |
| GET | `/{id}` | Policyholder/Adjuster/Manager | Gets payment transaction by payment ID. |
| GET | `/claim/{claimId}` | Policyholder/Adjuster/Manager | Gets payment transactions for a claim. |
| GET | `/internal/all` | Adjuster/Manager | Internal normalized list for reporting service consumption. |
| GET | `/internal/status/{status}` | Adjuster/Manager | Internal payments filtered by payment status. |
| GET | `/internal/summary?startDate=&endDate=` | Adjuster/Manager | Internal summary (totals, counts) for reporting. |
| GET | `/internal/claim/{claimId}` | Adjuster/Manager | Internal claim-specific payment list for reporting. |
| POST | `/internal/auto-process` | Adjuster/Manager | Internal trigger for auto payment processing after assessment approvals. |

### Payment Process Payload (common fields)

- `claimId`
- `policyholderId`
- `amount`
- `paymentMethod`
- Beneficiary/bank details (`beneficiaryName`, `accountNumber`, `ifscCode`, `bankName`)
- Simulation flags in dev (`forceSimulateSuccess`, `forceSimulateFailure`)

---

## Notification Service (`/api/notifications`)

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| GET | `/` | Policyholder/Adjuster/Manager | Returns current user notifications. |
| GET | `/unread` | Policyholder/Adjuster/Manager | Returns unread notifications for current user. |
| GET | `/unread/count` | Policyholder/Adjuster/Manager | Returns unread count object (`unreadCount`). |
| PUT | `/{id}/read` | Policyholder/Adjuster/Manager | Marks one notification as read (ownership rules apply). |
| PUT | `/read-all` | Policyholder/Adjuster/Manager | Marks all current user notifications as read. |
| POST | `/send` | Adjuster/Manager | Sends a notification to target user/claim context. |
| DELETE | `/{id}` | Policyholder/Adjuster/Manager | Deletes one notification (ownership/authorization rules apply). |
| POST | `/test` | Policyholder/Adjuster/Manager | Creates a self-targeted test notification for current user. |
| POST | `/internal/claim-status` | Adjuster/Manager | Internal event endpoint for claim status transition notifications. |
| POST | `/internal/payment-processed` | Adjuster/Manager | Internal event endpoint for payment completion notifications. |

---

## Reporting Service (`/api/reports`)

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| GET | `/claims/summary?startDate=&endDate=` | Manager/Adjuster | Returns structured claim summary report JSON. |
| GET | `/claims/summary/pdf?startDate=&endDate=` | Manager | Returns claim summary report as downloadable PDF. |
| GET | `/payments?startDate=&endDate=` | Manager/Adjuster | Returns structured payment report JSON. |
| GET | `/payments/pdf?startDate=&endDate=` | Manager | Returns payment report PDF. |
| GET | `/adjusters/performance?startDate=&endDate=` | Manager | Returns adjuster performance report JSON. |
| GET | `/adjusters/performance/pdf?startDate=&endDate=` | Manager | Returns adjuster performance report PDF. |
| POST | `/claim-event` | Policyholder/Adjuster/Manager | Records/logs claim lifecycle event payload from other services/clients. |
| POST | `/status-change` | Adjuster/Manager | Records/logs claim status transition payload. |

Notes:

- Date params are ISO format: `YYYY-MM-DD`.
- PDF endpoints return binary bytes with `Content-Disposition: attachment`.

---

## API Gateway Fallback APIs (`/fallback`)

These are used when downstream services are unavailable and circuit-breaker fallback is triggered.

| Method | Endpoint | What it returns |
|---|---|---|
| GET | `/fallback/auth` | Service unavailable response for auth routes. |
| GET | `/fallback/claims` | Service unavailable response for claim routes. |
| GET | `/fallback/documents` | Service unavailable response for document routes. |
| GET | `/fallback/assessments` | Service unavailable response for assessment routes. |
| GET | `/fallback/payments` | Service unavailable response for payment routes. |
| GET | `/fallback/notifications` | Service unavailable response for notification routes. |
| GET | `/fallback/reports` | Service unavailable response for reporting routes. |

---

## Smoke-Test Call Names to Endpoint Mapping

The validated collection/run includes scenario calls such as:

- `Claim submit primary` and `Claim submit delete-target`: both call `POST /api/claims` with different payload purpose.
- `Claim put status ADJUSTED` and `Claim patch status APPROVED`: both update claim status using different HTTP verbs.
- `Claim read after payment`: re-checks `GET /api/claims/{id}` after payout.

For exact runnable requests, use:

- Postman collection: `run-logs/ClaimSwift-Local-Smoke-20260304-133425.postman_collection.json`
- Postman env: `run-logs/postman-env-20260304-132420.json`
