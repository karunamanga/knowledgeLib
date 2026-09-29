from typing import Optional, List, Callable
from fastapi import Depends, Header
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.modules.users.models import User
from app.shared.enums import RoleName, PermissionCode

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise AuthenticationException("Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthenticationException("Invalid authorization header format. Expected 'Bearer <token>'")
    return parts[1]

def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db)
) -> User:
    # 1. First attempt: standard app internal JWT
    user = None
    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            user_id = int(payload.get("sub"))
            user = db.query(User).filter(User.id == user_id).first()
    except Exception:
        pass

    # 2. Second attempt: Supabase Auth JWT
    if not user:
        try:
            # Decode Supabase JWT (verify with secret if provided, or unverified claims for dev)
            if settings.SUPABASE_JWT_SECRET:
                payload = jwt.decode(
                    token, 
                    settings.SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"], 
                    options={"verify_aud": False}
                )
            else:
                payload = jwt.decode(token, options={"verify_signature": False})
            
            auth_sub = payload.get("sub")
            email = payload.get("email")

            if auth_sub or email:
                # Query by auth_user_id or email
                if auth_sub:
                    user = db.query(User).filter(User.auth_user_id == auth_sub).first()
                if not user and email:
                    user = db.query(User).filter(User.email == email.lower().strip()).first()
                    if user and not user.auth_user_id and auth_sub:
                        user.auth_user_id = auth_sub
                        db.commit()

                # If user does not exist in local DB, auto-provision
                if not user and email:
                    user_metadata = payload.get("user_metadata", {})
                    full_name = user_metadata.get("full_name") or user_metadata.get("name") or email.split("@")[0].capitalize()
                    department = user_metadata.get("department", "Engineering")
                    designation = user_metadata.get("designation", "Team Member")
                    employee_id = user_metadata.get("employee_id")

                    from app.modules.users.models import Role
                    default_role = db.query(Role).filter(Role.name == "EMPLOYEE").first()
                    
                    user = User(
                        email=email.lower().strip(),
                        auth_user_id=auth_sub,
                        employee_id=employee_id,
                        full_name=full_name,
                        designation=designation,
                        department=department,
                        hashed_password="",
                        is_active=True,
                        roles=[default_role] if default_role else []
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
        except Exception:
            pass

    if not user:
        raise AuthenticationException("Could not validate credentials or user not found")
    if not user.is_active:
        raise AuthenticationException("User account is deactivated")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise AuthenticationException("Inactive user")
    return current_user

def require_permission(permission_code: PermissionCode | str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        target_code = permission_code.value if hasattr(permission_code, "value") else str(permission_code)

        # Admin bypass
        user_role_names = {r.name.upper() for r in user.roles} if user.roles else set()
        if "ADMIN" in user_role_names or RoleName.ADMIN.value in user_role_names:
            return user

        # Standard employee baseline permissions
        standard_employee_perms = {
            "knowledge:read",
            "knowledge:create",
            "learning:read",
            "learning:create",
            "learning:update",
            "path:read",
            "submission:create",
            "submission:read",
            "project:read",
            "user:read",
            "user:update",
        }

        # Mentor baseline permissions
        mentor_perms = standard_employee_perms | {
            "knowledge:update",
            "path:manage",
            "submission:review",
            "project:manage",
        }

        if "MENTOR" in user_role_names and target_code in mentor_perms:
            return user

        if ("EMPLOYEE" in user_role_names or len(user_role_names) == 0) and target_code in standard_employee_perms:
            return user

        # Collect user DB permissions
        user_permissions = set()
        if user.roles:
            for role in user.roles:
                if hasattr(role, 'permissions') and role.permissions:
                    for perm in role.permissions:
                        user_permissions.add(perm.code)

        if target_code not in user_permissions:
            raise PermissionDeniedException(f"Missing required permission: {target_code}")
        return user
    return dependency

def require_role(role_name: RoleName | str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        target_role = (role_name.value if hasattr(role_name, "value") else str(role_name)).upper()
        user_role_names = {r.name.upper() for r in user.roles} if user.roles else set()
        if target_role not in user_role_names and "ADMIN" not in user_role_names:
            raise PermissionDeniedException(f"Missing required role: {target_role}")
        return user
    return dependency
