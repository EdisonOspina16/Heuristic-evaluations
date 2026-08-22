from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from src.infrastructure.database import get_db
from src.domain.schemas import UsuarioResponse, UsuarioCreate
from src.infrastructure.models import User, Role, Permission
from src.application.services.security import get_current_user, check_permissions
from src.application.services.auth_service import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])


def _require_owned_user(db: Session, user_id: int, current_user: User) -> User:
    """
    Cada admin solo puede gestionar los usuarios que él mismo creó
    (User.creado_por == current_user.id), además de su propia cuenta. No hay
    bypass por rol: un admin no gestiona los usuarios de otro admin (no
    existe aún un "super admin").
    """
    if user_id == current_user.id:
        return current_user
    user = db.query(User).filter(User.id == user_id, User.creado_por == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", response_model=List[UsuarioResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(check_permissions("MANAGE_USERS"))):
    return db.query(User).filter(User.creado_por == current_user.id).all()

@router.patch("/{user_id}/status", response_model=UsuarioResponse)
def update_user_status(user_id: int, active: bool, db: Session = Depends(get_db), current_user: User = Depends(check_permissions("MANAGE_USERS"))):
    user = _require_owned_user(db, user_id, current_user)

    # Restriction: Don't allow deactivating the last admin
    if not active:
        is_admin = any(r.name == "ADMIN" for r in user.roles)
        if is_admin:
            admin_count = db.query(User).join(User.roles).filter(Role.name == "ADMIN", User.active == True).count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot deactivate the last active administrator")

    user.active = active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_permissions("DELETE_USERS"))):
    user = _require_owned_user(db, user_id, current_user)

    is_admin = any(r.name == "ADMIN" for r in user.roles)
    if is_admin:
        admin_count = db.query(User).join(User.roles).filter(Role.name == "ADMIN").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last administrator")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/permissions/list")
def list_all_permissions(db: Session = Depends(get_db), current_user: User = Depends(check_permissions("ASSIGN_GLOBAL_PERMISSIONS"))):
    return db.query(Permission).all()

@router.post("/", response_model=UsuarioResponse)
def create_user(user_data: UsuarioCreate, role_name: str = "EVALUADOR", db: Session = Depends(get_db), current_user: User = Depends(check_permissions("CREATE_USERS"))):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        nombre=user_data.nombre,
        email=user_data.email,
        password_hash=hashed_password,
        active=True,
        creado_por=current_user.id,
    )

    db.add(db_user)
    db.flush()
    
    role = db.query(Role).filter(Role.name == role_name.upper()).first()
    if role:
        db_user.roles.append(role)
    else:
        # Default to EVALUADOR if not found
        role = db.query(Role).filter(Role.name == "EVALUADOR").first()
        if role:
            db_user.roles.append(role)
            
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}/permissions")
def update_user_permissions(user_id: int, permission_codes: List[str], db: Session = Depends(get_db), current_user: User = Depends(check_permissions("ASSIGN_GLOBAL_PERMISSIONS"))):
    user = _require_owned_user(db, user_id, current_user)

    # Get permissions by codes
    permissions = db.query(Permission).filter(Permission.code.in_(permission_codes)).all()
    user.direct_permissions = permissions
    db.commit()
    return {"message": "Permissions updated successfully"}

@router.put("/{user_id}/roles")
def update_user_roles(user_id: int, role_names: List[str], db: Session = Depends(get_db), current_user: User = Depends(check_permissions("ASSIGN_ROLES"))):
    user = _require_owned_user(db, user_id, current_user)

    # Restriction: Don't allow removing ADMIN role from the last admin
    is_currently_admin = any(r.name == "ADMIN" for r in user.roles)
    if is_currently_admin and "ADMIN" not in role_names:
        admin_count = db.query(User).join(User.roles).filter(Role.name == "ADMIN").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove ADMIN role from the last administrator")

    roles = db.query(Role).filter(Role.name.in_(role_names)).all()
    user.roles = roles
    db.commit()
    return {"message": "Roles updated successfully"}
