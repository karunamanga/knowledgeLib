# knowledgeLib

### Organisation Learning & Knowledge Portal

An internal company knowledge repository and employee learning management platform built for modern engineering organizations.

---

## 🌟 Key Features

1. **Modular Monolith Backend**: Layered architecture (Router -> Schema -> Service -> Repository -> Database) built with Python, FastAPI, and SQLAlchemy 2.0.
2. **Modern Feature-Based Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Lucide icons, Dark/Light modes, and subtle gradient micro-interactions.
3. **Enterprise Authentication & RBAC**: JWT Access tokens, secure refresh token rotation, bcrypt password hashing, and database-driven granular permissions (`EMPLOYEE`, `MENTOR`, `ADMIN`).
4. **Knowledge Library**: Multi-type knowledge repository (Presentations, PDFs, Documents, Architecture Blueprints, System Diagrams, Videos, External Links) with faceted search, tag pills, view/download counters, and storage abstraction.
5. **Storage Abstraction**: Decoupled `StorageInterface` with `LocalStorage` (UUID storage keys) and cloud-ready `S3Storage`.
6. **Guided Learning Roadmaps**: Sequential curriculum milestones with progress percentage calculation (0%, 25%, 50%, 75%, 100%) and linked architecture guides.
7. **Daily Learning Journal**: Day-by-day learning logs ("What I learned today" & "Work completed") with 1-click submission for mentor evaluation.
8. **Submissions & Mentor Code Reviews**: Multi-state review workflow (`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` / `REJECTED` -> `RESUBMITTED`) with mentor feedback feedback loops and audit histories.
9. **Company Projects Hub**: Internal project directories with problem statements, architecture blueprints, repository links, and tech stack tags.
10. **Governance & Audit Logging**: Dedicated Admin Portal for user provisioning, role assignments, category taxonomy management, and security audit log inspection.

---

## 🏗️ Project Structure

```
organisation-portal/
├── Backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entrypoint
│   │   ├── core/                    # Config, DB, Security, Exceptions, Dependencies
│   │   ├── api/                     # Unified API v1 Router
│   │   ├── modules/                 # Modular Domain Units
│   │   │   ├── auth/                # Authentication & Token Management
│   │   │   ├── users/               # Users & RBAC
│   │   │   ├── knowledge/           # Resources & Faceted Search
│   │   │   ├── learning_paths/      # Roadmaps & Milestones
│   │   │   ├── learning/            # Daily Learning Journal
│   │   │   ├── submissions/         # Capstone Submissions & History
│   │   │   ├── reviews/             # Mentor Review Queue
│   │   │   ├── projects/            # Company Projects & Architectures
│   │   │   ├── categories/          # Categories & Topic Tags
│   │   │   └── audit/               # Immutable Security Logs
│   │   ├── shared/                  # Enums, Responses, Pagination
│   │   └── integrations/storage/    # Storage Abstraction (Local & S3)
│   ├── tests/                       # Unit & Integration Tests
│   ├── requirements.txt
│   └── Dockerfile
├── Frontend/
│   ├── src/
│   │   ├── api/                     # Axios Client with Token Refresh Interceptor
│   │   ├── components/              # Buttons, Modals, Badges, Skeletons, Layout
│   │   ├── context/                 # Auth, Theme, and Toast Contexts
│   │   ├── features/                # Domain-Driven Pages (Dashboard, Knowledge, Paths...)
│   │   ├── types/                   # Unified TypeScript Interfaces
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/                            # Architecture, Database, API, RBAC, Storage Specs
├── infrastructure/                  # PostgreSQL init scripts
├── scripts/                         # Local development execution scripts
├── docker-compose.yml
└── README.md
```

---

## 🔑 Demo User Credentials

The database comes pre-seeded with realistic enterprise users:

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Sarah Jenkins (Admin)** | `admin@company.com` | `Admin@123` | `ADMIN` (VP of Engineering) |
| **Alex Rivera (Mentor)** | `mentor.alex@company.com` | `Mentor@123` | `MENTOR` (Principal Architect) |
| **Ravi Kumar (Employee)** | `ravi.kumar@company.com` | `Employee@123` | `EMPLOYEE` (Associate Engineer) |
| **Priya Sharma (Intern)** | `priya.sharma@company.com` | `Employee@123` | `EMPLOYEE` (Frontend Intern) |

*The login page includes 1-click quick autofill buttons for each account.*

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
cd Backend
python -m app.core.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Server: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

- Web Portal: `http://localhost:5173`

---

## 🐳 Docker Deployment

To launch the full stack (PostgreSQL + FastAPI Backend + Vite Nginx Frontend) with Docker:

```bash
docker-compose up --build
```

- Frontend Application: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL Database: `localhost:5432`

---

## 🧪 Running Tests

Execute the automated test suite covering Authentication, RBAC, Knowledge Search, Learning Journal, Submissions, and Reviews:

```bash
cd Backend
python -m unittest discover -s tests -p "test_*.py"
```
