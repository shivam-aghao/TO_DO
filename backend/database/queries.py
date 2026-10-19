import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from backend.database.supabase import get_supabase_client, is_supabase_configured

# Fallback in-memory storage for offline / quickstart mode
_DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

_MEM_STORE = {
    "profiles": {
        _DEFAULT_USER_ID: {
            "id": _DEFAULT_USER_ID,
            "email": "shiva@studyos.local",
            "full_name": "Shiva",
            "avatar_url": None,
            "study_goal_hours": 6.0,
            "wake_time": "06:30:00",
            "sleep_time": "23:00:00",
            "created_at": datetime.now().isoformat()
        }
    },
    "courses": [],
    "tasks": [],
    "study_sessions": [],
    "routine_blocks": [],
    "habits": [],
    "habit_logs": {},
    "sleep_logs": [],
    "workouts": [],
    "goals": []
}

# --- DB Queries & Facades ---

def get_profile(user_id: str) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("profiles").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    return _MEM_STORE["profiles"].get(user_id, _MEM_STORE["profiles"][_DEFAULT_USER_ID])

def update_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("profiles").update(data).eq("id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    prof = get_profile(user_id)
    prof.update(data)
    prof["updated_at"] = datetime.now().isoformat()
    _MEM_STORE["profiles"][user_id] = prof
    return prof

# Courses
def get_courses(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("courses").select("*, course_modules(*, chapters(*, topics(*)))").eq("user_id", user_id).execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return [c for c in _MEM_STORE["courses"] if c.get("user_id") == user_id or user_id == _DEFAULT_USER_ID]

def create_course(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    course_id = str(uuid.uuid4())
    course = {
        "id": course_id,
        "user_id": user_id,
        "name": data.get("name", "New Course"),
        "code": data.get("code", ""),
        "color": data.get("color", "#8b5cf6"),
        "icon": data.get("icon", "📚"),
        "target_hours": float(data.get("target_hours", 40.0)),
        "completion_rate": 0.0,
        "modules": data.get("modules", []),
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    client = get_supabase_client()
    if client:
        try:
            c_data = {k: v for k, v in course.items() if k != "modules"}
            res = client.table("courses").insert(c_data).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    _MEM_STORE["courses"].append(course)
    return course

def update_topic_status(topic_id: str, status: str, confidence: int = None) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            up_data = {"status": status}
            if confidence is not None:
                up_data["confidence_level"] = confidence
            res = client.table("topics").update(up_data).eq("id", topic_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    for course in _MEM_STORE["courses"]:
        for mod in course.get("modules", []):
            for ch in mod.get("chapters", []):
                for top in ch.get("topics", []):
                    if top.get("id") == topic_id:
                        top["status"] = status
                        if confidence is not None:
                            top["confidence_level"] = confidence
                        return top
    return None

# Tasks
def get_tasks(user_id: str, status: Optional[str] = None, scheduled_date: Optional[str] = None) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            q = client.table("tasks").select("*, subtasks(*)").eq("user_id", user_id)
            if status:
                q = q.eq("status", status)
            if scheduled_date:
                q = q.eq("scheduled_date", scheduled_date)
            res = q.order("scheduled_time", desc=False).execute()
            if res.data:
                return res.data
        except Exception:
            pass
    tasks = [t for t in _MEM_STORE["tasks"] if t.get("user_id") == user_id or user_id == _DEFAULT_USER_ID]
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if scheduled_date:
        tasks = [t for t in tasks if t.get("scheduled_date") == scheduled_date]
    return tasks

def create_task(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    task_id = str(uuid.uuid4())
    subtasks = []
    if "subtasks" in data:
        for s in data["subtasks"]:
            subtasks.append({
                "id": str(uuid.uuid4()),
                "title": s.get("title", "") if isinstance(s, dict) else str(s),
                "is_completed": s.get("is_completed", False) if isinstance(s, dict) else False
            })

    # Look up course name if provided
    course_name = None
    if data.get("course_id"):
        for c in _MEM_STORE["courses"]:
            if c["id"] == data["course_id"]:
                course_name = c["name"]
                break

    task = {
        "id": task_id,
        "user_id": user_id,
        "title": data.get("title", "Untitled Task"),
        "description": data.get("description", ""),
        "course_id": data.get("course_id"),
        "course_name": course_name or data.get("course_name"),
        "chapter_id": data.get("chapter_id"),
        "chapter_name": data.get("chapter_name"),
        "priority": data.get("priority", "medium"),
        "difficulty": data.get("difficulty", "medium"),
        "estimated_duration": int(data.get("estimated_duration", 45)),
        "deadline": data.get("deadline"),
        "scheduled_date": data.get("scheduled_date", date.today().isoformat()),
        "scheduled_time": data.get("scheduled_time", "09:00:00"),
        "recurrence": data.get("recurrence", "none"),
        "status": data.get("status", "Not Started"),
        "tags": data.get("tags", []),
        "subtasks": subtasks,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    client = get_supabase_client()
    if client:
        try:
            t_data = {k: v for k, v in task.items() if k not in ("subtasks", "course_name", "chapter_name")}
            res = client.table("tasks").insert(t_data).execute()
            if res.data:
                # Insert subtasks if any
                for sub in subtasks:
                    client.table("subtasks").insert({
                        "id": sub["id"],
                        "task_id": res.data[0]["id"],
                        "title": sub["title"],
                        "is_completed": sub["is_completed"]
                    }).execute()
                return task
        except Exception:
            pass

    _MEM_STORE["tasks"].append(task)
    return task

def update_task(task_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            t_data = {k: v for k, v in data.items() if k not in ("subtasks", "course_name", "chapter_name")}
            t_data["updated_at"] = datetime.now().isoformat()
            res = client.table("tasks").update(t_data).eq("id", task_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    for t in _MEM_STORE["tasks"]:
        if t["id"] == task_id:
            t.update(data)
            t["updated_at"] = datetime.now().isoformat()
            return t
    return None

def delete_task(task_id: str) -> bool:
    client = get_supabase_client()
    if client:
        try:
            client.table("tasks").delete().eq("id", task_id).execute()
            return True
        except Exception:
            pass
    _MEM_STORE["tasks"] = [t for t in _MEM_STORE["tasks"] if t["id"] != task_id]
    return True

# Study Sessions
def get_study_sessions(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            since = (date.today() - timedelta(days=days)).isoformat()
            res = client.table("study_sessions").select("*").eq("user_id", user_id).gte("session_date", since).order("session_date", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return [s for s in _MEM_STORE["study_sessions"] if s.get("user_id") == user_id or user_id == _DEFAULT_USER_ID]

def log_study_session(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    session = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "subject": data.get("subject", "General Study"),
        "course_id": data.get("course_id"),
        "topic_id": data.get("topic_id"),
        "planned_duration": int(data.get("planned_duration", 60)),
        "actual_duration": int(data.get("actual_duration", 60)),
        "focus_rating": int(data.get("focus_rating", 4)),
        "confidence_before": int(data.get("confidence_before", 3)),
        "confidence_after": int(data.get("confidence_after", 4)),
        "notes": data.get("notes", ""),
        "session_date": data.get("session_date", date.today().isoformat()),
        "created_at": datetime.now().isoformat()
    }
    client = get_supabase_client()
    if client:
        try:
            res = client.table("study_sessions").insert(session).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    _MEM_STORE["study_sessions"].insert(0, session)
    return session

# Routines
def get_routine_blocks(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("routine_blocks").select("*").eq("user_id", user_id).order("start_time").execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return sorted(_MEM_STORE["routine_blocks"], key=lambda b: b.get("start_time", ""))

def save_routine_block(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    block_id = data.get("id") or str(uuid.uuid4())
    block = {
        "id": block_id,
        "user_id": user_id,
        "routine_id": data.get("routine_id", "default-routine"),
        "title": data.get("title", "Routine Block"),
        "block_type": data.get("block_type", "Study"),
        "start_time": data.get("start_time", "08:00"),
        "end_time": data.get("end_time", "09:00"),
        "day_of_week": int(data.get("day_of_week", 0)),
        "color": data.get("color", "#8b5cf6")
    }
    client = get_supabase_client()
    if client:
        try:
            res = client.table("routine_blocks").upsert(block).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    # Local update or append
    for i, b in enumerate(_MEM_STORE["routine_blocks"]):
        if b["id"] == block_id:
            _MEM_STORE["routine_blocks"][i] = block
            return block
    _MEM_STORE["routine_blocks"].append(block)
    return block

def delete_routine_block(block_id: str) -> bool:
    client = get_supabase_client()
    if client:
        try:
            client.table("routine_blocks").delete().eq("id", block_id).execute()
            return True
        except Exception:
            pass
    _MEM_STORE["routine_blocks"] = [b for b in _MEM_STORE["routine_blocks"] if b["id"] != block_id]
    return True

# Habits
def get_habits(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    today_str = date.today().isoformat()
    if client:
        try:
            h_res = client.table("habits").select("*").eq("user_id", user_id).execute()
            l_res = client.table("habit_logs").select("*").eq("user_id", user_id).eq("log_date", today_str).execute()
            today_logs = {l["habit_id"]: l["completed"] for l in (l_res.data or [])}
            habits = []
            for h in (h_res.data or []):
                h["completed_today"] = today_logs.get(h["id"], False)
                habits.append(h)
            if habits:
                return habits
        except Exception:
            pass
    habits = []
    for h in _MEM_STORE["habits"]:
        log_key = f"{h['id']}_{today_str}"
        completed = _MEM_STORE["habit_logs"].get(log_key, {}).get("completed", False)
        item = dict(h)
        item["completed_today"] = completed
        habits.append(item)
    return habits

def toggle_habit(user_id: str, habit_id: str, log_date: Optional[str] = None) -> Dict[str, Any]:
    target_date = log_date or date.today().isoformat()
    client = get_supabase_client()
    if client:
        try:
            exist = client.table("habit_logs").select("*").eq("habit_id", habit_id).eq("log_date", target_date).execute()
            new_state = True
            if exist.data:
                new_state = not exist.data[0]["completed"]
                res = client.table("habit_logs").update({"completed": new_state}).eq("id", exist.data[0]["id"]).execute()
            else:
                res = client.table("habit_logs").insert({"user_id": user_id, "habit_id": habit_id, "log_date": target_date, "completed": True}).execute()
            return {"habit_id": habit_id, "completed": new_state, "log_date": target_date}
        except Exception:
            pass

    key = f"{habit_id}_{target_date}"
    prev = _MEM_STORE["habit_logs"].get(key, {}).get("completed", False)
    new_status = not prev
    _MEM_STORE["habit_logs"][key] = {
        "id": f"hl-{habit_id}-{target_date}",
        "user_id": user_id,
        "habit_id": habit_id,
        "log_date": target_date,
        "completed": new_status
    }
    # Update streak
    for h in _MEM_STORE["habits"]:
        if h["id"] == habit_id:
            if new_status:
                h["current_streak"] += 1
                if h["current_streak"] > h["best_streak"]:
                    h["best_streak"] = h["current_streak"]
            else:
                h["current_streak"] = max(0, h["current_streak"] - 1)
    return {"habit_id": habit_id, "completed": new_status, "log_date": target_date}

def create_habit(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    habit = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": data.get("name", "New Habit"),
        "description": data.get("description", ""),
        "target_days": int(data.get("target_days", 7)),
        "icon": data.get("icon", "⚡"),
        "color": data.get("color", "#8b5cf6"),
        "current_streak": 0,
        "best_streak": 0,
        "created_at": datetime.now().isoformat(),
        "completed_today": False
    }
    client = get_supabase_client()
    if client:
        try:
            h_data = {k: v for k, v in habit.items() if k != "completed_today"}
            res = client.table("habits").insert(h_data).execute()
            if res.data:
                return {**res.data[0], "completed_today": False}
        except Exception:
            pass
    _MEM_STORE["habits"].append(habit)
    return habit

# Sleep
def get_sleep_logs(user_id: str, limit: int = 14) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("sleep_logs").select("*").eq("user_id", user_id).order("log_date", desc=True).limit(limit).execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return sorted(_MEM_STORE["sleep_logs"], key=lambda l: l.get("log_date", ""), reverse=True)[:limit]

def log_sleep(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    log_date = data.get("log_date", date.today().isoformat())
    sleep_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "log_date": log_date,
        "bedtime": data.get("bedtime", f"{log_date}T23:00:00"),
        "wake_time": data.get("wake_time", f"{log_date}T06:30:00"),
        "duration_minutes": int(data.get("duration_minutes", 450)),
        "target_duration_minutes": int(data.get("target_duration_minutes", 480)),
        "sleep_quality": int(data.get("sleep_quality", 4)),
        "schedule_consistency_score": float(data.get("schedule_consistency_score", 85.0)),
        "notes": data.get("notes", "")
    }
    client = get_supabase_client()
    if client:
        try:
            res = client.table("sleep_logs").upsert(sleep_entry).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    # In-memory upsert
    for i, s in enumerate(_MEM_STORE["sleep_logs"]):
        if s.get("log_date") == log_date:
            _MEM_STORE["sleep_logs"][i] = sleep_entry
            return sleep_entry
    _MEM_STORE["sleep_logs"].insert(0, sleep_entry)
    return sleep_entry

# Gym / Workouts
def get_workouts(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("workouts").select("*, exercises(*, workout_sets(*))").eq("user_id", user_id).order("workout_date", desc=True).execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return [w for w in _MEM_STORE["workouts"] if w.get("user_id") == user_id or user_id == _DEFAULT_USER_ID]

def create_workout(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    workout_id = str(uuid.uuid4())
    exercises = []
    for ex in data.get("exercises", []):
        ex_id = str(uuid.uuid4())
        sets = []
        for s in ex.get("sets", []):
            sets.append({
                "set_number": s.get("set_number", 1),
                "target_reps": int(s.get("target_reps", 10)),
                "actual_reps": int(s.get("actual_reps", 10)),
                "weight_kg": float(s.get("weight_kg", 0.0)),
                "is_completed": s.get("is_completed", False)
            })
        exercises.append({
            "id": ex_id,
            "name": ex.get("name", "Exercise"),
            "target_muscle": ex.get("target_muscle", "General"),
            "sets": sets
        })
    workout = {
        "id": workout_id,
        "user_id": user_id,
        "title": data.get("title", "Workout"),
        "split_name": data.get("split_name", "Push"),
        "workout_date": data.get("workout_date", date.today().isoformat()),
        "duration_minutes": int(data.get("duration_minutes", 60)),
        "is_completed": data.get("is_completed", False),
        "notes": data.get("notes", ""),
        "exercises": exercises,
        "created_at": datetime.now().isoformat()
    }
    client = get_supabase_client()
    if client:
        try:
            w_data = {k: v for k, v in workout.items() if k != "exercises"}
            res = client.table("workouts").insert(w_data).execute()
            return workout
        except Exception:
            pass
    _MEM_STORE["workouts"].insert(0, workout)
    return workout

# Goals
def get_goals(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase_client()
    if client:
        try:
            res = client.table("goals").select("*").eq("user_id", user_id).order("target_date").execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return [g for g in _MEM_STORE["goals"] if g.get("user_id") == user_id or user_id == _DEFAULT_USER_ID]

def create_goal(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    goal = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": data.get("title", "New Goal"),
        "category": data.get("category", "Exam"),
        "target_date": data.get("target_date", (date.today() + timedelta(days=90)).isoformat()),
        "overall_progress": float(data.get("overall_progress", 0.0)),
        "syllabus_progress": float(data.get("syllabus_progress", 0.0)),
        "revision_progress": float(data.get("revision_progress", 0.0)),
        "mock_test_progress": float(data.get("mock_test_progress", 0.0)),
        "status": data.get("status", "active"),
        "created_at": datetime.now().isoformat()
    }
    client = get_supabase_client()
    if client:
        try:
            res = client.table("goals").insert(goal).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    _MEM_STORE["goals"].append(goal)
    return goal

