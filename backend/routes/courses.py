from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from backend.routes.auth import get_current_user_id
from backend.schemas.courses import CourseCreate, TopicUpdate
from backend.database import queries

router = APIRouter(prefix="/api/courses", tags=["Courses"])

@router.get("")
def list_courses(user_id: str = Depends(get_current_user_id)):
    return queries.get_courses(user_id)

@router.post("")
def add_course(course_data: CourseCreate, user_id: str = Depends(get_current_user_id)):
    data = course_data.model_dump()
    return queries.create_course(user_id, data)

@router.put("/topics/{topic_id}")
def update_topic(topic_id: str, topic_data: TopicUpdate, user_id: str = Depends(get_current_user_id)):
    updated = queries.update_topic_status(topic_id, topic_data.status, topic_data.confidence_level)
    if not updated:
        raise HTTPException(status_code=404, detail="Topic not found")
    return updated

