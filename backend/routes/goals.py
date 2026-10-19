from fastapi import APIRouter, Depends
from typing import List
from datetime import date, datetime
from backend.routes.auth import get_current_user_id
from backend.schemas.goals import GoalCreate
from backend.database import queries

router = APIRouter(prefix="/api/goals", tags=["Goals & Exam Planner"])

@router.get("")
def list_goals(user_id: str = Depends(get_current_user_id)):
    goals = queries.get_goals(user_id)
    today = date.today()
    enhanced = []
    for g in goals:
        g_copy = dict(g)
        target_str = g.get("target_date")
        if target_str:
            try:
                target_d = datetime.fromisoformat(target_str).date() if "T" in target_str else datetime.strptime(target_str, "%Y-%m-%d").date()
                days_left = (target_d - today).days
                g_copy["days_left"] = max(0, days_left)
                g_copy["is_overdue"] = days_left < 0
            except Exception:
                g_copy["days_left"] = 0
        enhanced.append(g_copy)
    return enhanced

@router.post("")
def add_goal(goal_data: GoalCreate, user_id: str = Depends(get_current_user_id)):
    data = goal_data.model_dump()
    return queries.create_goal(user_id, data)

