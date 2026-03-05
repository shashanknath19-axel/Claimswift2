# Workflow Matrix

| Actor | Screen | API | Allowed Transition |
|---|---|---|---|
| Public User | Register | `POST /api/auth/register` | New account -> `ROLE_POLICYHOLDER` |
| Any Authenticated User | Login | `POST /api/auth/login` | Valid creds -> JWT issued |
| Policyholder | New Claim | `POST /api/claims` | `SUBMITTED` |
| Policyholder | My Claims | `GET /api/claims/my-claims` | View own claims only |
| Policyholder | Search My Claims | `GET /api/claims/my-claims/search` | Filter by id/policy/name/phone/date/status |
| Policyholder | Upload Document | `POST /api/documents/upload` | PDF accepted, linked to claim |
| Adjuster | Assessment Queue | `GET /api/claims/assigned` | `SUBMITTED` -> `UNDER_REVIEW`/decision path |
| Adjuster/Manager/Admin | Update Status | `PUT /api/claims/{id}/status` | `UNDER_REVIEW` -> `APPROVED`/`REJECTED`/`ADJUSTED` |
| Manager/Admin | Assign Claim | `PATCH /api/claims/{id}/assign` | Claim assigned to adjuster |
| Manager/Admin | Reports | `GET /api/reports/*` | Read-only analytics/report data |
| Admin | Create Internal User | `POST /api/auth/admin/users` | Create `ROLE_ADJUSTER`/`ROLE_MANAGER`/`ROLE_ADMIN` |
| Admin | Update User Roles | `PUT /api/auth/admin/users/{id}/roles` | Role set changed with audit log |
| Admin | Update User Status | `PATCH /api/auth/admin/users/{id}/status` | `ACTIVE`/`INACTIVE`/`SUSPENDED`/`PENDING_VERIFICATION` |

## Claim Status Lifecycle

- `SUBMITTED` -> `UNDER_REVIEW`, `CANCELLED`
- `UNDER_REVIEW` -> `APPROVED`, `REJECTED`, `ADJUSTED`, `CANCELLED`
- `ADJUSTED` -> `APPROVED`, `REJECTED`, `CANCELLED`
- `APPROVED` -> `PAID`, `PAYMENT_FAILED`
- `PAYMENT_FAILED` -> `PAID`, `CANCELLED`
- `REJECTED`, `PAID`, `CANCELLED` are terminal
