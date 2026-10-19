// Study OS - Main Dashboard Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let currentDashboardData = null;

export async function loadDashboard() {
    try {
        const data = await api.get('/api/dashboard');
        currentDashboardData = data;
        renderHeader(data);
        renderKPIs(data.kpis);
        renderTimeline(data.schedule);
        renderInsights(data.insights);
        initAICopilot();
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        showToast('Could not fetch live dashboard data: ' + err.message, 'error');
    }
}

function renderHeader(data) {
    const greetingEl = document.getElementById('header-greeting');
    const dateEl = document.getElementById('header-date');
    const userAvatarEl = document.getElementById('user-avatar-initial');
    const userNameEl = document.getElementById('user-name-display');

    const name = data.user?.full_name || 'Shiva';
    
    // Determine time of day greeting
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';

    if (greetingEl) {
        greetingEl.innerHTML = `${timeGreeting}, ${name} <span style="display:inline-block; animation: wave 2s infinite;">👋</span>`;
    }

    if (dateEl) {
        const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }

    if (userAvatarEl) {
        userAvatarEl.textContent = name.charAt(0).toUpperCase();
    }
    if (userNameEl) {
        userNameEl.textContent = name;
    }
}

function renderKPIs(kpis) {
    if (!kpis) return;
    
    const studyEl = document.getElementById('kpi-study-time');
    const tasksEl = document.getElementById('kpi-tasks');
    const courseEl = document.getElementById('kpi-course-progress');
    const focusEl = document.getElementById('kpi-focus-score');
    const sleepEl = document.getElementById('kpi-sleep');

    if (studyEl) studyEl.textContent = kpis.study_time_today || '0m';
    if (tasksEl) tasksEl.textContent = `${kpis.tasks_completed} / ${kpis.tasks_total || 0}`;
    if (courseEl) courseEl.textContent = `${kpis.course_progress_avg || 0}%`;
    if (focusEl) focusEl.textContent = `${kpis.focus_score_avg || 0}%`;
    if (sleepEl) sleepEl.textContent = kpis.sleep_last_night || '0m';
}

function renderTimeline(scheduleItems) {
    const timelineContainer = document.getElementById('today-timeline');
    if (!timelineContainer) return;

    if (!scheduleItems || scheduleItems.length === 0) {
        timelineContainer.innerHTML = `
            <div style="color: var(--text-muted); font-size: 0.9rem; padding: 20px 0; text-align: center;">
                No scheduled activities for today yet. Use <b>+ Add Task</b> or routine builder to organize your day.
            </div>
        `;
        return;
    }

    timelineContainer.innerHTML = scheduleItems.map(item => {
        const timeFormatted = item.time.substring(0, 5);
        const isCompleted = item.status === 'Completed';
        const isInProgress = item.status === 'In Progress';

        let badgeClass = 'badge-muted';
        if (isCompleted) badgeClass = 'badge-completed';
        else if (isInProgress) badgeClass = 'badge-in-progress';

        const categoryColor = item.color || (item.category === 'Gym' ? '#ef4444' : item.category === 'Food' ? '#f59e0b' : '#8b5cf6');

        return `
            <div class="timeline-item">
                <div class="timeline-node" style="border-color: ${categoryColor};"></div>
                <div class="timeline-time">${timeFormatted}</div>
                <div class="timeline-content">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${item.title}</span>
                        <span class="badge ${badgeClass}">${item.status}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.78rem; color: var(--text-secondary);">
                        ${item.course ? `<span>📚 ${item.course}</span>` : ''}
                        ${item.duration ? `<span>⏱ ${item.duration} min</span>` : ''}
                        <span>🏷 ${item.category}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderInsights(insights) {
    const container = document.getElementById('smart-insights-list');
    if (!container) return;

    if (!insights || insights.length === 0) {
        container.innerHTML = `
            <div class="insight-item">
                <span class="insight-icon">ℹ</span>
                <div>Not enough data yet. Keep tracking for a few days to unlock this insight.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = insights.map(text => `
        <div class="insight-item">
            <span class="insight-icon">◈</span>
            <div>${text}</div>
        </div>
    `).join('');
}

function initAICopilot() {
    const form = document.getElementById('ai-copilot-form');
    const input = document.getElementById('ai-copilot-input');
    const chatBody = document.getElementById('ai-chat-body');
    const chips = document.querySelectorAll('.query-chip');

    if (!form || !input || !chatBody) return;

    const askAI = async (question) => {
        if (!question) return;

        // Append user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.textContent = question;
        chatBody.appendChild(userBubble);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Append bot typing placeholder
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-bubble bot';
        botBubble.innerHTML = `<em>Analyzing database telemetry...</em>`;
        chatBody.appendChild(botBubble);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const res = await api.post('/api/ai/assistant', { query: question });
            botBubble.innerHTML = res.response.replace(/\n/g, '<br/>');
        } catch (err) {
            botBubble.textContent = 'Unable to generate analysis: ' + err.message;
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (q) {
            askAI(q);
            input.value = '';
        }
    };

    chips.forEach(chip => {
        chip.onclick = () => {
            const q = chip.getAttribute('data-query') || chip.textContent;
            askAI(q);
        };
    });
}

// Global refresh callback
window.refreshCurrentPage = loadDashboard;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

