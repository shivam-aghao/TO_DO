from pydantic import BaseModel
from typing import Optional

class RoutineBlockCreate(BaseModel):
    id: Optional[str] = None
    routine_id: Optional[str] = "default-routine"
    title: str
    block_type: str  # Sleep, Study, Food, Break, Gym, Travel, Work, Revision, Personal, Wind Down
    start_time: str
    end_time: str
    day_of_week: Optional[int] = 0
    color: Optional[str] = "#8b5cf6"

