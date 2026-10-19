from pydantic import BaseModel
from typing import Optional

class SleepLogCreate(BaseModel):
    bedtime: str
    wake_time: str
    duration_minutes: int
    target_duration_minutes: Optional[int] = 480
    sleep_quality: Optional[int] = 4
    schedule_consistency_score: Optional[float] = 85.0
    notes: Optional[str] = ""
    log_date: Optional[str] = None

