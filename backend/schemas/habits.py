from pydantic import BaseModel
from typing import Optional

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    target_days: Optional[int] = 7
    icon: Optional[str] = "⚡"
    color: Optional[str] = "#8b5cf6"

class HabitToggle(BaseModel):
    habit_id: str
    log_date: Optional[str] = None

