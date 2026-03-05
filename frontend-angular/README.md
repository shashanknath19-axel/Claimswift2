# ClaimSwift Frontend (Angular)

Angular 17 frontend for the ClaimSwift vehicle insurance claims platform.

## Current Implementation Status

This repository currently provides:

- Application shell with responsive top bar and sidenav
- Route configuration for all major product areas
- Role-aware route protection (`AuthGuard`, `RoleGuard`)
- Core API service layer for auth, claims, documents, and notifications
- HTTP interceptors for auth headers, error toasts, and loading state
- WebSocket notification client (STOMP over SockJS)
- Placeholder UI pages for feature modules (scaffold mode)

The feature routes are wired, but most screens are still placeholder components intended for backend/API and final UI integration.

## Tech Stack

- Angular 17 (standalone components)
- Angular Material
- RxJS
- `@stomp/stompjs` and `sockjs-client`
- `ngx-toastr`
- `chart.js` and `ng2-charts`

## Project Structure

```text
frontend-angular/
  src/
    app/
      app.component.ts
      app.config.ts
      app.routes.ts
      core/
        guards/
        interceptors/
        models/
        services/
      shared/
        placeholder-page.component.ts
    environments/
      environment.ts
  angular.json
  package.json
```

## Available Routes

Configured routes include:

- `/login`, `/register`
- `/dashboard`
- `/claims`, `/claims/new`, `/claims/:id`, `/claims/:id/edit`
- `/documents`, `/documents/upload`
- `/notifications`, `/profile`, `/settings`
- `/admin/claims`, `/admin/users`
- `/reports`, `/payments`, `/assessment/:claimId`
- `/unauthorized`

Unknown routes fall back to `Not Found`.

## Role Access (Route Guard Data)

- `admin` section: `ADMIN`, `MANAGER`, `ADJUSTER`
- `admin/users`: `ADMIN`
- `reports`, `payments`: `ADMIN`, `MANAGER`
- `assessment`: `ADJUSTER`, `MANAGER`, `ADMIN`

## Environment Configuration

Default local config (`src/environments/environment.ts`):

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws/notifications',
  appName: 'ClaimSwift',
  version: '1.0.0'
};
```

Update these values if your backend runs on different hosts/ports.

## Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
cd frontend-angular
npm install
```

### Run (Development)

```bash
npm start
```

App URL: `http://localhost:4200`

## Scripts

From `frontend-angular/`:

- `npm start` - start dev server
- `npm run build` - production build
- `npm run watch` - dev build in watch mode
- `npm test` - run Karma/Jasmine tests
- `npm run lint` - TypeScript compile check (`tsc --noEmit`)

## Backend Integration Notes

Service endpoints are currently mapped to:

- Auth: `${apiUrl}/auth`
- Claims: `${apiUrl}/claims`
- Documents: `${apiUrl}/documents`
- Notifications: `${apiUrl}/notifications`

Auth token behavior:

- Access token stored in `localStorage` (`claimswift_token`)
- User stored in `localStorage` (`claimswift_user`)
- Token refresh attempted when token is near expiry

## Build Output

Production build output path:

- `dist/claimswift-frontend`

## Next Recommended Steps

- Replace placeholder pages with feature-specific components
- Connect forms/tables to real service calls and state handling
- Add unit tests for guards, interceptors, and core services
- Add route-level lazy loading for feature modules
