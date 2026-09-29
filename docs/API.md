# REST API Reference Standard

All API endpoints return a standardized envelope schema:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "error_code": null
}
```

## Key Endpoints Overview

### 1. Authentication (`/api/v1/auth`)
- `POST /login`: Authenticate with email & password, returns JWT `access_token` and `refresh_token`.
- `POST /refresh`: Exchange refresh token for fresh access token pair.
- `POST /logout`: Invalidate refresh token and record audit event.
- `GET /me`: Fetch authenticated user profile with roles and permission list.

### 2. Knowledge Library (`/api/v1/knowledge`)
- `GET /`: Search resources with category, type, tag filters, sorting, and pagination.
- `GET /{id}`: Fetch resource detail and increment view counter.
- `POST /upload`: Multipart upload with physical asset storage.
- `PUT /{id}`: Update resource details.
- `DELETE /{id}`: Remove resource and storage asset.
- `GET /{id}/download`: Download asset with sanitized `Content-Disposition`.

### 3. Learning Paths (`/api/v1/learning-paths`)
- `GET /`: List roadmap paths with individual progress percentages.
- `GET /{id}`: Full curriculum detail with milestones and attached resources.
- `POST /`: Create learning path (requires `path:manage`).
- `POST /modules/{id}/toggle-progress`: Toggle milestone completion for user.

### 4. Daily Learning Journal (`/api/v1/learning`)
- `GET /`: List user or team learning logs.
- `POST /`: Record today's learning and deliverables.
- `PUT /{id}`: Update journal log.
- `DELETE /{id}`: Delete journal log.

### 5. Submissions & Reviews (`/api/v1/submissions` & `/api/v1/reviews`)
- `GET /submissions`: List user submissions with review status.
- `POST /submissions`: Submit work for mentor review.
- `GET /reviews/pending`: Mentor review queue (requires `submission:review`).
- `POST /reviews/{id}/review`: Approve, request changes, or evaluate submission with feedback.

### 6. Company Projects (`/api/v1/projects`)
- `GET /`: Explore company projects and services.
- `POST /`: Document project architecture and repositories.

### 7. Governance & Users (`/api/v1/users` & `/api/v1/audit-logs`)
- `GET /users`: User directory with search and role filters.
- `POST /users`: Provision user account.
- `PUT /users/{id}/roles`: Assign/modify roles for user.
- `GET /audit-logs`: Inspect system event trail.
