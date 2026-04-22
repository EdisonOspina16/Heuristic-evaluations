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
    Valida que el correo no esté registrado previamente.
    """
    repo = UsuarioRepository(db)
    existing_user = repo.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_data.rol not in ['admin', 'evaluador']:
        user_data.rol = 'evaluador'
        
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
    access_token = create_access_token(data={"sub": user.email, "id": user.id, "rol": user.rol})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "id": user.id, 
            "nombre": user.nombre, 
            "email": user.email, 
            "rol": user.rol
        }
    }
