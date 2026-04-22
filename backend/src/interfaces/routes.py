from fastapi import APIRouter
from .api import plantillas, evaluaciones, auth

router = APIRouter()

router.include_router(auth.router)
router.include_router(plantillas.router)
router.include_router(evaluaciones.router)

@router.get("/")
async def index():
    return {
        "message": "Welcome to the Clean Architecture API with FastAPI",
        "status": "success"
    }

@router.get("/health")
async def health():
    return {"status": "healthy"}
