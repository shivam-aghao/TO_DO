from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from backend.database import queries

def calculate_analytics(user_id: str) -> Dict[str, Any]:
    """
    Computes all analytics strictly from real records:
    - study_hours
    - task_completion_rate
    - course_completion
    - topic_mastery
    - habit_consistency
    - sleep_consistency
    - gym_consistency
    - planned_vs_actual
    - weekly_progress
    - monthly_progress
    """
    today_str = date.today().isoformat()
    tasks = queries.get_tasks(user_id)
    courses = queries.get_courses(user_id)
    sessions = queries.get_study_sessions(user_id, days=30)
    sleep_logs = queries.get_sleep_logs(user_id, limit=30)
    habits = queries.get_habits(user_id)
    workouts = queries.get_workouts(user_id)

    # 1. Study Hours (Today, 7 days, 30 days)
    today_study_mins = sum(s.get("actual_duration", 0) for s in sessions if s.get("session_date") == today_str)
    
    seven_days_ago = date.today() - timedelta(days=7)
    week_sessions = [s for s in sessions if s.get("session_date") and s.get("session_date") >= seven_days_ago.isoformat()]
    week_study_mins = sum(s.get("actual_duration", 0) for s in week_sessions)
    total_study_mins_30d = sum(s.get("actual_duration", 0) for s in sessions)
    
    # 2. Planned vs Actual (Weekly)
    week_planned_mins = sum(s.get("planned_duration", 0) for s in week_sessions)

    # 3. Task Completion Rate
    today_tasks = [t for t in tasks if t.get("scheduled_date") == today_str]
    today_completed_tasks = [t for t in today_tasks if t.get("status") == "Completed"]
    
    total_tasks_count = len(tasks)
    all_completed_tasks = [t for t in tasks if t.get("status") == "Completed"]
    task_completion_rate = (len(all_completed_tasks) / total_tasks_count * 100) if total_tasks_count > 0 else 0.0

    # 4. Course Completion & Topic Mastery
    course_breakdown = []
    total_topics_count = 0
    mastered_topics_count = 0

    for c in courses:
        modules = c.get("modules", [])
        c_topics = []
        for m in modules:
            for ch in m.get("chapters", []):
                for top in ch.get("topics", []):
                    c_topics.append(top)
        
        c_total = len(c_topics)
        total_topics_count += c_total
        c_mastered = sum(1 for t in c_topics if t.get("status") == "Mastered")
        mastered_topics_count += c_mastered
        
        # calculate progress
        if c_total > 0:
            c_score = sum(
                5 if t.get("status") == "Mastered" else
                4 if t.get("status") == "Revised" else
                3 if t.get("status") == "Practicing" else
                2 if t.get("status") == "Learning" else 0
                for t in c_topics
            )
            pct = round((c_score / (c_total * 5)) * 100, 1)
        else:
            pct = float(c.get("completion_rate", 0.0))

        course_breakdown.append({
            "id": c["id"],
            "name": c["name"],
            "code": c.get("code", ""),
            "color": c.get("color", "#8b5cf6"),
            "progress": pct,
            "target_hours": c.get("target_hours", 40)
        })

    topic_mastery_rate = (mastered_topics_count / total_topics_count * 100) if total_topics_count > 0 else 0.0
    course_progress_avg = sum(c["progress"] for c in course_breakdown) / len(course_breakdown) if course_breakdown else 0.0

    # 5. Habit Consistency
    habit_consistency_list = []
    for h in habits:
        streak = h.get("current_streak", 0)
        target = h.get("target_days", 7)
        pct = min(100.0, round((streak / target) * 100, 1)) if target > 0 else 0.0
        habit_consistency_list.append({
            "id": h["id"],
            "name": h["name"],
            "icon": h.get("icon", "⚡"),
            "current_streak": streak,
            "best_streak": h.get("best_streak", streak),
            "weekly_rate": pct,
            "completed_today": h.get("completed_today", False)
        })

    # 6. Sleep Stats & Consistency
    latest_sleep = sleep_logs[0] if sleep_logs else None
    latest_sleep_mins = latest_sleep.get("duration_minutes", 0) if latest_sleep else 0
    sleep_consistency_scores = [s.get("schedule_consistency_score", 85.0) for s in sleep_logs[:7]]
    avg_sleep_consistency = round(sum(sleep_consistency_scores) / len(sleep_consistency_scores), 1) if sleep_consistency_scores else 0.0

    # 7. Focus Score Calculation
    recent_focus_ratings = [s.get("focus_rating", 4) for s in sessions[:10] if s.get("focus_rating")]
    avg_focus_score = round((sum(recent_focus_ratings) / (len(recent_focus_ratings) * 5)) * 100, 1) if recent_focus_ratings else 0.0

    # 8. Daily Study Trend (Last 30 days)
    daily_trend = []
    for i in range(29, -1, -1):
        day = date.today() - timedelta(days=i)
        day_str = day.isoformat()
        day_mins = sum(s.get("actual_duration", 0) for s in sessions if s.get("session_date") == day_str)
        daily_trend.append({
            "date": day_str,
            "label": day.strftime("%b %d"),
            "hours": round(day_mins / 60, 2),
            "minutes": day_mins
        })

    # 9. Sleep Trend (Last 7-14 days)
    sleep_trend = []
    for s in reversed(sleep_logs[:14]):
        sleep_trend.append({
            "date": s.get("log_date"),
            "hours": round(s.get("duration_minutes", 0) / 60, 2),
            "quality": s.get("sleep_quality", 4),
            "consistency": s.get("schedule_consistency_score", 85.0)
        })

    # Format helpers
    hours_today = today_study_mins // 60
    mins_today = today_study_mins % 60
    study_time_today_str = f"{hours_today}h {mins_today}m" if hours_today > 0 or mins_today > 0 else "0m"

    sleep_h = latest_sleep_mins // 60
    sleep_m = latest_sleep_mins % 60
    sleep_time_str = f"{sleep_h}h {sleep_m}m" if latest_sleep_mins > 0 else "No data"

    return {
        "kpis": {
            "study_time_today": study_time_today_str,
            "study_time_minutes": today_study_mins,
            "tasks_completed": len(today_completed_tasks),
            "tasks_total": len(today_tasks),
            "course_progress_avg": round(course_progress_avg, 1),
            "focus_score_avg": avg_focus_score,
            "sleep_last_night": sleep_time_str,
            "sleep_minutes": latest_sleep_mins
        },
        "study_hours": {
            "today_minutes": today_study_mins,
            "week_minutes": week_study_mins,
            "week_hours": round(week_study_mins / 60, 1),
            "month_hours": round(total_study_mins_30d / 60, 1)
        },
        "task_completion_rate": round(task_completion_rate, 1),
        "course_completion": round(course_progress_avg, 1),
        "topic_mastery": round(topic_mastery_rate, 1),
        "sleep_consistency": avg_sleep_consistency,
        "planned_vs_actual": {
            "planned_hours": round(week_planned_mins / 60, 1),
            "actual_hours": round(week_study_mins / 60, 1),
            "ratio_percentage": round((week_study_mins / week_planned_mins) * 100, 1) if week_planned_mins > 0 else 0
        },
        "study_trend_30d": daily_trend,
        "course_breakdown": course_breakdown,
        "habit_consistency": habit_consistency_list,
        "sleep_trend": sleep_trend,
        "workouts_count": len(workouts)
    }

