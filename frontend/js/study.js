// Study OS - Study Session Tracker & Focus Timer Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let sessionPlannedMinutes = 60;

export async function loadStudySessions() {
    try {
        const sessions = await api.get('/api/study/sessions?days=30');
        renderSessions(sessions);
    } catch (err) {
        showToast('Error loading sessions: ' + err.message, 'error');
    }
}

function renderSessions(sessions) {
    const list = document.getElementById('study-history-list');
    if (!list) return;

    if (!sessions || sessions.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 36px; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 8px;">⏱</div>
                <div>No study sessions recorded yet. Start the focus stopwatch above or log a session.</div>
            </div>
        `;
        return;
    }

    list.innerHTML = sessions.map(s => {
        const focusStars = '★'.repeat(s.focus_rating || 4) + '☆'.repeat(5 - (s.focus_rating || 4));
        const confDelta = (s.confidence_after || 4) - (s.confidence_before || 2);
        const deltaFormatted = confDelta > 0 ? `+${confDelta}` : `${confDelta}`;

        return `
            <div class="card" style="margin-bottom: 12px; padding: 16px 20px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                            <span>${s.subject}</span>
                            <span class="badge badge-accent">${s.actual_duration} mins</span>
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                            ${s.session_date} • Planned: ${s.planned_duration}m • Focus: <span style="color: var(--warning);">${focusStars}</span>
                        </div>
                        ${s.notes ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 6px;">${s.notes}</p>` : ''}
                    </div>

                    <div style="text-align: right; background: var(--bg-elevated); padding: 8px 14px; border-radius: var(--radius-md); border: 1px solid var(--border);">
                        <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Confidence Gain</div>
                        <div style="font-size: 1rem; font-weight: 800; font-family: var(--font-mono); color: var(--success);">
                            ${s.confidence_before || 2} → ${s.confidence_after || 4} (${deltaFormatted})
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initStopwatch() {
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    const finishBtn = document.getElementById('timer-finish-btn');
    const plannedInput = document.getElementById('timer-planned-input');

    if (!display || !startBtn) return;

    const updateDisplay = () => {
        const m = Math.floor(timerSeconds / 60);
        const s = timerSeconds % 60;
        display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    startBtn.onclick = () => {
        if (!isTimerRunning) {
            isTimerRunning = true;
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
            finishBtn.style.display = 'inline-flex';
            timerInterval = setInterval(() => {
                timerSeconds++;
                updateDisplay();
            }, 1000);
        }
    };

    pauseBtn.onclick = () => {
        if (isTimerRunning) {
            isTimerRunning = false;
            clearInterval(timerInterval);
            startBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
            startBtn.textContent = 'Resume';
        }
    };

    finishBtn.onclick = async () => {
        isTimerRunning = false;
        clearInterval(timerInterval);
        const actualMins = Math.max(1, Math.round(timerSeconds / 60));
        const plannedMins = parseInt(plannedInput?.value || 60, 10);
        const subject = document.getElementById('timer-subject-input')?.value || 'Active Focus Session';

        // Prompt for understanding rating 1-5
        const rating = prompt('How well do you understand this topic? (1 to 5):', '4');
        const confAfter = parseInt(rating || '4', 10);

        try {
            await api.post('/api/study/sessions', {
                subject,
                planned_duration: plannedMins,
                actual_duration: actualMins,
                focus_rating: 4,
                confidence_before: 2,
                confidence_after: confAfter,
                notes: `Timed session completed via Study OS focus stopwatch.`
            });
            showToast(`Session logged: ${actualMins} minutes focused!`, 'success');
            timerSeconds = 0;
            updateDisplay();
            startBtn.style.display = 'inline-flex';
            startBtn.textContent = 'Start Focus Block';
            pauseBtn.style.display = 'none';
            finishBtn.style.display = 'none';
            loadStudySessions();
        } catch (err) {
            showToast('Failed to save session: ' + err.message, 'error');
        }
    };
}

window.refreshCurrentPage = loadStudySessions;

document.addEventListener('DOMContentLoaded', () => {
    loadStudySessions();
    initStopwatch();
});

