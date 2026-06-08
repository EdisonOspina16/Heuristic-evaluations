from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.interfaces.routes import router as main_router
from src.infrastructure.database import init_db
import uvicorn
import os

app = FastAPI(title="Heuristic Evaluations")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)

@app.on_event("startup")
def startup():
    init_db()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)