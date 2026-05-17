from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import Base, engine
from app.models import User


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    with Session(engine) as db:
        seed_user(
            db,
            settings.default_admin_username,
            settings.default_admin_password,
            "admin",
        )
        seed_user(
            db,
            settings.default_viewer_username,
            settings.default_viewer_password,
            "viewer",
        )
        db.commit()


def seed_user(db: Session, username: str, password: str, role: str) -> None:
    if not username or not password:
        return
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        return
    db.add(User(username=username, password_hash=hash_password(password), role=role))
