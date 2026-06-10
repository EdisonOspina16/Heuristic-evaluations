import os
from typing import Any

from src.domain.repositories import UserRepository
from datetime import datetime, timedelta
from passlib.context import CryptContext

import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

class AuthenticationError(Exception):
    pass


class InactiveUserError(Exception):
    pass


class AuthenticationService:
    def __init__(self, user_repository: UserRepository, secret_key: str, algorithm: str):
        self.user_repository = user_repository
        self.secret_key = secret_key
        self.algorithm = algorithm

    def authenticate_token(self, token: str) -> Any:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            if email is None:
                raise AuthenticationError("Could not validate credentials")
        except jwt.PyJWTError:
            raise AuthenticationError("Could not validate credentials")

        user = self.user_repository.get_by_email(email)
        if user is None:
            raise AuthenticationError("Could not validate credentials")

        if not getattr(user, "active", True):
            raise InactiveUserError("Inactive user")

        return user


class PermissionService:
    def has_permission(self, user: Any, required_permission: str) -> bool:
        # Admin shortcut
        for role in getattr(user, "roles", []):
            if getattr(role, "name", None) == "ADMIN":
                return True

        user_permissions = set()
        for role in getattr(user, "roles", []):
            for perm in getattr(role, "permissions", []):
                user_permissions.add(getattr(perm, "code", None))

        for perm in getattr(user, "direct_permissions", []):
            user_permissions.add(getattr(perm, "code", None))

        return required_permission in user_permissions


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con su hash bcrypt.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Genera un hash bcrypt a partir de una contraseña en texto plano.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Crea un token JWT de acceso.
    
    Args:
        data (dict): Payload a encriptar en el token (ej. email, id, rol).
        expires_delta (timedelta, optional): Tiempo de expiración personalizado.
        
    Returns:
        str: El token JWT generado.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
