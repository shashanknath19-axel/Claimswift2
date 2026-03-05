# Notification Service

Real-time notification service with REST APIs and WebSocket/STOMP delivery.

## Port

- `8086`

## Database

- Default schema: `notification_db`
- Main env vars:
  - `NOTIFICATION_DB_URL`
  - `NOTIFICATION_DB_USERNAME`
  - `NOTIFICATION_DB_PASSWORD`

## WebSocket

- STOMP SockJS endpoint: `/ws/notifications`
- Broker destinations: `/topic`, `/queue`
- App destination prefix: `/app`
- User destination prefix: `/user`

## API Endpoints

Base path: `/api/notifications`

- `GET /`
- `GET /unread`
- `GET /unread/count`
- `PUT /{id}/read`
- `PUT /read-all`
- `POST /send`
- `DELETE /{id}`
- `POST /test`

## Run

```bash
mvn -pl notification-service spring-boot:run
```
