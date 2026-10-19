from pydantic import BaseModel
from typing import Optional, List

class SubtaskItem(BaseModel):
    id: Optional[str] = None
    title: str
    is_completed: bool = False

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    chapter_id: Optional[str] = None
    chapter_name: Optional[str] = None
    priority: Optional[str] = "medium"  # low, medium, high, urgent
    difficulty: Optional[str] = "medium"  # easy, medium, hard
    estimated_duration: Optional[int] = 45
    deadline: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    recurrence: Optional[str] = "none"
    status: Optional[str] = "Not Started"
    tags: Optional[List[str]] = []
    subtasks: Optional[List[SubtaskItem]] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    chapter_id: Optional[str] = None
    chapter_name: Optional[str] = None
    priority: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_duration: Optional[int] = None
    deadline: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    recurrence: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[SubtaskItem]] = None

