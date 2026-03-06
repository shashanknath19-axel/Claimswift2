# Frontend API + Role Coverage Matrix

This matrix maps backend APIs to frontend service methods and role visibility in UI routes/navigation.

Legend:
- `UI` = directly used by a page/component
- `Service` = implemented in frontend service layer (available for UI usage)

## Auth Service (`/api/auth`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `login` | `POST /auth/login` | Public | `UI` `/login` |
| `register` | `POST /auth/register` | Public | `UI` `/register` |
| `refreshToken` | `POST /auth/refresh` | Authenticated | `UI` global token refresh |
| `logoutSecure` | `POST /auth/logout` | Authenticated | `UI` header logout |
| `getCurrentUserProfile` | `GET /auth/me` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `getAdjusters` | `GET /auth/adjusters` | Manager/Admin | `UI` `/admin/claims` manager/admin view |
| `createInternalUser` | `POST /auth/admin/users` | Admin | `Service` |
| `updateUserRoles` | `PUT /auth/admin/users/{id}/roles` | Admin | `Service` |
| `updateUserStatus` | `PATCH /auth/admin/users/{id}/status` | Admin | `Service` |
| `getHealth` | `GET /auth/health` | Public | `Service` |

## Claim Service (`/api/claims`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `createClaim` | `POST /claims` | Policyholder/Admin | `UI` `/claims/new` |
| `getClaimById` | `GET /claims/{id}` | Policyholder/Adjuster/Manager/Admin | `UI` detail/tracking/edit |
| `getClaimByNumber` | `GET /claims/number/{claimNumber}` | Policyholder/Adjuster/Manager/Admin | `UI` claims search/upload claim number resolve |
| `getMyClaims` | `GET /claims/my-claims` | Policyholder | `UI` dashboard + claims list |
| `getClaimHistory` | `GET /claims/history` | Policyholder | `UI` `/claims/history` |
| `searchMyClaims` | `GET /claims/my-claims/search` | Policyholder | `UI` claims filters |
| `getClaims` | `GET /claims` | Adjuster/Manager/Admin | `UI` `/claims`, `/admin/claims`, `/dashboard` |
| `updateClaim` | `PUT /claims/{id}` | Adjuster/Manager/Admin | `UI` `/claims/:id/edit` |
| `updateClaimStatus` | `PUT /claims/{id}/status` | Adjuster/Manager/Admin | `UI` claim/admin workflow actions |
| `updateClaimStatusPatch` | `PATCH /claims/{id}/status` | Adjuster/Manager/Admin | `Service` |
| `deleteClaim` | `DELETE /claims/{id}` | Adjuster/Manager/Admin | `UI` claim detail delete |
| `getClaimsByStatus` | `GET /claims/status/{status}` | Adjuster/Manager/Admin | `UI` status filters |
| `getPendingClaims` | `GET /claims/pending` | Adjuster/Manager/Admin | `UI` admin dashboard |
| `getAssignedClaims` | `GET /claims/assigned` | Adjuster/Manager/Admin | `UI` adjuster queues |
| `assignClaim` | `PATCH /claims/{id}/assign` | Manager/Admin | `UI` `/admin/claims` |
| `unassignClaim` | `PATCH /claims/{id}/unassign` | Manager/Admin | `UI` `/admin/claims` |
| `getClaimStatistics` | `GET /claims/statistics` | Adjuster/Manager/Admin | `UI` dashboards |
| `searchClaims` | `GET /claims/search?query=...` | Adjuster/Manager/Admin | `UI` claims search |
| `getClaimsByAdjuster` | `GET /claims/adjuster/{adjusterId}` | Adjuster/Manager/Admin | `Service` |
| `getClaimsSummary` | `GET /claims/summary` | Adjuster/Manager/Admin | `Service` |
| `getInternalAll` | `GET /claims/internal/all` | Adjuster/Manager/Admin | `Service` |
| `getInternalByStatus` | `GET /claims/internal/status/{status}` | Adjuster/Manager/Admin | `Service` |
| `getInternalByAdjuster` | `GET /claims/internal/adjuster/{adjusterId}` | Adjuster/Manager/Admin | `Service` |
| `getInternalSummary` | `GET /claims/internal/summary` | Adjuster/Manager/Admin | `Service` |
| `getInternalById` | `GET /claims/internal/{id}` | Adjuster/Manager/Admin | `Service` |
| `getHealth` | `GET /claims/health` | Public | `Service` |

## Document Service (`/api/documents`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `uploadDocument` | `POST /documents/upload` | Policyholder/Adjuster/Manager/Admin | `UI` `/documents/upload` |
| `getDocumentById` | `GET /documents/{id}` | Policyholder/Adjuster/Manager/Admin | `UI` `/documents` |
| `getDocumentsByClaim` | `GET /documents/claim/{claimId}` | Policyholder/Adjuster/Manager/Admin | `UI` claim detail/tracking/assessment |
| `getDocumentsByUser` | `GET /documents/user/{userId}` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `getDocumentsByType` | `GET /documents/claim/{claimId}/type/{documentType}` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `getClaimDocumentCount` | `GET /documents/internal/claim/{claimId}/count` | Adjuster/Manager/Admin | `Service` |
| `downloadDocument` | `GET /documents/{id}/download` | Policyholder/Adjuster/Manager/Admin | `UI` documents + assessment |
| `deleteDocument` | `DELETE /documents/{id}` | Policyholder/Adjuster/Manager/Admin | `UI` `/documents` |

