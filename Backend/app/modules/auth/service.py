from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AuthenticationException
from app.modules.auth.repository import AuthRepository
from app.modules.users.models import User
from app.modules.audit.service import AuditService
from app.shared.enums import AuditAction

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = AuthRepository(db)
        self.audit_service = AuditService(db)

    def login(self, email: str, password: str, ip_address: str = None) -> Dict[str, Any]:
        user = self.db.query(User).filter(User.email == email.lower().strip()).first()
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationException("Invalid email or password")
        
        if not user.is_active:
            raise AuthenticationException("User account is inactive. Please contact your administrator.")

        # Create tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires
        )

        expires_at = datetime.now(timezone.utc) + refresh_token_expires
        self.repository.save_refresh_token(user.id, refresh_token, expires_at)

        # Audit
        self.audit_service.log_event(
            action=AuditAction.LOGIN,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            details="User logged in successfully"
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    def register(self, email: str, password: str, full_name: str, designation: str = None, department: str = None, employee_id: str = None, auth_user_id: str = None, ip_address: str = None) -> Dict[str, Any]:
        existing = self.db.query(User).filter(User.email == email.lower().strip()).first()
        if existing:
            from app.core.exceptions import ConflictException
            raise ConflictException(f"Account with email '{email}' already exists. Please sign in.")

        from app.core.security import get_password_hash
        from app.modules.users.models import Role

        default_role = self.db.query(Role).filter(Role.name == "EMPLOYEE").first()

        new_user = User(
            email=email.lower().strip(),
            hashed_password=get_password_hash(password),
            full_name=full_name,
            designation=designation or "Software Engineer",
            department=department or "Engineering",
            employee_id=employee_id,
            auth_user_id=auth_user_id,
            joining_date=datetime.now(timezone.utc),
            is_active=True,
            roles=[default_role] if default_role else []
        )
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)

        # Create session tokens directly
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(new_user.id), "email": new_user.email},
            expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": str(new_user.id)},
            expires_delta=refresh_token_expires
        )

        expires_at = datetime.now(timezone.utc) + refresh_token_expires
        self.repository.save_refresh_token(new_user.id, refresh_token, expires_at)

        self.audit_service.log_event(
            action=AuditAction.USER_CREATED,
            user_id=new_user.id,
            user_email=new_user.email,
            ip_address=ip_address,
            details=f"Self-registered user {new_user.email}"
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    def refresh(self, refresh_token_str: str) -> Dict[str, Any]:
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise AuthenticationException("Invalid token type")
            user_id = int(payload.get("sub"))
        except Exception:
            raise AuthenticationException("Invalid or expired refresh token")

        token_record = self.repository.get_refresh_token(refresh_token_str)
        if not token_record:
            raise AuthenticationException("Refresh token is revoked or does not exist")

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise AuthenticationException("User not found or inactive")

        # Rotate refresh token
        self.repository.revoke_refresh_token(refresh_token_str)
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email},
            expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = create_refresh_token(
            data={"sub": str(user.id)},
            expires_delta=refresh_token_expires
        )
        expires_at = datetime.now(timezone.utc) + refresh_token_expires
        self.repository.save_refresh_token(user.id, new_refresh_token, expires_at)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    def logout(self, refresh_token_str: str, user: User, ip_address: str = None) -> bool:
        if refresh_token_str:
            self.repository.revoke_refresh_token(refresh_token_str)
        
        self.audit_service.log_event(
            action=AuditAction.LOGOUT,
            user_id=user.id,
            user_email=user.email,
            ip_address=ip_address,
            details="User logged out"
        )
        return True

    def get_user_profile(self, user: User) -> Dict[str, Any]:
        # Collect permissions
        perms = set()
        user_roles_list = []
        for role in user.roles:
            role_dict = {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": [{"id": p.id, "code": p.code, "name": p.name, "description": p.description} for p in role.permissions]
            }
            user_roles_list.append(role_dict)
            for p in role.permissions:
                perms.add(p.code)
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "designation": user.designation,
            "department": user.department,
            "joining_date": user.joining_date,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "roles": user_roles_list,
            "permissions": sorted(list(perms))
        }
