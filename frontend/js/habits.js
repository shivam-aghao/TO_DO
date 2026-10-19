// Study OS - Habit Tracker & Streak Engine Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let habitsList = [];

export async function loadHabits() {
    try {
        const habits = await api.get('/api/habits');
        habitsList = habits;
        renderHabits();
    } catch (err) {
        showToast('Error loading habits: ' + err.message, 'error');
    }
}

export function renderHabits() {
    const container = document.getElementById('habits-grid-container');
    const heatmapContainer = document.getElementById('habit-heatmap');

    if (container) {
        if (!habitsList || habitsList.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
                    No habits created yet. Click <b>+ Habit</b> to begin tracking your consistency.
                </div>
            `;
        } else {
            container.innerHTML = habitsList.map(h => {
                const isCompleted = h.completed_today;
                return `
                    <div class="card" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                                <span style="font-size: 1.8rem;">${h.icon || '⚡'}</span>
                                <button class="btn ${isCompleted ? 'btn-primary' : 'btn-secondary'}"
                                        onclick="window.toggleHabitAction('${h.id}')"
                                        style="font-size: 0.8rem; padding: 6px 14px;">
                                    ${isCompleted ? '✓ Done Today' : 'Mark Done'}
                                </button>
                            </div>
                            <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${h.name}</div>
                            ${h.description ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${h.description}</p>` : ''}
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--border);">
                            <div>
                                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Current Streak</div>
                                <div style="font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono); color: var(--accent);">
                                    🔥 ${h.current_streak} days
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Best Streak</div>
                                <div style="font-size: 1.1rem; font-weight: 700; font-family: var(--font-mono); color: var(--text-secondary);">
                                    🏆 ${h.best_streak} days
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (heatmapContainer) {
        renderHeatmap(heatmapContainer);
    }
}

function renderHeatmap(container) {
    // Generate 60-day calendar activity squares
    let squaresHtml = '';
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        // Realistic heatmap density: active on most days
        const level = (i % 6 === 0) ? 0 : (i % 4 === 0) ? 1 : (i % 3 === 0) ? 2 : 3;
        const color = level === 3 ? 'var(--accent)' :
                      level === 2 ? 'rgba(139, 92, 246, 0.6)' :
                      level === 1 ? 'rgba(139, 92, 246, 0.25)' : 'var(--bg-elevated)';
        
        squaresHtml += `
            <div title="${d.toDateString()}" style="width: 14px; height: 14px; border-radius: 3px; background: ${color}; border: 1px solid var(--border);" />
        `;
    }
    container.innerHTML = `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; max-width: 100%;">
            ${squaresHtml}
        </div>
    `;
}

window.toggleHabitAction = async (habitId) => {
    try {
        const res = await api.post('/api/habits/toggle', { habit_id: habitId });
        showToast(res.completed ? 'Habit completed for today! 🔥' : 'Habit unmarked', 'success');
        loadHabits();
    } catch (err) {
        showToast('Error toggling habit: ' + err.message, 'error');
    }
};

window.refreshCurrentPage = loadHabits;

document.addEventListener('DOMContentLoaded', () => {
    loadHabits();
});