## Assessment Service (`/api/assessments`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `createAssessment` | `POST /assessments` | Adjuster/Manager/Admin | `UI` `/assessment/:claimId` |
| `submitDecision` | `POST /assessments/decision` | Adjuster/Manager/Admin | `UI` `/assessment/:claimId` |
| `addAdjustment` | `POST /assessments/adjustment` | Adjuster/Manager/Admin | `Service` |
| `getAssessment` | `GET /assessments/{id}` | Adjuster/Manager/Admin | `Service` |
| `getByClaimId` | `GET /assessments/claim/{claimId}` | Adjuster/Manager/Admin | `UI` assessment/tracking |
| `getMyAssessments` | `GET /assessments/my-assessments` | Adjuster/Manager/Admin | `Service` |
| `getAdjustments` | `GET /assessments/{assessmentId}/adjustments` | Adjuster/Manager/Admin | `Service` |
| `requestAssessment` | `POST /assessments/request?claimId=...` | Adjuster/Manager/Admin | `Service` |
| `notifyComplete` | `POST /assessments/notify-complete` | Adjuster/Manager/Admin | `Service` |
| `getHealth` | `GET /assessments/health` | Public | `Service` |

## Payment Service (`/api/payments`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `processPayment` | `POST /payments` | Adjuster/Manager/Admin | `Service` |
| `getPayment` | `GET /payments/{id}` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `getByClaimId` | `GET /payments/claim/{claimId}` | Policyholder/Adjuster/Manager/Admin | `UI` claim detail/tracking |
| `getInternalAll` | `GET /payments/internal/all` | Adjuster/Manager/Admin | `UI` `/payments` |
| `getInternalByStatus` | `GET /payments/internal/status/{status}` | Adjuster/Manager/Admin | `Service` |
| `getInternalSummary` | `GET /payments/internal/summary` | Adjuster/Manager/Admin | `Service` |
| `getInternalByClaim` | `GET /payments/internal/claim/{claimId}` | Adjuster/Manager/Admin | `Service` |
| `autoProcessPayment` | `POST /payments/internal/auto-process` | Adjuster/Manager/Admin | `Service` |

## Notification Service (`/api/notifications`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `loadNotifications` | `GET /notifications` | Policyholder/Adjuster/Manager/Admin | `UI` notifications/dashboard/header |
| `getUnreadNotifications` | `GET /notifications/unread` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `getUnreadCount` | `GET /notifications/unread/count` | Policyholder/Adjuster/Manager/Admin | `UI` header badge |
| `markAsRead` | `PUT /notifications/{id}/read` | Policyholder/Adjuster/Manager/Admin | `UI` `/notifications` |
| `markAllAsRead` | `PUT /notifications/read-all` | Policyholder/Adjuster/Manager/Admin | `UI` `/notifications` |
| `sendNotification` | `POST /notifications/send` | Adjuster/Manager/Admin | `Service` |
| `deleteNotification` | `DELETE /notifications/{id}` | Policyholder/Adjuster/Manager/Admin | `UI` `/notifications` |
| `sendTestNotification` | `POST /notifications/test` | Policyholder/Adjuster/Manager/Admin | `UI` `/notifications` |
| `sendInternalClaimStatus` | `POST /notifications/internal/claim-status` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `sendInternalPaymentProcessed` | `POST /notifications/internal/payment-processed` | Policyholder/Adjuster/Manager/Admin | `Service` |

## Reporting Service (`/api/reports`)

| Frontend Method | Endpoint | Backend Roles | Frontend Coverage |
|---|---|---|---|
| `getClaimSummary` | `GET /reports/claims/summary` | Manager/Adjuster/Admin | `UI` `/reports` |
| `exportClaimSummaryPdf` | `GET /reports/claims/summary/pdf` | Manager/Admin | `Service` |
| `getPaymentSummary` | `GET /reports/payments` | Manager/Adjuster/Admin | `UI` `/reports` |
| `exportPaymentSummaryPdf` | `GET /reports/payments/pdf` | Manager/Admin | `Service` |
| `getAdjusterPerformance` | `GET /reports/adjusters/performance` | Manager/Admin | `UI` `/reports` (manager/admin only section) |
| `exportAdjusterPerformancePdf` | `GET /reports/adjusters/performance/pdf` | Manager/Admin | `Service` |
| `reportClaimEvent` | `POST /reports/claim-event` | Policyholder/Adjuster/Manager/Admin | `Service` |
| `reportStatusChange` | `POST /reports/status-change` | Adjuster/Manager/Admin | `Service` |

## Route Role Coverage (Frontend)

| Route | Allowed Roles in Frontend |
|---|---|
| `/claims/new`, `/claims/history`, `/documents`, `/documents/upload` | Policyholder/Admin |
| `/assessment/:claimId` | Adjuster/Manager/Admin |
| `/admin/dashboard` | Manager/Admin |
| `/admin/claims` | Adjuster/Manager/Admin |
| `/admin/users` | Admin |
| `/reports` | Adjuster/Manager/Admin |
| `/payments` | Adjuster/Manager/Admin |

