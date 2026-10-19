from fastapi import APIRouter, Depends, Query
from typing import List
from backend.routes.auth import get_current_user_id
from backend.schemas.sleep import SleepLogCreate
from backend.database import queries

router = APIRouter(prefix="/api/sleep", tags=["Sleep Tracking"])

@router.get("")
def get_sleep_history(limit: int = Query(14), user_id: str = Depends(get_current_user_id)):
    return queries.get_sleep_logs(user_id, limit=limit)

@router.post("")
def record_sleep(log_data: SleepLogCreate, user_id: str = Depends(get_current_user_id)):
    data = log_data.model_dump()
    return queries.log_sleep(user_id, data)

