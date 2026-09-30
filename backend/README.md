# C3S Phase 1 Backend

Spring Boot 3 / Java 21 service for the Campus Surveillance & Safety System. This phase intentionally implements only SOS, location, emergency media, responder assignment, notifications/events, and incident lifecycle management.

## Run locally

Prerequisites: Java 21, Maven 3.9+, Docker or MySQL 8.

```bash
cd backend
# Start MySQL from the repository root if desired:
docker compose -f docker-compose.safety.yml up -d mysql
mvn spring-boot:run
```

Environment variables:

- `DB_URL` default `jdbc:mysql://localhost:3306/c3s_safety?...`
- `DB_USERNAME` / `DB_PASSWORD`
- `JWT_SECRET` must be a random 32+ byte secret outside development
- `MEDIA_ROOT` default `./var/media` and must not be served as static files

Flyway creates the Phase 1 schema on startup. Development seed accounts use password `change-me` and must be replaced before deployment:

- `admin@c3s.local` / `change-me`
- `student@c3s.local` / `change-me`
- `guard@c3s.local` / `change-me`

## API and events

JWT login: `POST /api/auth/login`, logout: `POST /api/auth/logout`.
SOS lifecycle: `POST /api/sos`, `GET /api/sos/active`, `GET /api/sos/{id}`, and lifecycle action endpoints under `/api/sos/{id}`.
Location: `POST /api/location`, `GET /api/incidents/{id}/location`.
Media: multipart `POST /api/incidents/{id}/media`, protected `GET /api/incidents/{id}/media`.
Admin: `/api/admin/incidents`, `/api/admin/responders`, `/api/admin/assign-responder`.

Connect a STOMP client to `/ws` and subscribe to `/topic/safety`. Events include `sos.created`, `sos.acknowledged`, `sos.assigned`, `sos.responding`, `sos.on_site`, `sos.resolved`, and `location.updated`.

## Security notes

Camera and location permissions are requested by the frontend only after a student confirms SOS. Media is stored by opaque key outside the public directory. Location and media endpoints require authenticated roles, and student access is restricted to the student's own incident. Production deployment must terminate HTTPS, replace the demo seed credentials, set a strong JWT secret, add a distributed rate limiter, and use object storage with private signed access.
