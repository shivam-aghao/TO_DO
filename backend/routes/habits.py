from fastapi import APIRouter, Depends
from typing import List
from backend.routes.auth import get_current_user_id
from backend.schemas.habits import HabitCreate, HabitToggle
from backend.database import queries

router = APIRouter(prefix="/api/habits", tags=["Habits"])

@router.get("")
def list_habits(user_id: str = Depends(get_current_user_id)):
    return queries.get_habits(user_id)

@router.post("")
def create_habit_entry(habit_data: HabitCreate, user_id: str = Depends(get_current_user_id)):
    data = habit_data.model_dump()
    return queries.create_habit(user_id, data)

@router.post("/toggle")
def toggle_habit_status(toggle_data: HabitToggle, user_id: str = Depends(get_current_user_id)):
    return queries.toggle_habit(user_id, toggle_data.habit_id, toggle_data.log_date)

