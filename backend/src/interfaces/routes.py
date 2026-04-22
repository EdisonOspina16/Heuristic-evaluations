from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def index():
    return {
        "message": "Welcome to the Clean Architecture API with FastAPI",
        "status": "success"
    }

@router.get("/health")
async def health():
    return {"status": "healthy"}
