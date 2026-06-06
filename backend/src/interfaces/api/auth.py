from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.infrastructure.database import get_db
from src.domain.schemas import UsuarioCreate, UsuarioLogin, UsuarioResponse
from src.infrastructure.repositories.usuario_repository import UsuarioRepository
from src.application.services.auth_service import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UsuarioResponse)
def register(user_data: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en la plataforma.
    El primer usuario recibe automáticamente el rol ADMIN.
    """
    repo = UsuarioRepository(db)
    existing_user = repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    return repo.create(user_data)

@router.post("/login")
def login(user_data: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Autentica un usuario verificando su correo y contraseña.
    Retorna un token JWT (access_token) si las credenciales son válidas.
    """
    repo = UsuarioRepository(db)
    user = repo.get_by_email(user_data.email)
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get all permissions (role + direct)
    permissions = set()
    for role in user.roles:
        for perm in role.permissions:
            permissions.add(perm.code)
    for perm in user.direct_permissions:
        permissions.add(perm.code)
    
    # Get primary role name
    role_name = user.roles[0].name if user.roles else "EVALUADOR"
    
    # Create token with roles/permissions info
    access_token = create_access_token(data={
        "sub": user.email, 
        "id": user.id, 
        "rol": role_name,
        "permissions": list(permissions)
    })
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": user.id, 
            "nombre": user.nombre, 
            "email": user.email, 
            "rol": role_name,
            "active": user.active,
            "permissions": list(permissions)
        }
    }

@router.post("/logout")
def logout():
    """
    Endpoint para logout. En una implementación JWT básica, 
    el cliente simplemente debe eliminar el token localmente.
    """
    return {"message": "Logged out successfully"}
