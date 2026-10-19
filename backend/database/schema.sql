-- Study OS / Personal Productivity Dashboard Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT DEFAULT 'Student',
    avatar_url TEXT,
    study_goal_hours NUMERIC DEFAULT 6.0,
    wake_time TIME DEFAULT '06:30:00',
    sleep_time TIME DEFAULT '23:00:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT DEFAULT '#8b5cf6',
    icon TEXT DEFAULT '📚',
    target_hours NUMERIC DEFAULT 50.0,
    completion_rate NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSE MODULES
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAPTERS
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'Learning', 'Practicing', 'Revised', 'Mastered')),
    confidence_level INT DEFAULT 1 CHECK (confidence_level BETWEEN 1 AND 5),
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_duration INT DEFAULT 45, -- in minutes
    deadline TIMESTAMPTZ,
    scheduled_date DATE DEFAULT CURRENT_DATE,
    scheduled_time TIME,
    recurrence TEXT DEFAULT 'none',
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'Skipped', 'Rescheduled')),
    tags TEXT[] DEFAULT '{}',
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBTASKS
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0
);

-- 8. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
    planned_duration INT NOT NULL, -- minutes
    actual_duration INT NOT NULL, -- minutes
    focus_rating INT DEFAULT 4 CHECK (focus_rating BETWEEN 1 AND 5),
    confidence_before INT DEFAULT 2 CHECK (confidence_before BETWEEN 1 AND 5),
    confidence_after INT DEFAULT 4 CHECK (confidence_after BETWEEN 1 AND 5),
    notes TEXT,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ROUTINES
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    weekday_mask INT[] DEFAULT '{1,2,3,4,5,6,7}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROUTINE BLOCKS
CREATE TABLE IF NOT EXISTS public.routine_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('Sleep', 'Study', 'Food', 'Break', 'Gym', 'Travel', 'Work', 'Revision', 'Personal', 'Wind Down')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INT DEFAULT 0, -- 0 for all days, or 1-7 (Mon-Sun)
    color TEXT DEFAULT '#8b5cf6',
    order_index INT DEFAULT 0
);

-- 11. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    target_days INT DEFAULT 7,
    icon TEXT DEFAULT '⚡',
    color TEXT DEFAULT '#8b5cf6',
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. HABIT LOGS
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_habit_date UNIQUE (habit_id, log_date)
);

-- 13. SLEEP LOGS
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bedtime TIMESTAMPTZ NOT NULL,
    wake_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    target_duration_minutes INT DEFAULT 480, -- 8 hours
    sleep_quality INT DEFAULT 4 CHECK (sleep_quality BETWEEN 1 AND 5),
    schedule_consistency_score NUMERIC DEFAULT 85.0,
    notes TEXT,
    log_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_sleep_date UNIQUE (user_id, log_date)
);

-- 14. WORKOUTS
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    split_name TEXT DEFAULT 'Full Body',
    workout_date DATE DEFAULT CURRENT_DATE,
    duration_minutes INT DEFAULT 60,
    is_completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EXERCISES
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_muscle TEXT,
    order_index INT DEFAULT 0
);

-- 16. WORKOUT SETS
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    target_reps INT DEFAULT 10,
    actual_reps INT DEFAULT 10,
    weight_kg NUMERIC DEFAULT 0.0,
    is_completed BOOLEAN DEFAULT FALSE
);

-- 17. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Exam',
    target_date DATE NOT NULL,
    overall_progress NUMERIC DEFAULT 0.0,
    syllabus_progress NUMERIC DEFAULT 0.0,
    revision_progress NUMERIC DEFAULT 0.0,
    mock_test_progress NUMERIC DEFAULT 0.0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    target_score NUMERIC DEFAULT 90.0,
    weightage NUMERIC DEFAULT 100.0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. DAILY REVIEWS
CREATE TABLE IF NOT EXISTS public.daily_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    productivity_score INT DEFAULT 4 CHECK (productivity_score BETWEEN 1 AND 5),
    notes TEXT,
    highlights TEXT[] DEFAULT '{}',
    tomorrow_priorities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_review UNIQUE (user_id, review_date)
);

-- 21. WEEKLY REVIEWS
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    total_study_minutes INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    focus_average NUMERIC DEFAULT 0.0,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_weekly_review UNIQUE (user_id, week_start)
);

-- 22. PROGRESS SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    study_hours NUMERIC DEFAULT 0.0,
    tasks_completed INT DEFAULT 0,
    habits_completed INT DEFAULT 0,
    focus_score NUMERIC DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, snapshot_date)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Standard User RLS Policies
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can manage their own courses" ON public.courses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own course modules" ON public.course_modules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chapters" ON public.chapters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own topics" ON public.topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subtasks" ON public.subtasks FOR ALL USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = subtasks.task_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can manage their own study sessions" ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own routines" ON public.routines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own routine blocks" ON public.routine_blocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep logs" ON public.sleep_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own exercises" ON public.exercises FOR ALL USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = exercises.workout_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can manage their own workout sets" ON public.workout_sets FOR ALL USING (EXISTS (SELECT 1 FROM public.exercises e JOIN public.workouts w ON w.id = e.workout_id WHERE e.id = workout_sets.exercise_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own exams" ON public.exams FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assignments" ON public.assignments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own daily reviews" ON public.daily_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own weekly reviews" ON public.weekly_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress snapshots" ON public.progress_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_routine_blocks_routine ON public.routine_blocks(routine_id);

