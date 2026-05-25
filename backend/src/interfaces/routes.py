from fastapi import APIRouter
from .api import plantillas, evaluaciones, auth, users, proyectos

router = APIRouter()

router.include_router(auth.router)
router.include_router(users.router)
router.include_router(proyectos.router)
router.include_router(plantillas.router)
router.include_router(evaluaciones.router)