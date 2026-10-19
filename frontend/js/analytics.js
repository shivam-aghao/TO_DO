// Study OS - Progress Analytics & Visual Intelligence Module
import { api } from './api.js';
import { showToast } from './components.js';

let analyticsData = null;
let charts = {};

export async function loadAnalytics() {
    try {
        const data = await api.get('/api/analytics');
        analyticsData = data;
        renderAnalyticsKPIs(data);
        renderCharts(data);
    } catch (err) {
        showToast('Error loading analytics: ' + err.message, 'error');
    }
}

function renderAnalyticsKPIs(data) {
    const kpis = data.kpis || {};
    const studyHoursEl = document.getElementById('an-study-hours');
    const taskRateEl = document.getElementById('an-task-rate');
    const courseAvgEl = document.getElementById('an-course-avg');
    const plannedRatioEl = document.getElementById('an-planned-ratio');

    if (studyHoursEl) studyHoursEl.textContent = `${data.study_hours?.week_hours || 0}h`;
    if (taskRateEl) taskRateEl.textContent = `${data.task_completion_rate || 0}%`;
    if (courseAvgEl) courseAvgEl.textContent = `${data.course_completion || 0}%`;
    if (plannedRatioEl) plannedRatioEl.textContent = `${data.planned_vs_actual?.ratio_percentage || 0}%`;
}

function renderCharts(data) {
    if (!window.Chart) return;

    // Destroy previous charts if reloaded
    Object.values(charts).forEach(c => c && c.destroy());

    // 1. Study Hours (Last 30 Days Line Chart)
    const studyCtx = document.getElementById('chart-study-30d');
    if (studyCtx && data.study_trend_30d) {
        const labels = data.study_trend_30d.map(d => d.label);
        const hours = data.study_trend_30d.map(d => d.hours);

        charts.study = new Chart(studyCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Study Hours',
                    data: hours,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#8b5cf6',
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#222222' },
                        ticks: { color: '#8a8a8a' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a8a8a', maxTicksLimit: 10 }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#f5f5f5' } }
                }
            }
        });
    }

    // 2. Subject Comparison (Bar Chart)
    const subjectCtx = document.getElementById('chart-subject-comparison');
    if (subjectCtx && data.course_breakdown) {
        const cLabels = data.course_breakdown.map(c => c.name);
        const cProgress = data.course_breakdown.map(c => c.progress);

        charts.subject = new Chart(subjectCtx, {
            type: 'bar',
            data: {
                labels: cLabels,
                datasets: [{
                    label: 'Syllabus Mastery %',
                    data: cProgress,
                    backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: '#222222' },
                        ticks: { color: '#8a8a8a' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a8a8a' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. Planned vs Actual (Doughnut / Bar comparison)
    const pvaCtx = document.getElementById('chart-planned-vs-actual');
    if (pvaCtx && data.planned_vs_actual) {
        const planned = data.planned_vs_actual.planned_hours;
        const actual = data.planned_vs_actual.actual_hours;

        charts.pva = new Chart(pvaCtx, {
            type: 'bar',
            data: {
                labels: ['Planned Study Target', 'Actual Completed Focus'],
                datasets: [{
                    data: [planned, actual],
                    backgroundColor: ['#222222', '#8b5cf6'],
                    borderColor: ['#333333', '#9d71ff'],
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#222222' },
                        ticks: { color: '#8a8a8a' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8a8a8a' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

window.refreshCurrentPage = loadAnalytics;

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
});

