from datetime import datetime, date, timedelta, timezone
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.init_db import init_tables
from app.modules.users.models import User, Role, Permission
from app.modules.categories.models import Category, Tag
from app.modules.knowledge.models import Resource
from app.modules.learning_paths.models import LearningPath, LearningModule, LearningModuleResource, UserPathProgress, UserModuleProgress
from app.modules.learning.models import LearningEntry
from app.modules.submissions.models import Submission, SubmissionHistory
from app.modules.projects.models import Project
from app.modules.audit.models import AuditLog
from app.shared.enums import RoleName, PermissionCode, ResourceType, SubmissionStatus, LearningStatus, AuditAction

def seed_database():
    init_tables()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Role).count() > 0:
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Permissions
        permissions_data = [
            (PermissionCode.KNOWLEDGE_READ.value, "Read Knowledge", "View and search knowledge resources"),
            (PermissionCode.KNOWLEDGE_CREATE.value, "Create Knowledge", "Upload and create knowledge resources"),
            (PermissionCode.KNOWLEDGE_UPDATE.value, "Update Knowledge", "Edit knowledge resources"),
            (PermissionCode.KNOWLEDGE_DELETE.value, "Delete Knowledge", "Delete knowledge resources"),
            (PermissionCode.LEARNING_READ.value, "Read Learning", "View learning journal entries"),
            (PermissionCode.LEARNING_CREATE.value, "Create Learning", "Record daily learning logs"),
            (PermissionCode.LEARNING_UPDATE.value, "Update Learning", "Update learning journal logs"),
            (PermissionCode.LEARNING_DELETE.value, "Delete Learning", "Delete learning journal logs"),
            (PermissionCode.PATH_READ.value, "Read Paths", "Explore and track learning paths"),
            (PermissionCode.PATH_MANAGE.value, "Manage Paths", "Create and edit learning paths"),
            (PermissionCode.SUBMISSION_CREATE.value, "Create Submission", "Submit learning work for review"),
            (PermissionCode.SUBMISSION_READ.value, "Read Submissions", "View submission status and feedback"),
            (PermissionCode.SUBMISSION_REVIEW.value, "Review Submissions", "Approve, reject and review employee submissions"),
            (PermissionCode.PROJECT_READ.value, "Read Projects", "View company projects knowledge"),
            (PermissionCode.PROJECT_MANAGE.value, "Manage Projects", "Create and edit company projects"),
            (PermissionCode.USER_READ.value, "Read Users", "View user directories and profiles"),
            (PermissionCode.USER_UPDATE.value, "Update Users", "Update user profile details"),
            (PermissionCode.USER_MANAGE.value, "Manage Users", "Full admin user & role management"),
            (PermissionCode.CATEGORY_MANAGE.value, "Manage Categories", "Create and edit categories"),
            (PermissionCode.AUDIT_READ.value, "Read Audit Logs", "Inspect security and audit event logs"),
        ]

        permission_map = {}
        for code, name, desc in permissions_data:
            perm = Permission(code=code, name=name, description=desc)
            db.add(perm)
            permission_map[code] = perm
        db.commit()

        # 2. Roles
        admin_role = Role(
            name=RoleName.ADMIN.value,
            description="Full system administrator with unrestricted access",
            permissions=list(permission_map.values())
        )

        mentor_perms = [
            permission_map[PermissionCode.KNOWLEDGE_READ.value],
            permission_map[PermissionCode.KNOWLEDGE_CREATE.value],
            permission_map[PermissionCode.KNOWLEDGE_UPDATE.value],
            permission_map[PermissionCode.LEARNING_READ.value],
            permission_map[PermissionCode.LEARNING_CREATE.value],
            permission_map[PermissionCode.PATH_READ.value],
            permission_map[PermissionCode.PATH_MANAGE.value],
            permission_map[PermissionCode.SUBMISSION_READ.value],
            permission_map[PermissionCode.SUBMISSION_REVIEW.value],
            permission_map[PermissionCode.PROJECT_READ.value],
            permission_map[PermissionCode.PROJECT_MANAGE.value],
            permission_map[PermissionCode.USER_READ.value],
        ]
        mentor_role = Role(
            name=RoleName.MENTOR.value,
            description="Senior mentor capable of reviewing submissions and publishing curriculum",
            permissions=mentor_perms
        )

        employee_perms = [
            permission_map[PermissionCode.KNOWLEDGE_READ.value],
            permission_map[PermissionCode.KNOWLEDGE_CREATE.value],
            permission_map[PermissionCode.LEARNING_READ.value],
            permission_map[PermissionCode.LEARNING_CREATE.value],
            permission_map[PermissionCode.LEARNING_UPDATE.value],
            permission_map[PermissionCode.PATH_READ.value],
            permission_map[PermissionCode.SUBMISSION_CREATE.value],
            permission_map[PermissionCode.SUBMISSION_READ.value],
            permission_map[PermissionCode.PROJECT_READ.value],
            permission_map[PermissionCode.USER_READ.value],
        ]
        employee_role = Role(
            name=RoleName.EMPLOYEE.value,
            description="Standard employee, intern, or fresher with access to learning and library",
            permissions=employee_perms
        )

        db.add_all([admin_role, mentor_role, employee_role])
        db.commit()

        # 3. Users
        admin_user = User(
            email="admin@company.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Sarah Jenkins",
            designation="VP of Engineering",
            department="Leadership & Engineering",
            joining_date=datetime.now(timezone.utc) - timedelta(days=700),
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            roles=[admin_role]
        )

        mentor_user = User(
            email="mentor.alex@company.com",
            hashed_password=get_password_hash("Mentor@123"),
            full_name="Alex Rivera",
            designation="Principal Architect & Tech Lead",
            department="Platform Engineering",
            joining_date=datetime.now(timezone.utc) - timedelta(days=500),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            roles=[mentor_role]
        )

        employee_ravi = User(
            email="ravi.kumar@company.com",
            hashed_password=get_password_hash("Employee@123"),
            full_name="Ravi Kumar",
            designation="Associate Software Engineer",
            department="Backend Engineering",
            joining_date=datetime.now(timezone.utc) - timedelta(days=90),
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            roles=[employee_role]
        )

        employee_priya = User(
            email="priya.sharma@company.com",
            hashed_password=get_password_hash("Employee@123"),
            full_name="Priya Sharma",
            designation="Frontend Engineer Intern",
            department="UI Engineering",
            joining_date=datetime.now(timezone.utc) - timedelta(days=45),
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            roles=[employee_role]
        )

        db.add_all([admin_user, mentor_user, employee_ravi, employee_priya])
        db.commit()

        # 4. Categories
        cat_backend = Category(name="Backend Architecture", slug="backend-architecture", description="APIs, databases, server patterns, and backend frameworks", icon="server", color="#6366f1")
        cat_frontend = Category(name="Frontend & Web", slug="frontend-web", description="React, TypeScript, CSS architectures, and user interfaces", icon="layout", color="#06b6d4")
        cat_cloud = Category(name="Cloud & DevOps", slug="cloud-devops", description="CI/CD pipelines, Docker, Kubernetes, and AWS architecture", icon="cloud", color="#8b5cf6")
        cat_db = Category(name="Database Engineering", slug="database-engineering", description="PostgreSQL, schema design, indexes, and query optimizations", icon="database", color="#10b981")
        cat_security = Category(name="Security & Compliance", slug="security-compliance", description="Authentication, authorization, cryptography, and zero-trust guidelines", icon="shield", color="#f43f5e")
        cat_arch = Category(name="System Design", slug="system-design", description="High-level architecture, scalability, distributed systems patterns", icon="cpu", color="#f59e0b")

        db.add_all([cat_backend, cat_frontend, cat_cloud, cat_db, cat_security, cat_arch])
        db.commit()

        # 5. Tags
        tags_list = [
            Tag(name="Python", slug="python"),
            Tag(name="FastAPI", slug="fastapi"),
            Tag(name="React", slug="react"),
            Tag(name="TypeScript", slug="typescript"),
            Tag(name="PostgreSQL", slug="postgresql"),
            Tag(name="Docker", slug="docker"),
            Tag(name="Architecture", slug="architecture"),
            Tag(name="Security", slug="security"),
            Tag(name="REST", slug="rest"),
            Tag(name="JWT", slug="jwt"),
        ]
        db.add_all(tags_list)
        db.commit()
        tag_dict = {t.slug: t for t in tags_list}

        # 6. Resources
        r1 = Resource(
            title="FastAPI Production Architecture & Layering Standard",
            description="Comprehensive guide covering modular monolith architecture, repository patterns, dependency injection, and clean boundaries in Python FastAPI services.",
            resource_type=ResourceType.PRESENTATION,
            category_id=cat_backend.id,
            author_id=mentor_user.id,
            external_url="https://fastapi.tiangolo.com/tutorial/bigger-applications/",
            view_count=142,
            download_count=38,
            tags=[tag_dict["python"], tag_dict["fastapi"], tag_dict["architecture"]]
        )

        r2 = Resource(
            title="Enterprise PostgreSQL Schema Design & Indexing Best Practices",
            description="Deep dive into B-Tree indexes, partial indexes, foreign key constraints, connection pooling, and query tuning in relational database systems.",
            resource_type=ResourceType.PDF,
            category_id=cat_db.id,
            author_id=admin_user.id,
            external_url="https://www.postgresql.org/docs/current/indexes.html",
            view_count=98,
            download_count=45,
            tags=[tag_dict["postgresql"], tag_dict["architecture"]]
        )

        r3 = Resource(
            title="React 18 & TypeScript Production Application Blueprint",
            description="Feature-based directory structures, centralized API clients, TanStack Query caching strategies, and resilient error boundary patterns.",
            resource_type=ResourceType.DOCUMENT,
            category_id=cat_frontend.id,
            author_id=mentor_user.id,
            external_url="https://react.dev/learn",
            view_count=185,
            download_count=62,
            tags=[tag_dict["react"], tag_dict["typescript"]]
        )

        r4 = Resource(
            title="Zero-Trust Authentication & RBAC Implementation Blueprint",
            description="Architectural document describing JWT token lifecycle, refresh token rotation, database-driven permissions, and cryptographic best practices.",
            resource_type=ResourceType.ARCHITECTURE,
            category_id=cat_security.id,
            author_id=admin_user.id,
            external_url="https://auth0.com/docs/secure/tokens",
            view_count=210,
            download_count=89,
            tags=[tag_dict["security"], tag_dict["jwt"], tag_dict["architecture"]]
        )

        r5 = Resource(
            title="Containerization and Local Environment Setup with Docker",
            description="Practical guide to configuring multi-stage Docker builds, docker-compose orchestration, environment variables, and volume persistence.",
            resource_type=ResourceType.DOCUMENT,
            category_id=cat_cloud.id,
            author_id=mentor_user.id,
            external_url="https://docs.docker.com/compose/",
            view_count=76,
            download_count=29,
            tags=[tag_dict["docker"], tag_dict["architecture"]]
        )

        db.add_all([r1, r2, r3, r4, r5])
        db.commit()

        # 7. Learning Paths
        lp1 = LearningPath(
            title="Python Backend Developer Roadmap",
            description="Master production Python backend development from foundations through REST APIs, relational databases, authentication, testing, and system architecture.",
            level="Intermediate",
            estimated_hours=24.0,
            author_id=mentor_user.id,
            is_published=True
        )
        db.add(lp1)
        db.commit()

        m1 = LearningModule(path_id=lp1.id, title="1. Python Core & Modern OOP Patterns", description="Advanced data structures, generators, type hints, and clean object-oriented architecture.", order_index=0)
        m2 = LearningModule(path_id=lp1.id, title="2. Relational Database Design with PostgreSQL", description="Schema design, normalization, foreign keys, and SQLAlchemy 2.0 ORM patterns.", order_index=1)
        m3 = LearningModule(path_id=lp1.id, title="3. Building REST APIs with FastAPI & Pydantic", description="FastAPI router hierarchy, request validation, middleware, and dependency injection.", order_index=2)
        m4 = LearningModule(path_id=lp1.id, title="4. Enterprise Security, JWT & RBAC", description="Password hashing, JWT access & refresh tokens, and granular permission enforcement.", order_index=3)
        m5 = LearningModule(path_id=lp1.id, title="5. Capstone Project & Integration Testing", description="Building a full modular monolith service with pytest integration test suite.", order_index=4)
        db.add_all([m1, m2, m3, m4, m5])
        db.commit()

        db.add(LearningModuleResource(module_id=m2.id, resource_id=r2.id, order_index=0))
        db.add(LearningModuleResource(module_id=m3.id, resource_id=r1.id, order_index=0))
        db.add(LearningModuleResource(module_id=m4.id, resource_id=r4.id, order_index=0))
        db.commit()

        # Mark modules 1 and 2 completed for Ravi
        db.add(UserModuleProgress(user_id=employee_ravi.id, module_id=m1.id, is_completed=True, completed_at=datetime.now(timezone.utc) - timedelta(days=5)))
        db.add(UserModuleProgress(user_id=employee_ravi.id, module_id=m2.id, is_completed=True, completed_at=datetime.now(timezone.utc) - timedelta(days=2)))
        db.add(UserPathProgress(user_id=employee_ravi.id, path_id=lp1.id, progress_percentage=40.0, status="IN_PROGRESS"))
        db.commit()

        # 8. Daily Learning Journal Entries
        le1 = LearningEntry(
            user_id=employee_ravi.id,
            title="REST API Fundamentals & HTTP Methods",
            description="Studied HTTP methods (GET, POST, PUT, DELETE, PATCH), idempotency guarantees, status codes (200, 201, 400, 401, 403, 404, 422, 500), and FastAPI route structuring.",
            work_completed="Implemented health check and auth login routes in FastAPI with Pydantic validation schemas.",
            learning_date=date.today() - timedelta(days=2),
            status=LearningStatus.COMPLETED,
            resources=[r1]
        )
        le2 = LearningEntry(
            user_id=employee_ravi.id,
            title="PostgreSQL Indexing & Query Optimizations",
            description="Explored B-Tree indexing on foreign key columns and composite search filters. Analyzed EXPLAIN query execution plans.",
            work_completed="Created database schema definitions with proper indexes and unique constraints.",
            learning_date=date.today() - timedelta(days=1),
            status=LearningStatus.COMPLETED,
            resources=[r2]
        )
        le3 = LearningEntry(
            user_id=employee_ravi.id,
            title="JWT Refresh Token Rotation & RBAC Dependencies",
            description="Deep dive into access vs refresh token lifecycle, argon2/bcrypt password hashing, and dependency injection in FastAPI for role and permission authorization.",
            work_completed="Built require_permission dependency check and configured auth router.",
            learning_date=date.today(),
            status=LearningStatus.IN_PROGRESS,
            resources=[r4]
        )
        db.add_all([le1, le2, le3])
        db.commit()

        # 9. Submissions & Reviews
        sub1 = Submission(
            user_id=employee_ravi.id,
            learning_entry_id=le1.id,
            title="REST API & Authentication Architecture Submission",
            description="Implemented complete authentication flow with JWT tokens, password hashing, and error response formatting.",
            status=SubmissionStatus.APPROVED,
            reviewer_id=mentor_user.id,
            feedback="Excellent work! The route separation and Pydantic validation schemas look clean and adhere strictly to our enterprise standards.",
            submitted_at=datetime.now(timezone.utc) - timedelta(days=2),
            reviewed_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        db.add(sub1)
        db.commit()

        db.add(SubmissionHistory(
            submission_id=sub1.id,
            status=SubmissionStatus.SUBMITTED,
            actor_id=employee_ravi.id,
            comments="Submitted REST API implementation for code review"
        ))
        db.add(SubmissionHistory(
            submission_id=sub1.id,
            status=SubmissionStatus.APPROVED,
            actor_id=mentor_user.id,
            comments="Approved after reviewing schemas and architecture"
        ))

        sub2 = Submission(
            user_id=employee_ravi.id,
            learning_entry_id=le2.id,
            title="PostgreSQL Schema & Indexing Benchmark Submission",
            description="Submitted schema migration scripts and benchmark comparison of queries with and without indexes.",
            status=SubmissionStatus.SUBMITTED,
            submitted_at=datetime.now(timezone.utc) - timedelta(hours=4)
        )
        db.add(sub2)
        db.commit()

        db.add(SubmissionHistory(
            submission_id=sub2.id,
            status=SubmissionStatus.SUBMITTED,
            actor_id=employee_ravi.id,
            comments="Submitted database indexing benchmarks"
        ))
        db.commit()

        # 10. Projects
        p1 = Project(
            name="Organisation Learning & Knowledge Portal",
            slug="organisation-learning-knowledge-portal",
            problem_statement="Fragmented institutional knowledge, onboarding bottlenecks for new team members, and lack of structured learning progression across engineering teams.",
            description="A unified enterprise knowledge repository and structured employee learning management platform with daily journaling, mentor code reviews, and role-based access control.",
            technologies="Python, FastAPI, PostgreSQL, SQLAlchemy, React, TypeScript, Tailwind CSS, TanStack Query",
            repository_url="https://github.com/company/organisation-portal",
            documentation_url="https://docs.company.internal/learning-portal",
            architecture_summary="Modular monolith architecture on FastAPI, clean layered services/repositories, storage abstraction for assets, and feature-based React frontend.",
            created_by=admin_user.id,
            resources=[r1, r3, r4]
        )

        p2 = Project(
            name="Enterprise Expense & Invoice Reconciliation Engine",
            slug="enterprise-expense-invoice-reconciliation-engine",
            problem_statement="Manual processing of multi-currency employee expense claims and vendor invoices causing delays and auditing overhead.",
            description="Automated expense submission, multi-tier approval workflows, OCR document scanning, and automated accounting ledger reconciliation.",
            technologies="Python, FastAPI, Celery, Redis, PostgreSQL, React, TypeScript",
            repository_url="https://github.com/company/expense-engine",
            documentation_url="https://docs.company.internal/expense-engine",
            architecture_summary="Asynchronous task processing architecture with Celery workers, distributed locks, and PostgreSQL transactional ledgers.",
            created_by=mentor_user.id,
            resources=[r2, r5]
        )
        db.add_all([p1, p2])
        db.commit()

        # 11. Initial Audit Logs
        db.add(AuditLog(
            action=AuditAction.LOGIN,
            user_id=admin_user.id,
            user_email=admin_user.email,
            details="System initialization and initial seed data provisioned"
        ))
        db.commit()

        print("Seeding completed successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
