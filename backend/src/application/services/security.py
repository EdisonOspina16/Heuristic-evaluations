from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
import os
from src.infrastructure.database import get_db
from src.infrastructure.models import User, Role, Permission

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    # Auto-repair: If user has no roles and is the first user, assign ADMIN
    if not user.roles:
        total_users = db.query(User).count()
        if total_users == 1:
            admin_role = db.query(Role).filter(Role.name == "ADMIN").first()
            if admin_role:
                user.roles.append(admin_role)
                db.commit()
                db.refresh(user)

    if not user.active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

def check_permissions(required_permission: str):
    def permission_dependency(current_user: User = Depends(get_current_user)):
        # Admin has all permissions
        for role in current_user.roles:
            if role.name == "ADMIN":
                return current_user
        
        # Check in role permissions
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.code)
        
        # Check in direct permissions
        for perm in current_user.direct_permissions:
            user_permissions.add(perm.code)
            
        if required_permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required: {required_permission}"
            )
        return current_user
    return permission_dependency
