# STUDY OS — Personal Productivity Operating System

A full-stack **Study OS & Personal Productivity Dashboard** designed with a **very dark premium aesthetic** (`#050505` command center) for students.

---

## ⚡ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript Modules (Zero frontend frameworks, pure native performance).
- **Backend**: Python 3.14 + FastAPI + Pydantic v2 + Uvicorn.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and relational schema.
- **Visuals**: Very Dark Premium Theme (`#050505`, `#0a0a0a`, `#101010`, `#8b5cf6` electric purple accent).

---

## 📁 Project Architecture

```text
d:/TO_DO/
├── frontend/
│   ├── index.html              # Authentication & Command Center Portal
│   ├── dashboard.html          # Main Command Center Dashboard
│   ├── tasks.html              # Advanced Todo & Drag-and-Drop Manager
│   ├── courses.html            # Course & Syllabus Hierarchy Tracker
│   ├── study.html              # Study Tracker & Interactive Focus Stopwatch
│   ├── routine.html            # Daily Routine Builder & AI Scheduler
│   ├── habits.html             # Habit Tracker & 60-Day Consistency Heatmap
│   ├── sleep.html              # Sleep Tracker & Circadian Rhythm Analysis
│   ├── gym.html                # Gym & Workout Split Tracker
│   ├── analytics.html          # Progress Analytics & 30-Day Study Telemetry
│   ├── goals.html              # Exam Preparation & Deadline Countdowns
│   ├── settings.html           # Profile & Supabase Cloud Configuration
│   ├── css/
│   │   ├── main.css            # Dark variables, typography, sidebar, layout
│   │   ├── dashboard.css       # KPI row, AI widget, timeline styling
│   │   ├── components.css      # Cards, modals, progress bars, badges, toasts
│   │   └── responsive.css      # Tablet and mobile bottom navigation
│   └── js/
│       ├── api.js              # Universal fetch client with JWT management
│       ├── auth.js             # Supabase & demo session persistence
│       ├── dashboard.js        # KPI calculations, timeline, insights, AI chat
│       ├── tasks.js            # Task ordering, subtasks, priority filters
│       ├── courses.js          # Topic mastery (Learning -> Mastered)
│       ├── study.js            # Focus timer, confidence gain tracking
│       ├── routine.js          # Time block editing & smart scheduler
│       ├── habits.js           # Daily toggles, streak counter, heatmap
│       ├── sleep.js            # Sleep bar chart & consistency scoring
│       ├── gym.js              # Sets, reps, weight logs, split manager
│       ├── analytics.js        # Chart.js line & bar graphs (planned vs actual)
│       ├── goals.js            # Milestone progress & countdown counters
│       └── components.js       # Quick action modal system (+ Task, + Study, etc.)
│
└── backend/
    ├── main.py                 # FastAPI application & static file mount
    ├── requirements.txt        # Python dependency manifest
    ├── config.py               # Pydantic settings & environment loader
    ├── .env                    # Supabase credentials & server configs
    ├── database/
    │   ├── schema.sql          # Supabase PostgreSQL schema with RLS policies
    │   ├── supabase.py         # Supabase client connector
    │   └── queries.py          # Unified database queries & fallback layer
    ├── schemas/                # Pydantic request/response validation schemas
    ├── routes/                 # REST API endpoints
    └── services/
        ├── analytics.py        # Real-time metrics from actual database logs
        ├── recommendations.py  # Data-driven insights engine
        └── scheduler.py        # Constraint-based conflict-free scheduler
```

---

## 🚀 Quick Start

### 1. Launch Backend Server

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Access the Application

Open your browser to:

```text
http://localhost:8000
```

- Click **⚡ Quick Launch Demo (One-Click)** on the login screen to immediately explore the system pre-loaded with realistic student courses, tasks, sleep, and workouts.

---

## 🗄 Supabase Configuration

To connect your own live Supabase PostgreSQL database:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and run the SQL code from [`backend/database/schema.sql`](file:///d:/TO_DO/backend/database/schema.sql).
3. Copy your project URL and keys into [`backend/.env`](file:///d:/TO_DO/backend/.env):
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. Restart the backend server. Study OS will automatically synchronize with Supabase Cloud.

