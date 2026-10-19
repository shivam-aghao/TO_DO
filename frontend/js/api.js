// Study OS - Universal API Client Module
const API_BASE = (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file'))
    ? window.location.origin
    : 'http://127.0.0.1:8000';

export const api = {
    getToken() {
        return localStorage.getItem('study_os_token') || '';
    },

    setToken(token) {
        localStorage.setItem('study_os_token', token);
    },

    removeToken() {
        localStorage.removeItem('study_os_token');
        localStorage.removeItem('study_os_user');
    },

    getUser() {
        const userStr = localStorage.getItem('study_os_user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('study_os_user', JSON.stringify(user));
    },

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // If unauthorized and on protected page, redirect to index
                if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                    // Allowed to fall back to demo mode without redirect loop
                }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Request failed with status ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

