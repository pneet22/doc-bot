from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import audit, auth, chat, documents, health
from app.core.config import get_settings
from app.db.init_db import init_db


settings = get_settings()

app = FastAPI(
    title="TrustVault AI API",
    description="Secure RAG-based document chatbot API with citations and audit logs.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(audit.router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()

