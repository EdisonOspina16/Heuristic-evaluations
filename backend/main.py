from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.interfaces.routes import router as main_router
import uvicorn
import os

app = FastAPI(title="Heuristic Evaluations")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(main_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
