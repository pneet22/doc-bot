import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from passlib.context import CryptContext

from app.core.config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _b64_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_access_token(payload: dict[str, Any]) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    token_payload = {**payload, "exp": int(expires_at.timestamp())}
    body = _b64_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(settings.secret_key.encode("utf-8"), body.encode("utf-8"), hashlib.sha256).digest()
    return f"{body}.{_b64_encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        body, signature = token.split(".", 1)
        expected_signature = hmac.new(
            settings.secret_key.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(_b64_decode(signature), expected_signature):
            raise ValueError("Invalid signature")
        payload = json.loads(_b64_decode(body))
        if int(payload["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

