from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os

from src.infrastructure.database import get_db
from src.infrastructure.models import User
from src.infrastructure.repositories import SQLAlchemyUserRepository, SQLAlchemyRoleRepository
from src.application.services.auth_service import (
    AuthenticationService,
    PermissionService,
    AuthenticationError,
    InactiveUserError,
)

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """FastAPI dependency that delegates authentication to the application service.

    Keeps the same HTTP responses for backward compatibility while the
    authentication logic lives in `AuthenticationService`.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_repo = SQLAlchemyUserRepository(db)
    auth_service = AuthenticationService(user_repo, SECRET_KEY, ALGORITHM)

    try:
        user = auth_service.authenticate_token(token)
    except AuthenticationError:
        raise credentials_exception
    except InactiveUserError:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


def check_permissions(required_permission: str):
    def permission_dependency(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Keep FastAPI behavior (HTTPException) but delegate checks to application service.
        perm_service = PermissionService()

        if not perm_service.has_permission(current_user, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required: {required_permission}"
            )
        return current_user

    return permission_dependency
