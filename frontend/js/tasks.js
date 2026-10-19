// Study OS - Advanced Tasks & Todo Manager Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let allTasks = [];
let currentFilter = 'all';
let currentSearch = '';

export async function loadTasks() {
    try {
        const tasks = await api.get('/api/tasks');
        allTasks = tasks;
        renderTasks();
    } catch (err) {
        showToast('Error loading tasks: ' + err.message, 'error');
    }
}

export function renderTasks() {
    const listContainer = document.getElementById('tasks-list-container');
    if (!listContainer) return;

    let filtered = allTasks.filter(t => {
        if (currentFilter !== 'all' && t.status !== currentFilter) return false;
        if (currentSearch) {
            const query = currentSearch.toLowerCase();
            const titleMatch = (t.title || '').toLowerCase().includes(query);
            const descMatch = (t.description || '').toLowerCase().includes(query);
            const tagMatch = (t.tags || []).some(tag => tag.toLowerCase().includes(query));
            if (!titleMatch && !descMatch && !tagMatch) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
                <div style="font-size: 2rem; margin-bottom: 8px;">📋</div>
                <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary);">No tasks match your filters</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Click <b>+ Add Task</b> to schedule your study sessions and deliverables.</div>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = filtered.map(t => {
        const isCompleted = t.status === 'Completed';
        const subtasks = t.subtasks || [];
        const completedSubtasks = subtasks.filter(s => s.is_completed).length;

        const priorityBadge = t.priority === 'urgent' ? 'badge-urgent' :
                              t.priority === 'high' ? 'badge-high' :
                              t.priority === 'medium' ? 'badge-accent' : 'badge-muted';

        const difficultyBadge = t.difficulty === 'hard' ? 'badge-danger' :
                                t.difficulty === 'medium' ? 'badge-warning' : 'badge-success';

        return `
            <div class="card task-card ${isCompleted ? 'completed-task' : ''}" 
                 draggable="true" 
                 data-id="${t.id}"
                 style="margin-bottom: 14px; padding: 18px 20px; cursor: grab; background: var(--bg-card);">
                
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;">
                    <div style="display: flex; align-items: flex-start; gap: 14px; flex: 1;">
                        <input type="checkbox" 
                               ${isCompleted ? 'checked' : ''} 
                               onchange="window.toggleTaskComplete('${t.id}', this.checked)"
                               style="width: 20px; height: 20px; margin-top: 3px; accent-color: var(--accent); cursor: pointer;" />
                        
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                <span style="font-size: 1rem; font-weight: 700; ${isCompleted ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                                    ${t.title}
                                </span>
                                <span class="badge ${priorityBadge}">${t.priority}</span>
                                <span class="badge ${difficultyBadge}">${t.difficulty}</span>
                                <span class="badge ${isCompleted ? 'badge-completed' : 'badge-muted'}">${t.status}</span>
                            </div>
                            
                            ${t.description ? `<p style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 6px;">${t.description}</p>` : ''}

                            <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 10px; font-size: 0.78rem; color: var(--text-muted);">
                                ${t.course_name ? `<span>📚 ${t.course_name}</span>` : ''}
                                ${t.chapter_name ? `<span>🔖 ${t.chapter_name}</span>` : ''}
                                <span>⏱ ${t.estimated_duration || 45} mins</span>
                                ${t.scheduled_time ? `<span>◷ ${t.scheduled_time.substring(0, 5)}</span>` : ''}
                                ${subtasks.length > 0 ? `<span>☑ ${completedSubtasks}/${subtasks.length} subtasks</span>` : ''}
                            </div>

                            ${subtasks.length > 0 ? `
                                <div style="margin-top: 10px; padding: 8px 12px; background: var(--bg-elevated); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                                    ${subtasks.map(s => `
                                        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; padding: 2px 0;">
                                            <input type="checkbox" ${s.is_completed ? 'checked' : ''} disabled style="accent-color: var(--accent);" />
                                            <span style="${s.is_completed ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">${s.title}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="btn btn-icon" onclick="window.rescheduleTaskPrompt('${t.id}')" title="Reschedule / Change Status">⏱</button>
                        <button class="btn btn-icon" onclick="window.deleteTaskAction('${t.id}')" title="Delete Task" style="color: var(--danger);">✕</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    initDragAndDrop();
}

function initDragAndDrop() {
    const cards = document.querySelectorAll('.task-card');
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            card.style.opacity = '0.5';
        });

        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            const targetId = card.getAttribute('data-id');
            if (draggedId !== targetId) {
                // Reorder tasks visually and update
                const draggedIndex = allTasks.findIndex(t => t.id === draggedId);
                const targetIndex = allTasks.findIndex(t => t.id === targetId);
                if (draggedIndex > -1 && targetIndex > -1) {
                    const [moved] = allTasks.splice(draggedIndex, 1);
                    allTasks.splice(targetIndex, 0, moved);
                    renderTasks();
                    showToast('Task order updated', 'info');
                }
            }
        });
    });
}

// Global actions for tasks
window.toggleTaskComplete = async (taskId, isChecked) => {
    try {
        const newStatus = isChecked ? 'Completed' : 'In Progress';
        await api.put(`/api/tasks/${taskId}`, { status: newStatus });
        const task = allTasks.find(t => t.id === taskId);
        if (task) task.status = newStatus;
        renderTasks();
        showToast(isChecked ? 'Task marked complete! 🎯' : 'Task in progress', 'success');
    } catch (err) {
        showToast('Update failed: ' + err.message, 'error');
    }
};

window.deleteTaskAction = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        await api.delete(`/api/tasks/${taskId}`);
        allTasks = allTasks.filter(t => t.id !== taskId);
        renderTasks();
        showToast('Task deleted', 'info');
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    }
};

window.rescheduleTaskPrompt = async (taskId) => {
    const newStatus = prompt('Enter new status (Not Started / In Progress / Completed / Skipped / Rescheduled):', 'In Progress');
    if (!newStatus) return;
    try {
        await api.put(`/api/tasks/${taskId}`, { status: newStatus });
        const task = allTasks.find(t => t.id === taskId);
        if (task) task.status = newStatus;
        renderTasks();
        showToast('Status updated to ' + newStatus, 'success');
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
};

window.refreshCurrentPage = loadTasks;

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();

    const searchInput = document.getElementById('tasks-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            currentSearch = e.target.value.trim();
            renderTasks();
        };
    }

    const filterBtns = document.querySelectorAll('.task-filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || 'all';
            renderTasks();
        };
    });
});

