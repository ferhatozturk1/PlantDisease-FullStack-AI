from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES
from app.database import get_db

# Şifre hashleme context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer token scheme (auto_error=False → token yoksa hata vermez, None döner)
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Şifreyi bcrypt ile hashle."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Düz şifreyi hash ile karşılaştır."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """JWT access token oluştur."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user_or_guest(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Token varsa → User döndür.
    Token yoksa veya geçersizse → None döndür (misafir).
    """
    # Import burada yapılır — circular import önlemek için
    from app.models import User

    if credentials is None:
        return None  # Misafir

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None  # Geçersiz token → misafir gibi davran

    user = db.query(User).filter(User.id == int(user_id)).first()
    return user  # Bulunamazsa None döner → misafir


def get_current_user_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Token zorunlu endpoint'ler için. Token yoksa 401 fırlatır.
    """
    user = get_current_user_or_guest(credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu endpoint için giriş yapmanız gerekiyor.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
