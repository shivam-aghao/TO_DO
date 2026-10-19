from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class KPIDashboard(BaseModel):
    study_time_today: str
    study_time_minutes: int
    tasks_completed: int
    tasks_total: int
    course_progress_avg: float
    focus_score_avg: float
    sleep_last_night: str
    sleep_minutes: int

class AnalyticsOverview(BaseModel):
    kpis: KPIDashboard
    insights: List[str]
    study_trend_30d: List[Dict[str, Any]]
    course_breakdown: List[Dict[str, Any]]
    habit_consistency: List[Dict[str, Any]]
    planned_vs_actual: Dict[str, Any]
    sleep_trend: List[Dict[str, Any]]

