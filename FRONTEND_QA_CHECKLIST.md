# ClaimSwift Frontend QA Checklist (Final Demo Sign-off)

## 1. Pre-check

1. Start backend services and confirm health:
   - `http://localhost:8888/actuator/health`
   - `http://localhost:8761`
   - `http://localhost:8080/actuator/health`
2. Start frontend:
   ```cmd
   cd C:\Users\shashank.nath\Desktop\Claimswift\frontend-angular
   npm start
   ```
3. Open UI: `http://localhost:4200`
4. Open browser DevTools Network tab and confirm API calls go only to `http://localhost:8080/api/...`.

## 2. Authentication Routes

1. `/login`
   - Valid credentials logs in and redirects to `/dashboard`.
   - Invalid credentials shows error toast.
2. `/register`
   - Register `ROLE_POLICYHOLDER`, `ROLE_ADJUSTER`, `ROLE_MANAGER`.
   - After success, user is authenticated and redirected to `/dashboard`.
3. Logout from header menu clears session and returns to `/login`.

## 3. Policyholder Flow

1. Login as policyholder.
2. `/dashboard`
   - KPI cards and recent claims/notifications load.
3. `/claims/new`
   - Submit a new claim successfully.
4. `/claims`
   - New claim appears in list.
   - Status/filter/search works.
5. `/claims/{id}`
   - Claim details visible.
6. `/claims/{id}/tracking`
   - Timeline, document count, assessment/payment state visible.
7. `/documents/upload`
   - Upload file against claim ID.
8. `/documents`
   - Uploaded file appears; download and delete work.
9. `/notifications`
   - List loads; mark single/all read works.

## 4. Adjuster/Manager/Admin Flow

1. Login as adjuster or manager.
2. `/admin/dashboard`
   - Admin KPI and priority queue load.
3. `/admin/claims`
   - Filter by status works.
   - Assign adjuster works.
   - Status actions `UNDER_REVIEW`, `APPROVED`, `REJECTED` work.
4. `/assessment/{claimId}`
   - Create assessment.
   - Submit decision.
   - Redirect back to claim tracking.
5. `/reports`
   - Claim summary, payment summary, adjuster performance load.
6. `/payments`
   - Internal payment records list loads.
7. `/admin/users` (manager/admin)
   - Role governance page visible.

## 5. Role-based Access Control

1. Policyholder cannot access:
   - `/admin/*`
   - `/reports`
   - `/payments`
   - `/assessment/*`
2. Unauthorized access redirects to `/unauthorized`.
3. Unknown route opens `/not-found`.

## 6. Notification + Real-time

1. Keep `/notifications` open.
2. Trigger claim status update/payment from admin flow.
3. Confirm new notification appears without manual refresh.
4. Header unread badge updates.

## 7. Responsive and UX Checks

1. Desktop `>= 1200px`
   - Sidebar visible; tables/cards aligned.
2. Tablet `768px - 1199px`
   - Layout stacks cleanly; no clipped controls.
3. Mobile `< 768px`
   - Sidenav collapses to overlay.
   - Forms, tables, action buttons remain usable and readable.
4. Check no horizontal page overflow on key routes:
   - `/dashboard`, `/claims`, `/claims/{id}/tracking`, `/documents`, `/admin/claims`.

## 8. API Gateway Only Rule

1. In DevTools, validate frontend calls:
   - `http://localhost:8080/api/auth/...`
   - `http://localhost:8080/api/claims/...`
   - `http://localhost:8080/api/documents/...`
   - `http://localhost:8080/api/assessments/...`
   - `http://localhost:8080/api/payments/...`
   - `http://localhost:8080/api/notifications/...`
   - `http://localhost:8080/api/reports/...`
2. Confirm no direct calls to `8081`-`8087`.

## 9. Final Demo Pass Criteria

1. All core routes render without placeholder content.
2. End-to-end claim lifecycle is executable from UI.
3. Role-based menu and route restrictions work.
4. Document upload/download works.
5. Notifications and unread badge work.
6. Reports and admin views load for privileged roles.
7. Responsive behavior is acceptable on desktop/tablet/mobile.
