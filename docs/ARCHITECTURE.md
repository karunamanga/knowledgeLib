# Architecture Design & Technical Blueprint

## 1. Architectural Style: Modular Monolith

The **Organisation Learning & Knowledge Portal** is engineered as a clean **Modular Monolith** in Python FastAPI on the backend and a **Feature-Based SPA** in React & TypeScript on the frontend.

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query)
   │
   ▼ (RESTful JSON API via Axios Interceptors / Bearer Tokens)
Backend (FastAPI Modular Monolith)
   │
   ├── Core Layer (Config, Security, Exceptions, Dependencies, Database Engine)
   │
   ├── Module Layer
   │   ├── Auth (JWT, Refresh Token Rotation, Cryptographic Nonces)
   │   ├── Users & RBAC (Database-driven Roles & Permissions)
   │   ├── Knowledge Library (Multi-type resources, faceted search)
   │   ├── Learning Paths (Roadmaps, milestone tracking)
   │   ├── Daily Journal (Daily learning entries, deliverable logs)
   │   ├── Submissions & Reviews (Multi-state submission workflow, mentor feedback)
   │   ├── Projects (Company systems, architecture blueprints)
   │   └── Audit Logging (Security & mutation events)
   │
   ├── Storage Abstraction (StorageInterface -> LocalStorage / S3Storage)
   │
   └── Relational Database (PostgreSQL / SQLite via SQLAlchemy 2.0 ORM)
```

## 2. Layered Responsibilities

Every module strictly enforces unidirectional separation of concerns:

```
Router (HTTP Parsing & Response Serialization)
  ↓
Schema (Pydantic Request Validation & Output Typing)
  ↓
Service (Business Rules, Authorization Checks, Audit Event Triggers)
  ↓
Repository (SQLAlchemy ORM Queries, Filtering, Aggregations)
  ↓
Database (Relational Tables & Constraints)
```

### Business Rule Enforcement
1. **Routers** contain **zero** business logic. They parse query/path/body parameters, invoke dependencies (`get_current_user`, `require_permission`), delegate to the service layer, and wrap outcomes in `APIResponse`.
2. **Services** execute domain logic, verify object ownership, perform calculations (e.g., path progression % computation, submission state machines), and emit immutable audit events.
3. **Repositories** encapsulate pure database transactions.
4. **Storage Integrations** are isolated behind `StorageInterface` so the Knowledge module never binds to filesystem or AWS SDK implementations directly.

---

## 3. Storage Abstraction Layer

```
StorageInterface (ABC)
├── upload(file_content, filename, content_type) -> metadata
├── download(storage_key) -> (content, filename, content_type)
├── delete(storage_key) -> bool
├── generate_url(storage_key) -> str
└── exists(storage_key) -> bool
```

- **LocalStorage**: Safely maps incoming files to UUID-named files on disk inside a dedicated directory, storing original metadata in companion JSON records. Prevents directory traversal attacks.
- **S3Storage**: Cloud-native provider targeting AWS S3 / MinIO using signed URLs.

---

## 4. Future AI Extensions Blueprint

The architecture is prepared for future optional AI capabilities:
- **AI Knowledge Assistant**: Service-level hook in `knowledge/service.py` to index embeddings and query vector databases without changing the resource schema.
- **Document Summarization**: Asynchronous worker consuming `RESOURCE_CREATED` events.
- **Natural Language Search**: Pluggable search repository implementation matching the current `KnowledgeRepository` interface.
