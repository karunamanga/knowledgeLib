# Database Architecture & Entity Relationships

The platform utilizes a relational database structure designed for PostgreSQL (with SQLite compatibility for fast local testing).

## Entity Relationship Overview

```mermaid
erDiagram
    users ||--o{ user_roles : has
    roles ||--o{ user_roles : assigned_to
    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : granted_to
    
    users ||--o{ refresh_tokens : owns
    users ||--o{ learning_entries : logs
    users ||--o{ submissions : creates
    users ||--o{ submissions : reviews
    users ||--o{ resources : authors
    users ||--o{ user_path_progress : tracks
    users ||--o{ user_module_progress : completes
    
    categories ||--o{ resources : classifies
    resources ||--o{ resource_tags : tagged_with
    tags ||--o{ resource_tags : assigned_to
    
    learning_paths ||--o{ learning_modules : contains
    learning_modules ||--o{ learning_module_resources : links
    resources ||--o{ learning_module_resources : attached_to
    
    learning_entries ||--o{ submissions : generates
    submissions ||--o{ submission_history : tracks
    
    projects ||--o{ project_resources : references
    resources ||--o{ project_resources : included_in
```

## Schema Definitions

1. **`users`**: Corporate identity, hashed password (bcrypt), designation, department, active status.
2. **`roles`**: Named roles (`ADMIN`, `MENTOR`, `EMPLOYEE`).
3. **`permissions`**: Granular permissions (`knowledge:read`, `submission:review`, etc.).
4. **`user_roles` & `role_permissions`**: Many-to-many junction tables.
5. **`refresh_tokens`**: Opaque rotated refresh tokens with expiry and revocation flags.
6. **`categories` & `tags`**: Flexible content taxonomy.
7. **`resources`**: Multitype assets (`DOCUMENT`, `PRESENTATION`, `PDF`, `ARCHITECTURE`, `VIDEO`, etc.) with view and download counters.
8. **`learning_paths` & `learning_modules`**: Structured curriculum trees with progress tracking.
9. **`user_path_progress` & `user_module_progress`**: Individual milestone completion and percentage calculations.
10. **`learning_entries`**: Daily journal entries with date, learnings, and deliverables.
11. **`submissions` & `submission_history`**: Capstone and exercise submissions with reviewer feedback.
12. **`projects`**: Internal system architectures, tech stacks, and repository references.
13. **`audit_logs`**: Immutable security and mutation event trail.
