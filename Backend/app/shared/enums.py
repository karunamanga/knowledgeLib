from enum import Enum

class RoleName(str, Enum):
    EMPLOYEE = "EMPLOYEE"
    MENTOR = "MENTOR"
    ADMIN = "ADMIN"

class PermissionCode(str, Enum):
    KNOWLEDGE_READ = "knowledge:read"
    KNOWLEDGE_CREATE = "knowledge:create"
    KNOWLEDGE_UPDATE = "knowledge:update"
    KNOWLEDGE_DELETE = "knowledge:delete"

    LEARNING_READ = "learning:read"
    LEARNING_CREATE = "learning:create"
    LEARNING_UPDATE = "learning:update"
    LEARNING_DELETE = "learning:delete"

    PATH_READ = "path:read"
    PATH_MANAGE = "path:manage"

    SUBMISSION_CREATE = "submission:create"
    SUBMISSION_READ = "submission:read"
    SUBMISSION_REVIEW = "submission:review"

    PROJECT_READ = "project:read"
    PROJECT_MANAGE = "project:manage"

    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_MANAGE = "user:manage"

    CATEGORY_MANAGE = "category:manage"
    AUDIT_READ = "audit:read"

class ResourceType(str, Enum):
    DOCUMENT = "DOCUMENT"
    PDF = "PDF"
    PRESENTATION = "PRESENTATION"
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"
    DIAGRAM = "DIAGRAM"
    ARCHITECTURE = "ARCHITECTURE"
    LINK = "LINK"
    OTHER = "OTHER"

class SubmissionStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RESUBMITTED = "RESUBMITTED"

class LearningStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"

class AuditAction(str, Enum):
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    RESOURCE_CREATED = "RESOURCE_CREATED"
    RESOURCE_UPDATED = "RESOURCE_UPDATED"
    RESOURCE_DELETED = "RESOURCE_DELETED"
    LEARNING_CREATED = "LEARNING_CREATED"
    LEARNING_UPDATED = "LEARNING_UPDATED"
    SUBMISSION_CREATED = "SUBMISSION_CREATED"
    SUBMISSION_REVIEWED = "SUBMISSION_REVIEWED"
    USER_ROLE_CHANGED = "USER_ROLE_CHANGED"
    USER_CREATED = "USER_CREATED"
    PROJECT_CREATED = "PROJECT_CREATED"
