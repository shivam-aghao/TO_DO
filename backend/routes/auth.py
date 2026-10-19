import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import Optional, Dict, Any
from backend.config import settings
from backend.schemas.auth import UserLogin, UserRegister, TokenResponse, ProfileUpdate
from backend.database import queries
from backend.database.supabase import get_supabase_client

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Extracts user_id from Authorization Bearer token.
    If no token or invalid in dev/demo mode, returns default test user ID.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return queries._DEFAULT_USER_ID
    
    token = authorization.split(" ")[1]
    try:
        # Check Supabase JWT if supabase client configured
        client = get_supabase_client()
        if client:
            try:
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    return str(user_res.user.id)
            except Exception:
                pass
        
        # Local JWT decode
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub", queries._DEFAULT_USER_ID)
    except Exception:
        return queries._DEFAULT_USER_ID

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister):
    client = get_supabase_client()
    if client:
        try:
            res = client.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
                "options": {"data": {"full_name": user_data.full_name}}
            })
            if res.user:
                token = res.session.access_token if res.session else create_access_token(str(res.user.id), user_data.email)
                queries.update_profile(str(res.user.id), {
                    "email": user_data.email,
                    "full_name": user_data.full_name
                })
                return {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {"id": str(res.user.id), "email": user_data.email, "full_name": user_data.full_name}
                }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # Local fallback
    uid = queries._DEFAULT_USER_ID
    token = create_access_token(uid, user_data.email)
    queries.update_profile(uid, {"email": user_data.email, "full_name": user_data.full_name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": uid, "email": user_data.email, "full_name": user_data.full_name}
    }

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin):
    client = get_supabase_client()
    if client:
        try:
            res = client.auth.sign_in_with_password({
                "email": creds.email,
                "password": creds.password
            })
            if res.user and res.session:
                prof = queries.get_profile(str(res.user.id))
                return {
                    "access_token": res.session.access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": str(res.user.id),
                        "email": creds.email,
                        "full_name": prof.get("full_name", "Student")
                    }
                }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid credentials or Supabase Auth error: {str(e)}")

    # Local fallback demo account
    token = create_access_token(queries._DEFAULT_USER_ID, creds.email)
    prof = queries.get_profile(queries._DEFAULT_USER_ID)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": queries._DEFAULT_USER_ID,
            "email": creds.email,
            "full_name": prof.get("full_name", "Shiva")
        }
    }

@router.get("/profile")
def get_user_profile(user_id: str = Depends(get_current_user_id)):
    return queries.get_profile(user_id)

@router.put("/profile")
def update_user_profile(data: ProfileUpdate, user_id: str = Depends(get_current_user_id)):
    fields = data.model_dump(exclude_unset=True)
    return queries.update_profile(user_id, fields)

