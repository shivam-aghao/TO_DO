from fastapi import APIRouter, Depends, HTTPException
from typing import List
from backend.routes.auth import get_current_user_id
from backend.schemas.routine import RoutineBlockCreate
from backend.database import queries

router = APIRouter(prefix="/api/routine", tags=["Routine Builder"])

@router.get("")
def get_routine(user_id: str = Depends(get_current_user_id)):
    return queries.get_routine_blocks(user_id)

@router.post("")
def save_block(block_data: RoutineBlockCreate, user_id: str = Depends(get_current_user_id)):
    data = block_data.model_dump()
    return queries.save_routine_block(user_id, data)

@router.delete("/{block_id}")
def delete_block(block_id: str, user_id: str = Depends(get_current_user_id)):
    success = queries.delete_routine_block(block_id)
    if not success:
        raise HTTPException(status_code=404, detail="Block not found")
    return {"message": "Routine block deleted", "id": block_id}

