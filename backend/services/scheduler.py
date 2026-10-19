from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Optional
from backend.database import queries

def _time_to_minutes(t_str: str) -> int:
    """Converts 'HH:MM' or 'HH:MM:SS' string to minutes from midnight."""
    parts = t_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def _minutes_to_time(m: int) -> str:
    """Converts minutes from midnight to 'HH:MM:00' format."""
    h = (m // 60) % 24
    mins = m % 60
    return f"{h:02d}:{mins:02d}:00"

def generate_smart_schedule(user_id: str, target_date_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates a conflict-free study schedule:
    - Analyzes routine blocks, sleep blocks, and gym hours to establish blocked windows.
    - Considers pending tasks sorted by priority (urgent > high > medium > low), deadline, and difficulty.
    - Fits tasks into open intervals without overflowing into sleep or workout blocks.
    - Flags missed/overdue tasks with automated reschedule recommendations.
    """
    target_date = target_date_str or date.today().isoformat()
    routine_blocks = queries.get_routine_blocks(user_id)
    all_tasks = queries.get_tasks(user_id)
    profile = queries.get_profile(user_id)

    # 1. Identify Blocked Windows (Minutes from midnight)
    blocked_windows: List[tuple] = [] # (start_min, end_min, reason)
    
    # Sleep block from profile or routine
    wake_time_str = profile.get("wake_time", "06:30:00")
    sleep_time_str = profile.get("sleep_time", "23:00:00")
    wake_m = _time_to_minutes(str(wake_time_str))
    sleep_m = _time_to_minutes(str(sleep_time_str))

    # Night sleep block (e.g. 23:00 to 24:00 and 00:00 to 06:30)
    if sleep_m > wake_m:
        blocked_windows.append((sleep_m, 1440, "Sleep"))
        blocked_windows.append((0, wake_m, "Sleep"))
    else:
        blocked_windows.append((sleep_m, wake_m, "Sleep"))

    # Routine blocks (Gym, Meals, Personal, Travel)
    for b in routine_blocks:
        b_type = b.get("block_type", "")
        if b_type in ("Sleep", "Gym", "Food", "Travel", "Personal", "Wind Down", "Break"):
            s_m = _time_to_minutes(b.get("start_time", "00:00"))
            e_m = _time_to_minutes(b.get("end_time", "00:00"))
            if e_m > s_m:
                blocked_windows.append((s_m, e_m, f"{b_type} ({b.get('title')})"))

    # Sort and merge overlapping blocked windows
    blocked_windows.sort(key=lambda x: x[0])
    merged_blocked = []
    for cur in blocked_windows:
        if not merged_blocked:
            merged_blocked.append(cur)
        else:
            prev_s, prev_e, prev_reason = merged_blocked[-1]
            if cur[0] <= prev_e:
                merged_blocked[-1] = (prev_s, max(prev_e, cur[1]), f"{prev_reason} & {cur[2]}")
            else:
                merged_blocked.append(cur)

    # 2. Derive Available Free Intervals (Between wake and sleep)
    free_intervals: List[tuple] = []
    pointer = 0
    for s_m, e_m, _ in merged_blocked:
        if s_m > pointer:
            free_intervals.append((pointer, s_m))
        pointer = max(pointer, e_m)
    if pointer < 1440:
        free_intervals.append((pointer, 1440))

    # 3. Categorize Tasks (Pending vs Missed)
    pending_tasks = [t for t in all_tasks if t.get("status") in ("Not Started", "In Progress", "Rescheduled")]
    missed_tasks = []
    
    # Priority rank mapping
    p_rank = {"urgent": 4, "high": 3, "medium": 2, "low": 1}
    # Difficulty rank mapping
    d_rank = {"hard": 3, "medium": 2, "easy": 1}

    # Sort pending tasks by priority, deadline, difficulty
    def task_sort_key(t):
        p = p_rank.get(t.get("priority", "medium").lower(), 2)
        d = d_rank.get(t.get("difficulty", "medium").lower(), 2)
        deadline_val = t.get("deadline") or "9999-12-31"
        return (-p, -d, deadline_val)

    sorted_tasks = sorted(pending_tasks, key=task_sort_key)

    # Check for overdue/missed tasks from past days
    for t in sorted_tasks:
        s_date = t.get("scheduled_date")
        if s_date and s_date < target_date and t.get("status") != "Completed":
            missed_tasks.append({
                "task_id": t["id"],
                "title": t["title"],
                "original_date": s_date,
                "suggestion": f"Missed on {s_date}. Auto-rescheduled into available free study windows."
            })

    # 4. Fit Tasks into Available Free Intervals
    scheduled_timeline = []
    unplaced_tasks = []

    interval_idx = 0
    if interval_idx < len(free_intervals):
        cur_start, cur_end = free_intervals[interval_idx]
    else:
        cur_start, cur_end = (0, 0)

    for task in sorted_tasks:
        duration = int(task.get("estimated_duration", 45))
        placed = False

        while interval_idx < len(free_intervals):
            cur_start, cur_end = free_intervals[interval_idx]
            available_time = cur_end - cur_start

            if available_time >= duration:
                task_start = cur_start
                task_end = cur_start + duration
                scheduled_timeline.append({
                    "task_id": task["id"],
                    "title": task["title"],
                    "course_name": task.get("course_name") or "General",
                    "chapter_name": task.get("chapter_name"),
                    "start_time": _minutes_to_time(task_start),
                    "end_time": _minutes_to_time(task_end),
                    "duration_minutes": duration,
                    "priority": task.get("priority", "medium"),
                    "difficulty": task.get("difficulty", "medium"),
                    "status": task.get("status", "Not Started")
                })
                # Advance current interval
                cur_start = task_end + 10 # 10 minute micro-break
                if cur_start >= cur_end:
                    interval_idx += 1
                else:
                    free_intervals[interval_idx] = (cur_start, cur_end)
                placed = True
                break
            else:
                interval_idx += 1

        if not placed:
            unplaced_tasks.append({
                "task_id": task["id"],
                "title": task["title"],
                "duration_minutes": duration,
                "reason": "Exceeded available focused hours without compromising sleep or recovery blocks."
            })

    return {
        "scheduled_date": target_date,
        "blocked_periods": [{"start": _minutes_to_time(s), "end": _minutes_to_time(e), "label": label} for s, e, label in merged_blocked],
        "study_schedule": scheduled_timeline,
        "missed_tasks_rescheduled": missed_tasks,
        "overflow_tasks": unplaced_tasks,
        "total_scheduled_minutes": sum(item["duration_minutes"] for item in scheduled_timeline)
    }

