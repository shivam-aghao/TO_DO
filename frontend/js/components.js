// Study OS - Shared Components & Quick Actions Manager
import { api } from './api.js';

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Modal HTML Templates
const MODAL_TEMPLATES = {
    task: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">＋ Add New Task</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-task-form">
                <div class="form-group">
                    <label class="form-label">Task Title *</label>
                    <input type="text" id="task-title" class="form-input" placeholder="e.g. Mathematics: Differential Equations Problem Set" required />
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea id="task-desc" class="form-textarea" placeholder="Key focus areas, chapter sections, problem numbers..."></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select id="task-priority" class="form-select">
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Difficulty</label>
                        <select id="task-difficulty" class="form-select">
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                            <option value="easy">Easy</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Estimated Mins</label>
                        <input type="number" id="task-duration" class="form-input" value="60" min="10" step="5" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Scheduled Time</label>
                        <input type="time" id="task-time" class="form-input" value="09:00" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Task</button>
                </div>
            </form>
        </div>
    `,
    study: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">◷ Log Study Session</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-study-form">
                <div class="form-group">
                    <label class="form-label">Subject / Course *</label>
                    <input type="text" id="study-subject" class="form-input" placeholder="e.g. Physics - Electromagnetism" required />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Planned Mins</label>
                        <input type="number" id="study-planned" class="form-input" value="60" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Actual Mins</label>
                        <input type="number" id="study-actual" class="form-input" value="60" required />
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Focus (1-5)</label>
                        <select id="study-focus" class="form-select">
                            <option value="5">5 - Deep Flow</option>
                            <option value="4" selected>4 - Solid Focus</option>
                            <option value="3">3 - Moderate</option>
                            <option value="2">2 - Distracted</option>
                            <option value="1">1 - Fatigued</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Conf. Before</label>
                        <select id="study-conf-before" class="form-select">
                            <option value="1">1 / 5</option>
                            <option value="2" selected>2 / 5</option>
                            <option value="3">3 / 5</option>
                            <option value="4">4 / 5</option>
                            <option value="5">5 / 5</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Conf. After</label>
                        <select id="study-conf-after" class="form-select">
                            <option value="1">1 / 5</option>
                            <option value="2">2 / 5</option>
                            <option value="3">3 / 5</option>
                            <option value="4" selected>4 / 5</option>
                            <option value="5">5 / 5</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Session Notes</label>
                    <textarea id="study-notes" class="form-textarea" placeholder="Derivations completed, active recall results, formulas revised..."></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Session</button>
                </div>
            </form>
        </div>
    `,
    habit: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">♡ Create New Habit</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-habit-form">
                <div class="form-group">
                    <label class="form-label">Habit Name *</label>
                    <input type="text" id="habit-name" class="form-input" placeholder="e.g. 50 Practice Questions / Day" required />
                </div>
                <div class="form-group">
                    <label class="form-label">Description / Rule</label>
                    <input type="text" id="habit-desc" class="form-input" placeholder="No phone until completed..." />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Target Days / Week</label>
                        <input type="number" id="habit-target" class="form-input" value="7" min="1" max="7" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Icon</label>
                        <select id="habit-icon" class="form-select">
                            <option value="⚡">⚡ Lightning</option>
                            <option value="📚">📚 Book</option>
                            <option value="🧠">🧠 Brain</option>
                            <option value="🌙">🌙 Moon</option>
                            <option value="💧">💧 Water</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Habit</button>
                </div>
            </form>
        </div>
    `,
    workout: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">⚡ Log Workout</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-workout-form">
                <div class="form-group">
                    <label class="form-label">Workout Split / Title *</label>
                    <input type="text" id="workout-title" class="form-input" placeholder="e.g. Chest + Triceps Hypertrophy" required />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Split Category</label>
                        <select id="workout-split" class="form-select">
                            <option value="Push">Push</option>
                            <option value="Pull">Pull</option>
                            <option value="Legs">Legs</option>
                            <option value="Full Body">Full Body</option>
                            <option value="Cardio / Core">Cardio / Core</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Duration (Mins)</label>
                        <input type="number" id="workout-duration" class="form-input" value="65" />
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes & PRs</label>
                    <textarea id="workout-notes" class="form-textarea" placeholder="Bench: 80kg x 8, Cable fly: 16kg..."></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Log Workout</button>
                </div>
            </form>
        </div>
    `,
    sleep: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">◒ Record Sleep Log</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-sleep-form">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Bedtime</label>
                        <input type="time" id="sleep-bedtime" class="form-input" value="23:00" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Wake Time</label>
                        <input type="time" id="sleep-waketime" class="form-input" value="06:30" required />
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Duration (Hours)</label>
                        <input type="number" id="sleep-hours" class="form-input" step="0.1" value="7.5" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Quality (1-5)</label>
                        <select id="sleep-quality" class="form-select">
                            <option value="5">5 - Deep & Fully Rested</option>
                            <option value="4" selected>4 - Good Rest</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Restless</option>
                            <option value="1">1 - Poor</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Observations / Notes</label>
                    <input type="text" id="sleep-notes" class="form-input" placeholder="Consistent schedule, no screen before bed..." />
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Sleep Log</button>
                </div>
            </form>
        </div>
    `,
    course: `
        <div class="modal-card">
            <div class="modal-header">
                <div class="modal-title">📚 Add New Course / Syllabus</div>
                <button class="modal-close" onclick="window.closeQuickModal()">✕</button>
            </div>
            <form id="quick-course-form">
                <div class="form-group">
                    <label class="form-label">Course Title *</label>
                    <input type="text" id="course-name" class="form-input" placeholder="e.g. Organic Chemistry" required />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Course Code</label>
                        <input type="text" id="course-code" class="form-input" placeholder="CHEM-202" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target Study Hours</label>
                        <input type="number" id="course-hours" class="form-input" value="50" />
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="form-group">
                        <label class="form-label">Icon</label>
                        <select id="course-icon" class="form-select">
                            <option value="📚">📚 Book</option>
                            <option value="⚡">⚡ Physics</option>
                            <option value="📐">📐 Math</option>
                            <option value="🧪">🧪 Chemistry</option>
                            <option value="💻">💻 CS / Code</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Accent Color</label>
                        <input type="color" id="course-color" class="form-input" value="#8b5cf6" style="height: 42px; padding: 2px;" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="window.closeQuickModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Course</button>
                </div>
            </form>
        </div>
    `
};

export function openQuickModal(type) {
    let overlay = document.getElementById('quick-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'quick-modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeQuickModal();
            }
        });
    }

    const template = MODAL_TEMPLATES[type];
    if (!template) return;

    overlay.innerHTML = template;
    overlay.classList.add('active');

    // Attach form listeners
    if (type === 'task') {
        document.getElementById('quick-task-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const title = document.getElementById('task-title').value;
                const description = document.getElementById('task-desc').value;
                const priority = document.getElementById('task-priority').value;
                const difficulty = document.getElementById('task-difficulty').value;
                const duration = parseInt(document.getElementById('task-duration').value, 10);
                const time = document.getElementById('task-time').value + ':00';

                await api.post('/api/tasks', {
                    title,
                    description,
                    priority,
                    difficulty,
                    estimated_duration: duration,
                    scheduled_time: time
                });
                showToast('Task added successfully', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } else if (type === 'study') {
        document.getElementById('quick-study-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const subject = document.getElementById('study-subject').value;
                const planned_duration = parseInt(document.getElementById('study-planned').value, 10);
                const actual_duration = parseInt(document.getElementById('study-actual').value, 10);
                const focus_rating = parseInt(document.getElementById('study-focus').value, 10);
                const confidence_before = parseInt(document.getElementById('study-conf-before').value, 10);
                const confidence_after = parseInt(document.getElementById('study-conf-after').value, 10);
                const notes = document.getElementById('study-notes').value;

                await api.post('/api/study/sessions', {
                    subject,
                    planned_duration,
                    actual_duration,
                    focus_rating,
                    confidence_before,
                    confidence_after,
                    notes
                });
                showToast('Study session logged successfully', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } else if (type === 'habit') {
        document.getElementById('quick-habit-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('habit-name').value;
                const description = document.getElementById('habit-desc').value;
                const target_days = parseInt(document.getElementById('habit-target').value, 10);
                const icon = document.getElementById('habit-icon').value;

                await api.post('/api/habits', { name, description, target_days, icon });
                showToast('Habit created', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } else if (type === 'workout') {
        document.getElementById('quick-workout-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const title = document.getElementById('workout-title').value;
                const split_name = document.getElementById('workout-split').value;
                const duration_minutes = parseInt(document.getElementById('workout-duration').value, 10);
                const notes = document.getElementById('workout-notes').value;

                await api.post('/api/gym', { title, split_name, duration_minutes, notes });
                showToast('Workout logged', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } else if (type === 'sleep') {
        document.getElementById('quick-sleep-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const bedtime = document.getElementById('sleep-bedtime').value;
                const wake_time = document.getElementById('sleep-waketime').value;
                const hours = parseFloat(document.getElementById('sleep-hours').value);
                const duration_minutes = Math.round(hours * 60);
                const sleep_quality = parseInt(document.getElementById('sleep-quality').value, 10);
                const notes = document.getElementById('sleep-notes').value;

                await api.post('/api/sleep', {
                    bedtime: `${new Date().toISOString().split('T')[0]}T${bedtime}:00`,
                    wake_time: `${new Date().toISOString().split('T')[0]}T${wake_time}:00`,
                    duration_minutes,
                    sleep_quality,
                    notes
                });
                showToast('Sleep logged', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    } else if (type === 'course') {
        document.getElementById('quick-course-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('course-name').value;
                const code = document.getElementById('course-code').value;
                const target_hours = parseFloat(document.getElementById('course-hours').value);
                const icon = document.getElementById('course-icon').value;
                const color = document.getElementById('course-color').value;

                await api.post('/api/courses', { name, code, target_hours, icon, color });
                showToast('Course added', 'success');
                closeQuickModal();
                if (window.refreshCurrentPage) window.refreshCurrentPage();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }
}

export function closeQuickModal() {
    const overlay = document.getElementById('quick-modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Global window exposure for HTML buttons
window.openQuickModal = openQuickModal;
window.closeQuickModal = closeQuickModal;

// Keyboard escape closes modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeQuickModal();
});

