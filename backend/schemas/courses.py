from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class TopicUpdate(BaseModel):
    status: str  # Not Started, Learning, Practicing, Revised, Mastered
    confidence_level: Optional[int] = None

class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = ""
    color: Optional[str] = "#8b5cf6"
    icon: Optional[str] = "📚"
    target_hours: Optional[float] = 50.0
    modules: Optional[List[Dict[str, Any]]] = []

