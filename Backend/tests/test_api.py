import os
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.core.init_db import init_tables
from app.main import app
from app.shared.enums import RoleName, PermissionCode, ResourceType, SubmissionStatus, LearningStatus
from app.modules.users.models import User, Role, Permission
from app.modules.categories.models import Category, Tag
from app.modules.knowledge.models import Resource
from app.modules.learning.models import LearningEntry
from app.modules.submissions.models import Submission

# Use SQLite with StaticPool so all connections share the exact same in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestOrganisationPortalAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls._setup_initial_data()

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=engine)

    @classmethod
    def _setup_initial_data(cls):
        db = TestingSessionLocal()
        try:
            # Create permissions
            p_k_read = Permission(code=PermissionCode.KNOWLEDGE_READ.value, name="Read Knowledge")
            p_k_create = Permission(code=PermissionCode.KNOWLEDGE_CREATE.value, name="Create Knowledge")
            p_sub_create = Permission(code=PermissionCode.SUBMISSION_CREATE.value, name="Create Submission")
            p_sub_rev = Permission(code=PermissionCode.SUBMISSION_REVIEW.value, name="Review Submission")
            p_user_manage = Permission(code=PermissionCode.USER_MANAGE.value, name="Manage Users")
            p_user_read = Permission(code=PermissionCode.USER_READ.value, name="Read Users")
            db.add_all([p_k_read, p_k_create, p_sub_create, p_sub_rev, p_user_manage, p_user_read])
            db.commit()

            # Create roles
            r_admin = Role(name=RoleName.ADMIN.value, description="Admin Role", permissions=[p_k_read, p_k_create, p_sub_create, p_sub_rev, p_user_manage, p_user_read])
            r_mentor = Role(name=RoleName.MENTOR.value, description="Mentor Role", permissions=[p_k_read, p_k_create, p_sub_rev, p_user_read])
            r_employee = Role(name=RoleName.EMPLOYEE.value, description="Employee Role", permissions=[p_k_read, p_k_create, p_sub_create, p_user_read])
            db.add_all([r_admin, r_mentor, r_employee])
            db.commit()

            # Create users
            admin = User(
                email="admin@test.com",
                hashed_password=get_password_hash("AdminPass123"),
                full_name="Admin Test",
                roles=[r_admin]
            )
            mentor = User(
                email="mentor@test.com",
                hashed_password=get_password_hash("MentorPass123"),
                full_name="Mentor Test",
                roles=[r_mentor]
            )
            employee = User(
                email="employee@test.com",
                hashed_password=get_password_hash("EmpPass123"),
                full_name="Employee Test",
                roles=[r_employee]
            )
            db.add_all([admin, mentor, employee])
            db.commit()

            # Create category & tag
            cat = Category(name="Engineering", slug="engineering", description="Core engineering")
            tag = Tag(name="Python", slug="python")
            db.add_all([cat, tag])
            db.commit()

            # Create sample resource
            res = Resource(
                title="Python Fast Guide",
                description="Guide on FastAPI",
                resource_type=ResourceType.DOCUMENT,
                category_id=cat.id,
                author_id=mentor.id,
                tags=[tag]
            )
            db.add(res)
            db.commit()
        finally:
            db.close()

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_02_login_success(self):
        res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("access_token", data["data"])
        self.assertIn("refresh_token", data["data"])

    def test_03_login_invalid_password(self):
        res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "WrongPassword!"
        })
        self.assertEqual(res.status_code, 401)
        self.assertFalse(res.json()["success"])

    def test_04_auth_me_endpoint(self):
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        token = login_res.json()["data"]["access_token"]

        res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"]["email"], "employee@test.com")

    def test_05_refresh_token(self):
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        refresh_token = login_res.json()["data"]["refresh_token"]

        res = self.client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        self.assertEqual(res.status_code, 200)
        self.assertIn("access_token", res.json()["data"])

    def test_06_knowledge_search_and_list(self):
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        token = login_res.json()["data"]["access_token"]

        res = self.client.get("/api/v1/knowledge?search=FastAPI", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        items = res.json()["data"]["items"]
        self.assertGreaterEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Python Fast Guide")

    def test_07_learning_journal_creation(self):
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        token = login_res.json()["data"]["access_token"]

        res = self.client.post(
            "/api/v1/learning",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": "Asyncio in Python",
                "description": "Learned event loops, coroutines and task scheduling.",
                "work_completed": "Wrote benchmark scripts.",
                "status": "IN_PROGRESS"
            }
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["data"]["title"], "Asyncio in Python")

    def test_08_submission_and_review_workflow(self):
        # 1. Employee creates submission
        emp_login = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        emp_token = emp_login.json()["data"]["access_token"]

        create_sub_res = self.client.post(
            "/api/v1/submissions?as_submitted=true",
            headers={"Authorization": f"Bearer {emp_token}"},
            json={
                "title": "Asyncio Architecture Exercise",
                "description": "Completed async benchmark and presentation."
            }
        )
        self.assertEqual(create_sub_res.status_code, 200)
        sub_id = create_sub_res.json()["data"]["id"]
        self.assertEqual(create_sub_res.json()["data"]["status"], "SUBMITTED")

        # 2. Mentor reviews submission
        mentor_login = self.client.post("/api/v1/auth/login", json={
            "email": "mentor@test.com",
            "password": "MentorPass123"
        })
        mentor_token = mentor_login.json()["data"]["access_token"]

        review_res = self.client.post(
            f"/api/v1/reviews/{sub_id}/review",
            headers={"Authorization": f"Bearer {mentor_token}"},
            json={
                "status": "APPROVED",
                "feedback": "Great benchmarks, clean coroutine handling!"
            }
        )
        self.assertEqual(review_res.status_code, 200)
        self.assertEqual(review_res.json()["data"]["status"], "APPROVED")
        self.assertEqual(review_res.json()["data"]["feedback"], "Great benchmarks, clean coroutine handling!")

    def test_09_rbac_forbidden_action(self):
        # Employee should NOT have permission to review submissions
        emp_login = self.client.post("/api/v1/auth/login", json={
            "email": "employee@test.com",
            "password": "EmpPass123"
        })
        emp_token = emp_login.json()["data"]["access_token"]

        res = self.client.post(
            "/api/v1/reviews/1/review",
            headers={"Authorization": f"Bearer {emp_token}"},
            json={
                "status": "APPROVED",
                "feedback": "Trying unauthorized review"
            }
        )
        self.assertEqual(res.status_code, 403)
        self.assertFalse(res.json()["success"])

if __name__ == "__main__":
    unittest.main()
