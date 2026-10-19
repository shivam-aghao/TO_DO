// Study OS - Daily Routine Builder & Optimizer Module
import { api } from './api.js';
import { showToast } from './components.js';

let routineBlocks = [];

export async function loadRoutine() {
    try {
        const blocks = await api.get('/api/routine');
        routineBlocks = blocks;
        renderRoutine();
    } catch (err) {
        showToast('Error loading routine: ' + err.message, 'error');
    }
}

export function renderRoutine() {
    const list = document.getElementById('routine-blocks-list');
    if (!list) return;

    if (!routineBlocks || routineBlocks.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                No routine blocks defined yet. Click <b>+ Add Block</b> to define your day.
            </div>
        `;
        return;
    }

    list.innerHTML = routineBlocks.map(b => {
        const typeColor = b.color || (
            b.block_type === 'Sleep' ? '#6366f1' :
            b.block_type === 'Study' ? '#8b5cf6' :
            b.block_type === 'Gym' ? '#ef4444' :
            b.block_type === 'Food' ? '#f59e0b' :
            b.block_type === 'Revision' ? '#a855f7' :
            b.block_type === 'Break' ? '#10b981' : '#64748b'
        );

        return `
            <div class="card" style="margin-bottom: 12px; padding: 16px 20px; border-left: 4px solid ${typeColor}; background: var(--bg-card);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 800; color: ${typeColor};">
                            ${b.start_time} - ${b.end_time}
                        </span>
                        <div>
                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${b.title}</div>
                            <span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); margin-top: 4px;">
                                ${b.block_type}
                            </span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="btn btn-icon" onclick="window.editRoutineBlockPrompt('${b.id}')" title="Edit">✎</button>
                        <button class="btn btn-icon" onclick="window.deleteRoutineBlockAction('${b.id}')" title="Delete" style="color: var(--danger);">✕</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.deleteRoutineBlockAction = async (blockId) => {
    try {
        await api.delete(`/api/routine/${blockId}`);
        routineBlocks = routineBlocks.filter(b => b.id !== blockId);
        renderRoutine();
        showToast('Routine block deleted', 'info');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

window.editRoutineBlockPrompt = async (blockId) => {
    const block = routineBlocks.find(b => b.id === blockId);
    if (!block) return;
    const newTitle = prompt('Enter block title:', block.title);
    if (!newTitle) return;
    const newStart = prompt('Start time (HH:MM):', block.start_time);
    const newEnd = prompt('End time (HH:MM):', block.end_time);

    try {
        await api.post('/api/routine', {
            id: block.id,
            title: newTitle,
            block_type: block.block_type,
            start_time: newStart || block.start_time,
            end_time: newEnd || block.end_time,
            color: block.color
        });
        showToast('Block updated', 'success');
        loadRoutine();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

window.addNewRoutineBlock = async () => {
    const title = prompt('Block title (e.g. Deep Study Block):', 'Deep Study Block');
    if (!title) return;
    const block_type = prompt('Block type (Sleep / Study / Food / Break / Gym / Travel / Revision / Wind Down):', 'Study') || 'Study';
    const start_time = prompt('Start time (e.g. 14:00):', '14:00') || '14:00';
    const end_time = prompt('End time (e.g. 16:00):', '16:00') || '16:00';

    try {
        await api.post('/api/routine', {
            title,
            block_type,
            start_time,
            end_time
        });
        showToast('Routine block created', 'success');
        loadRoutine();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

window.triggerSmartScheduler = async () => {
    const container = document.getElementById('smart-scheduler-results');
    if (container) {
        container.innerHTML = `<div style="padding: 16px; color: var(--accent);">Running constraint solver: balancing sleep, gym, and tasks...</div>`;
    }
    try {
        const res = await api.post('/api/schedule/generate', {});
        showToast('Schedule generated successfully!', 'success');
        if (container) {
            container.innerHTML = `
                <div class="card" style="margin-top: 20px; border-color: var(--border-accent); background: #0c0c14;">
                    <div class="card-header">
                        <div class="card-title">🤖 AI-Optimized Study Schedule</div>
                        <span class="badge badge-accent">${res.total_scheduled_minutes} mins total focus</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
                        Sleep, gym, and recovery windows are protected. Conflict-free study blocks:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${res.study_schedule.map(s => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent);">${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}</span>
                                    <span style="font-weight: 600;">${s.title}</span>
                                </div>
                                <span class="badge badge-accent">${s.course_name} (${s.duration_minutes}m)</span>
                            </div>
                        `).join('')}
                    </div>
                    ${res.missed_tasks_rescheduled.length > 0 ? `
                        <div style="margin-top: 14px; padding: 10px; background: var(--bg-primary); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--warning);">
                            ⚠ Auto-rescheduled ${res.missed_tasks_rescheduled.length} previously missed task(s) into open morning slots.
                        </div>
                    ` : ''}
                </div>
            `;
        }
    } catch (err) {
        showToast('Scheduler error: ' + err.message, 'error');
    }
};

window.refreshCurrentPage = loadRoutine;

document.addEventListener('DOMContentLoaded', () => {
    loadRoutine();
});

