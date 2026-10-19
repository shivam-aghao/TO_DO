from fastapi import APIRouter, Depends
from typing import List
from backend.routes.auth import get_current_user_id
from backend.schemas.gym import WorkoutCreate
from backend.database import queries

router = APIRouter(prefix="/api/gym", tags=["Gym Tracker"])

@router.get("")
def list_workouts(user_id: str = Depends(get_current_user_id)):
    return queries.get_workouts(user_id)

@router.post("")
def add_workout(workout_data: WorkoutCreate, user_id: str = Depends(get_current_user_id)):
    data = workout_data.model_dump()
    return queries.create_workout(user_id, data)

