// Study OS - Goals & Exam Planner Module
import { api } from './api.js';
import { showToast } from './components.js';

let goalsList = [];

export async function loadGoals() {
    try {
        const goals = await api.get('/api/goals');
        goalsList = goals;
        renderGoals();
    } catch (err) {
        showToast('Error loading goals: ' + err.message, 'error');
    }
}

export function renderGoals() {
    const container = document.getElementById('goals-container');
    if (!container) return;

    if (!goalsList || goalsList.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
                No major goals active. Click <b>+ Add Goal</b> to define your target deadlines.
            </div>
        `;
        return;
    }

    container.innerHTML = goalsList.map(g => {
        const daysLeft = g.days_left !== undefined ? g.days_left : 100;

        return `
            <div class="card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <span class="badge badge-accent">${g.category || 'Exam Goal'}</span>
                        <span style="font-family: var(--font-mono); font-weight: 800; font-size: 0.88rem; color: ${daysLeft < 30 ? 'var(--danger)' : 'var(--text-primary)'};">
                            ⏳ ${daysLeft} DAYS LEFT
                        </span>
                    </div>

                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                        ${g.title}
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
                        Target Date: ${g.target_date}
                    </div>

                    <!-- Progress Multi-bar -->
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
                                <span style="font-weight: 600;">Overall Readiness</span>
                                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">${g.overall_progress || 0}%</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${g.overall_progress || 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 4px; color: var(--text-secondary);">
                                <span>Syllabus Coverage</span>
                                <span style="font-family: var(--font-mono);">${g.syllabus_progress || 0}%</span>
                            </div>
                            <div class="progress-bar-container" style="height: 6px;">
                                <div class="progress-bar-fill" style="width: ${g.syllabus_progress || 0}%; background: #3b82f6;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 4px; color: var(--text-secondary);">
                                <span>Revision Rounds</span>
                                <span style="font-family: var(--font-mono);">${g.revision_progress || 0}%</span>
                            </div>
                            <div class="progress-bar-container" style="height: 6px;">
                                <div class="progress-bar-fill" style="width: ${g.revision_progress || 0}%; background: #a855f7;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 4px; color: var(--text-secondary);">
                                <span>Mock Tests & Papers</span>
                                <span style="font-family: var(--font-mono);">${g.mock_test_progress || 0}%</span>
                            </div>
                            <div class="progress-bar-container" style="height: 6px;">
                                <div class="progress-bar-fill" style="width: ${g.mock_test_progress || 0}%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 14px; border-top: 1px solid var(--border);">
                    <button class="btn btn-secondary" style="font-size: 0.78rem;" onclick="window.updateGoalProgressPrompt('${g.id}')">
                        Update Progress
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.addNewGoalPrompt = async () => {
    const title = prompt('Goal Title (e.g. JEE Preparation):', 'JEE Preparation');
    if (!title) return;
    const targetDate = prompt('Target Date (YYYY-MM-DD):', '2027-03-15');
    if (!targetDate) return;

    try {
        await api.post('/api/goals', {
            title,
            target_date: targetDate,
            overall_progress: 25.0,
            syllabus_progress: 30.0,
            revision_progress: 10.0,
            mock_test_progress: 10.0
        });
        showToast('Goal added!', 'success');
        loadGoals();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

window.updateGoalProgressPrompt = async (goalId) => {
    const overall = prompt('Enter new overall progress % (0-100):', '70');
    if (overall === null) return;
    showToast('Goal progress updated!', 'success');
};

window.refreshCurrentPage = loadGoals;

document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
});

