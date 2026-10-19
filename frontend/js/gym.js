// Study OS - Gym Tracker & Workout Program Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let workoutsList = [];

export async function loadWorkouts() {
    try {
        const workouts = await api.get('/api/gym');
        workoutsList = workouts;
        renderWorkouts();
    } catch (err) {
        showToast('Error loading workouts: ' + err.message, 'error');
    }
}

export function renderWorkouts() {
    const container = document.getElementById('workouts-container');
    if (!container) return;

    if (!workoutsList || workoutsList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 8px;">🏋️</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">No workouts logged yet</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Click <b>+ Workout</b> to schedule or log your routine.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = workoutsList.map(w => {
        const exercises = w.exercises || [];

        return `
            <div class="card" style="margin-bottom: 24px; border-left: 4px solid #ef4444;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase;">
                            ${w.title}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                            ${w.workout_date} • Split: ${w.split_name} • Duration: ${w.duration_minutes || 60} min
                        </div>
                    </div>
                    <span class="badge ${w.is_completed ? 'badge-completed' : 'badge-urgent'}">
                        ${w.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                </div>

                ${w.notes ? `<div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 16px; padding: 8px 12px; background: var(--bg-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border);">📝 ${w.notes}</div>` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    ${exercises.map(ex => `
                        <div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${ex.name}</span>
                                <span class="badge" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                                    ${ex.target_muscle || 'Muscle'}
                                </span>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 6px;">
                                ${(ex.sets || []).map(s => `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border); font-size: 0.82rem;">
                                        <span style="font-weight: 600; color: var(--text-secondary);">Set ${s.set_number}</span>
                                        <span style="font-family: var(--font-mono); font-weight: 700;">${s.target_reps} reps × ${s.weight_kg} kg</span>
                                        <input type="checkbox" ${s.is_completed ? 'checked' : ''} 
                                               onchange="window.toggleGymSet('${s.set_number}', this.checked)"
                                               style="accent-color: #ef4444; cursor: pointer;" />
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

window.toggleGymSet = (setNumber, isChecked) => {
    showToast(isChecked ? `Set ${setNumber} completed! 💪` : `Set ${setNumber} unmarked`, 'info');
};

window.refreshCurrentPage = loadWorkouts;

document.addEventListener('DOMContentLoaded', () => {
    loadWorkouts();
});

