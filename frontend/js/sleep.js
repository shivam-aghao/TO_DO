// Study OS - Sleep Tracker & Circadian Consistency Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let sleepHistory = [];
let sleepChart = null;

export async function loadSleep() {
    try {
        const logs = await api.get('/api/sleep?limit=14');
        sleepHistory = logs;
        renderSleepOverview();
        renderSleepChart();
    } catch (err) {
        showToast('Error loading sleep logs: ' + err.message, 'error');
    }
}

function renderSleepOverview() {
    const consistencyEl = document.getElementById('sleep-consistency-pct');
    const noteEl = document.getElementById('sleep-consistency-note');
    const latestDurationEl = document.getElementById('sleep-latest-duration');
    const qualityEl = document.getElementById('sleep-latest-quality');

    if (!sleepHistory || sleepHistory.length === 0) return;

    const latest = sleepHistory[0];
    const hours = (latest.duration_minutes / 60).toFixed(1);
    
    if (latestDurationEl) latestDurationEl.textContent = `${hours}h`;
    if (qualityEl) qualityEl.textContent = '★'.repeat(latest.sleep_quality || 4);

    const scores = sleepHistory.slice(0, 7).map(s => s.schedule_consistency_score || 85);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const consistentDays = scores.filter(s => s >= 80).length;

    if (consistencyEl) consistencyEl.textContent = `${avgScore}%`;
    if (noteEl) {
        noteEl.textContent = `Your sleep schedule was consistent on ${consistentDays} of the last ${scores.length} days.`;
    }
}

function renderSleepChart() {
    const canvas = document.getElementById('sleep-duration-chart');
    if (!canvas || !window.Chart) return;

    const labels = sleepHistory.map(s => s.log_date || '').reverse();
    const durations = sleepHistory.map(s => (s.duration_minutes / 60).toFixed(1)).reverse();

    if (sleepChart) {
        sleepChart.destroy();
    }

    sleepChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sleep Duration (Hours)',
                data: durations,
                backgroundColor: 'rgba(139, 92, 246, 0.4)',
                borderColor: '#8b5cf6',
                borderWidth: 1,
                borderRadius: 6
            }, {
                type: 'line',
                label: 'Target Baseline (8h)',
                data: labels.map(() => 8),
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 12,
                    grid: { color: '#222222' },
                    ticks: { color: '#8a8a8a', stepSize: 2 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8a8a8a' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f5f5f5' }
                }
            }
        }
    });
}

window.refreshCurrentPage = loadSleep;

document.addEventListener('DOMContentLoaded', () => {
    loadSleep();
});

