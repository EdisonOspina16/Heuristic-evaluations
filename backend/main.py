import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Carga el .env de esta carpeta, sin depender del directorio desde el que se ejecute.
load_dotenv(Path(__file__).with_name(".env"))

from analytics.src.interfaces.api.analytics import router as analytics_router
from src.infrastructure.database import init_db
from src.interfaces.routes import router as main_router

app = FastAPI(title="Heuristic Evaluations")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)
app.include_router(analytics_router)

@app.on_event("startup")
def startup():
    init_db()

if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", os.getenv("PORT", 8001)))
    print(f"Iniciando backend en el puerto {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
