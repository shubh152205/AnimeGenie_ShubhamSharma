import os
import datetime
import jwt
from hashlib import pbkdf2_hmac
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional

from database import fetchone, execute
from models import UserRegister, UserLogin, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "salesgenie_secret_jwt_key_2026_super_secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256."""
    salt = b"salesgenie_salt_2026"
    pwd_hash = pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return pwd_hash.hex()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored hash."""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate signed JWT token."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta if expires_delta else datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI Dependency: Decode & validate JWT token from Bearer header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = fetchone("SELECT id, username, email, role FROM users WHERE username = ?", (username,))
    if user is None:
        raise credentials_exception

    return dict(user)


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    """Register a new user and return JWT access token."""
    existing_user = fetchone(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (user_data.username, user_data.email)
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already registered"
        )

    pwd_hash = hash_password(user_data.password)
    execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (user_data.username, user_data.email, pwd_hash, "Sales Rep")
    )

    token = create_access_token(data={"sub": user_data.username, "email": user_data.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user_data.username,
        "email": user_data.email,
        "role": "Sales Rep"
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    """Authenticate user with username & password and return JWT access token."""
    user = fetchone(
        "SELECT id, username, email, password_hash, role FROM users WHERE username = ?",
        (credentials.username,)
    )
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user["username"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "email": user["email"],
        "role": user["role"]
    }


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Protected endpoint: Returns details of the currently authenticated JWT user."""
    return current_user
