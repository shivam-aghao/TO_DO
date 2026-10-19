from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from backend.routes.auth import get_current_user_id
from backend.schemas.study import StudySessionCreate
from backend.database import queries

router = APIRouter(prefix="/api/study", tags=["Study Tracking"])

@router.get("/sessions")
def list_study_sessions(days: int = Query(30), user_id: str = Depends(get_current_user_id)):
    return queries.get_study_sessions(user_id, days=days)

@router.post("/sessions")
def log_session(session_data: StudySessionCreate, user_id: str = Depends(get_current_user_id)):
    data = session_data.model_dump()
    return queries.log_study_session(user_id, data)

