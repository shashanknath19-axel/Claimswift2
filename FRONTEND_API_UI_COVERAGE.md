# Frontend API UI Coverage

This checklist maps Angular UI screens to backend APIs and confirms user-facing interactions exist for each service method.

## Auth APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `login` | `POST /auth/login` | `/login` | Sign in form |
| `register` | `POST /auth/register` | `/register` | Register new user form |
| `logout` | `POST /auth/logout` | Header user menu | Secure logout flow |
| `refreshToken` | `POST /auth/refresh` | Global (`AuthService`) | Automatic token refresh timer |
| `getAdjusters` | `GET /auth/adjusters` | `/admin/claims` | Manager adjuster directory + availability |

## Claim APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `getClaims` | `GET /claims` | `/claims`, `/admin/claims`, `/dashboard` | Paginated/global claim list |
| `getClaimById` | `GET /claims/{id}` | `/claims/:id`, `/claims/:id/tracking`, `/claims/:id/edit` | Claim detail/tracking/edit load |
| `getClaimByNumber` | `GET /claims/number/{claimNumber}` | `/claims` | Exact claim-number search (`CLM...`) |
| `createClaim` | `POST /claims` | `/claims/new` | New claim submission |
| `updateClaim` | `PUT /claims/{id}` | `/claims/:id/edit` | Edit claim |
| `updateClaimStatus` | `PUT /claims/{id}/status` | `/claims/:id`, `/admin/claims` | Review/approve/reject actions |
| `deleteClaim` | `DELETE /claims/{id}` | `/claims/:id` | Delete claim button |
| `getMyClaims` | `GET /claims/my-claims` | `/claims`, `/dashboard` | Policyholder claim views |
| `getClaimHistory` | `GET /claims/history` | `/claims/history` | Policyholder claim history timeline |
| `getClaimsByStatus` | `GET /claims/status/{status}` | `/claims`, `/admin/claims` | Status filter |
| `getPendingClaims` | `GET /claims/pending` | `/admin/dashboard` | Priority queue |
| `getAssignedClaims` | `GET /claims/assigned` | `/claims`, `/dashboard` | Adjuster assigned queue |
| `assignClaim` | `PATCH /claims/{id}/assign` | `/admin/claims` | Assign adjuster action |
| `unassignClaim` | `PATCH /claims/{id}/unassign` | `/admin/claims` | Remove adjuster assignment |
| `getClaimStatistics` | `GET /claims/statistics` | `/dashboard`, `/admin/dashboard` | KPI cards |
| `searchClaims` | `GET /claims/search` | `/claims` | Free-text search |

## Document APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `uploadDocument` | `POST /documents/upload` | `/documents/upload` | File upload form + progress |
| `getDocuments` | `GET /documents/user/{id}` or claim/type filters | `/documents` | Document listing with filters |
| `getDocumentById` | `GET /documents/{id}` | `/documents` | Document metadata details panel |
| `getDocumentsByClaim` | `GET /documents/claim/{claimId}` | `/claims/:id`, `/claims/:id/tracking` | Claim-linked document counts/lists |
| `downloadDocument` | `GET /documents/{id}/download` | `/documents` | Download action |
| `deleteDocument` | `DELETE /documents/{id}` | `/documents` | Delete action |

## Assessment APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `getByClaimId` | `GET /assessments/claim/{claimId}` | `/assessment/:claimId`, `/claims/:id/tracking` | Existing assessment lookup |
| `createAssessment` | `POST /assessments` | `/assessment/:claimId` | Save assessment form |
| `submitDecision` | `POST /assessments/decision` | `/assessment/:claimId` | Decision submit form |

## Payment APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `getByClaimId` | `GET /payments/claim/{claimId}` | `/claims/:id`, `/claims/:id/tracking` | Claim-level payment visibility |
| `getInternalAll` | `GET /payments/internal/all` | `/payments` | Payment operations table |

## Reporting APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `getClaimSummary` | `GET /reports/claims/summary` | `/reports` | Claim metrics cards |
| `getPaymentSummary` | `GET /reports/payments` | `/reports` | Payment metrics cards |
| `getAdjusterPerformance` | `GET /reports/adjusters/performance` | `/reports` | Adjuster performance table |

## Notification APIs

| API Method | Endpoint | UI Screen | UX Action |
|---|---|---|---|
| `loadNotifications` | `GET /notifications` | `/notifications`, `/dashboard` | Inbox/recent notifications |
| `getUnreadCount` | `GET /notifications/unread/count` | Global header badge | Accurate unread indicator sync |
| `markAsRead` | `PUT /notifications/{id}/read` | `/notifications` | Mark single notification read |
| `markAllAsRead` | `PUT /notifications/read-all` | `/notifications` | Mark all read |
| `deleteNotification` | `DELETE /notifications/{id}` | `/notifications` | Delete notification |
| `sendTestNotification` | `POST /notifications/test` | `/notifications` | Test notification button |

## Realtime Connection Status

- Header connection badge now has timeout-safe websocket state transitions:
  - `Connecting...` -> max 7s before fallback to `Offline`
  - `Online` on STOMP connect
  - `Offline` on socket/stomp close/error
- This prevents the status from being stuck permanently on `Connecting...`.
