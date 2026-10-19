from pydantic import BaseModel
from typing import Optional, List

class WorkoutSet(BaseModel):
    set_number: int
    target_reps: Optional[int] = 10
    actual_reps: Optional[int] = 10
    weight_kg: Optional[float] = 0.0
    is_completed: Optional[bool] = False

class ExerciseItem(BaseModel):
    name: str
    target_muscle: Optional[str] = "General"
    sets: Optional[List[WorkoutSet]] = []

class WorkoutCreate(BaseModel):
    title: str
    split_name: Optional[str] = "Push"
    workout_date: Optional[str] = None
    duration_minutes: Optional[int] = 60
    is_completed: Optional[bool] = False
    notes: Optional[str] = ""
    exercises: Optional[List[ExerciseItem]] = []

