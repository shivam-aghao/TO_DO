from pydantic import BaseModel
from typing import Optional

class GoalCreate(BaseModel):
    title: str
    category: Optional[str] = "Exam"
    target_date: str
    overall_progress: Optional[float] = 0.0
    syllabus_progress: Optional[float] = 0.0
    revision_progress: Optional[float] = 0.0
    mock_test_progress: Optional[float] = 0.0
    status: Optional[str] = "active"

