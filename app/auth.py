from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from .config import settings
from .schemas import TokenData

bearer_scheme = HTTPBearer()


class AuthError(HTTPException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: Optional[str] = payload.get("sub")
        role: Optional[str] = payload.get("role")
        if user_id is None or role is None or role not in settings.allowed_roles:
            raise AuthError("Invalid token claims")
        return TokenData(user_id=user_id, role=role)
    except JWTError as exc:
        raise AuthError("Could not validate credentials") from exc


def create_token(user_id: str, role: str, expires_minutes: int = 60) -> str:
    exp = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": user_id, "role": role, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> TokenData:
    return decode_token(credentials.credentials)


def ensure_admin(user: TokenData = Depends(get_current_user)) -> TokenData:
    if user.role != "admin":
        raise AuthError("Admin privileges required")
    return user
