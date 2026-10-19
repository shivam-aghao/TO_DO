from pydantic import BaseModel
from typing import Optional

class StudySessionCreate(BaseModel):
    subject: str
    course_id: Optional[str] = None
    topic_id: Optional[str] = None
    planned_duration: int
    actual_duration: int
    focus_rating: Optional[int] = 4
    confidence_before: Optional[int] = 3
    confidence_after: Optional[int] = 4
    notes: Optional[str] = ""
    session_date: Optional[str] = None

