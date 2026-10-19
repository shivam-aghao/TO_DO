// Study OS - Course & Syllabus Tracker Module
import { api } from './api.js';
import { showToast, openQuickModal } from './components.js';

let allCourses = [];

export async function loadCourses() {
    try {
        const courses = await api.get('/api/courses');
        allCourses = courses;
        renderCourses();
    } catch (err) {
        showToast('Error loading courses: ' + err.message, 'error');
    }
}

export function renderCourses() {
    const container = document.getElementById('courses-list-container');
    if (!container) return;

    if (!allCourses || allCourses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px; color: var(--text-muted);">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">📚</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">No courses enrolled yet</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Click <b>+ Add Course</b> to structure your modules, chapters, and topics.</div>
            </div>
        `;
        return;
    }

    container.innerHTML = allCourses.map(course => {
        const modules = course.modules || [];
        const completionRate = course.completion_rate || 0;

        return `
            <div class="card" style="margin-bottom: 24px; border-left: 4px solid ${course.color || '#8b5cf6'};">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.8rem;">${course.icon || '📚'}</span>
                        <div>
                            <div style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.01em;">
                                ${course.name}
                                ${course.code ? `<span style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-left: 8px;">${course.code}</span>` : ''}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                                Target: ${course.target_hours || 40} focused study hours
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: 800; font-family: var(--font-mono); color: ${course.color || '#8b5cf6'};">
                            ${completionRate}% Complete
                        </div>
                        <div style="width: 140px; margin-top: 6px;">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${completionRate}%; background: ${course.color || '#8b5cf6'};"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modules & Topics Hierarchy -->
                <div style="margin-top: 18px; border-top: 1px solid var(--border); padding-top: 16px;">
                    <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px;">
                        Modules & Syllabus Breakdown
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${modules.map(mod => `
                            <div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-weight: 700; font-size: 0.95rem;">📁 ${mod.name}</span>
                                    <span style="font-size: 0.82rem; font-family: var(--font-mono); color: var(--text-secondary);">${mod.completion || 0}%</span>
                                </div>
                                
                                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px; padding-left: 14px; border-left: 2px solid var(--border);">
                                    ${(mod.chapters || []).map(ch => `
                                        <div>
                                            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">
                                                🔖 ${ch.name}
                                            </div>
                                            <div style="display: flex; flex-direction: column; gap: 6px; padding-left: 12px;">
                                                ${(ch.topics || []).map(top => {
                                                    const status = top.status || 'Not Started';
                                                    const sClass = status === 'Mastered' ? 'badge-completed' :
                                                                   status === 'Revised' ? 'badge-accent' :
                                                                   status === 'Practicing' ? 'badge-warning' :
                                                                   status === 'Learning' ? 'badge-in-progress' : 'badge-muted';
                                                    return `
                                                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border);">
                                                            <span style="font-size: 0.82rem; color: var(--text-primary);">• ${top.name}</span>
                                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                                <span class="badge ${sClass}">${status}</span>
                                                                <select class="form-select" 
                                                                        style="padding: 2px 6px; font-size: 0.72rem; width: auto; background: var(--bg-primary);"
                                                                        onchange="window.updateTopicStatusAction('${top.id}', this.value)">
                                                                    <option value="Not Started" ${status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                                                    <option value="Learning" ${status === 'Learning' ? 'selected' : ''}>Learning</option>
                                                                    <option value="Practicing" ${status === 'Practicing' ? 'selected' : ''}>Practicing</option>
                                                                    <option value="Revised" ${status === 'Revised' ? 'selected' : ''}>Revised</option>
                                                                    <option value="Mastered" ${status === 'Mastered' ? 'selected' : ''}>Mastered</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.updateTopicStatusAction = async (topicId, status) => {
    try {
        await api.put(`/api/courses/topics/${topicId}`, { status });
        showToast('Topic status updated to ' + status, 'success');
        loadCourses();
    } catch (err) {
        showToast('Error updating topic: ' + err.message, 'error');
    }
};

window.refreshCurrentPage = loadCourses;

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
});

