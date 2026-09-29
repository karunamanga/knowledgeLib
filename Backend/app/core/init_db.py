from app.core.database import Base, engine
# Import all models so Base metadata is populated
from app.modules.users.models import User, Role, Permission, user_roles, role_permissions
from app.modules.auth.models import RefreshToken
from app.modules.categories.models import Category, Tag
from app.modules.knowledge.models import Resource, resource_tags
from app.modules.learning_paths.models import LearningPath, LearningModule, LearningModuleResource, UserPathProgress, UserModuleProgress
from app.modules.learning.models import LearningEntry, learning_entry_resources
from app.modules.submissions.models import Submission, SubmissionHistory
from app.modules.projects.models import Project, project_resources
from app.modules.audit.models import AuditLog

def init_tables():
    Base.metadata.create_all(bind=engine)
