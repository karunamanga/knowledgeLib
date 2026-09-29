from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class AppException(Exception):
    def __init__(self, message: str, error_code: str = "APP_ERROR", status_code: int = status.HTTP_400_BAD_REQUEST, details: any = None):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details
        super().__init__(message)

class EntityNotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", error_code: str = "NOT_FOUND"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_404_NOT_FOUND)

class AuthenticationException(AppException):
    def __init__(self, message: str = "Authentication failed", error_code: str = "UNAUTHORIZED"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_401_UNAUTHORIZED)

class PermissionDeniedException(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action", error_code: str = "FORBIDDEN"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_403_FORBIDDEN)

class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", error_code: str = "CONFLICT"):
        super().__init__(message=message, error_code=error_code, status_code=status.HTTP_409_CONFLICT)

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "error_code": exc.error_code,
                "details": exc.details
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": str(exc.detail),
                "error_code": f"HTTP_{exc.status_code}",
                "details": None
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Validation error in request payload",
                "error_code": "VALIDATION_ERROR",
                "details": exc.errors()
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "An unexpected server error occurred",
                "error_code": "INTERNAL_SERVER_ERROR",
                "details": str(exc) if app.debug else None
            }
        )
