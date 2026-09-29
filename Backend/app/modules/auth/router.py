from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.shared.responses import APIResponse
from app.modules.users.models import User
from app.modules.auth.schemas import LoginRequest, RegisterRequest, TokenResponse, RefreshTokenRequest, UserProfileRead
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=APIResponse[TokenResponse])
def register(register_data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    client_ip = request.client.host if request.client else None
    tokens = service.register(
        email=register_data.email,
        password=register_data.password,
        full_name=register_data.full_name,
        designation=register_data.designation,
        department=register_data.department,
        employee_id=register_data.employee_id,
        auth_user_id=register_data.auth_user_id,
        ip_address=client_ip
    )
    return APIResponse(message="Registration successful", data=tokens)

@router.post("/login", response_model=APIResponse[TokenResponse])
def login(login_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    service = AuthService(db)
    client_ip = request.client.host if request.client else None
    tokens = service.login(email=login_data.email, password=login_data.password, ip_address=client_ip)
    return APIResponse(message="Login successful", data=tokens)

@router.post("/refresh", response_model=APIResponse[TokenResponse])
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    tokens = service.refresh(payload.refresh_token)
    return APIResponse(message="Token refreshed successfully", data=tokens)

@router.post("/logout", response_model=APIResponse[bool])
def logout(payload: RefreshTokenRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    client_ip = request.client.host if request.client else None
    service.logout(refresh_token_str=payload.refresh_token, user=current_user, ip_address=client_ip)
    return APIResponse(message="Logged out successfully", data=True)

@router.get("/me", response_model=APIResponse[UserProfileRead])
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    profile = service.get_user_profile(current_user)
    return APIResponse(message="Profile retrieved", data=profile)
