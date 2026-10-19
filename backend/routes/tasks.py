from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from backend.routes.auth import get_current_user_id
from backend.schemas.tasks import TaskCreate, TaskUpdate
from backend.database import queries

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("")
def list_tasks(
    status: Optional[str] = Query(None),
    scheduled_date: Optional[str] = Query(None),
    user_id: str = Depends(get_current_user_id)
):
    return queries.get_tasks(user_id, status=status, scheduled_date=scheduled_date)

@router.post("")
def add_task(task_data: TaskCreate, user_id: str = Depends(get_current_user_id)):
    data = task_data.model_dump()
    return queries.create_task(user_id, data)

@router.put("/{task_id}")
def update_task(task_id: str, task_data: TaskUpdate, user_id: str = Depends(get_current_user_id)):
    data = task_data.model_dump(exclude_unset=True)
    updated = queries.update_task(task_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{task_id}")
def remove_task(task_id: str, user_id: str = Depends(get_current_user_id)):
    success = queries.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully", "id": task_id}

