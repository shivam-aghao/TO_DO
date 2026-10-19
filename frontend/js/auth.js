// Study OS - Authentication Module
import { api } from './api.js';
import { showToast } from './components.js';

export const auth = {
    async login(email, password) {
        try {
            const data = await api.post('/api/auth/login', { email, password });
            api.setToken(data.access_token);
            api.setUser(data.user);
            showToast('Welcome back, ' + (data.user.full_name || 'Student'), 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 600);
            return data;
        } catch (error) {
            showToast(error.message || 'Login failed. Please check credentials.', 'error');
            throw error;
        }
    },

    async register(email, password, fullName) {
        try {
            const data = await api.post('/api/auth/register', {
                email,
                password,
                full_name: fullName
            });
            api.setToken(data.access_token);
            api.setUser(data.user);
            showToast('Account created successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 600);
            return data;
        } catch (error) {
            showToast(error.message || 'Registration failed.', 'error');
            throw error;
        }
    },

    logout() {
        api.removeToken();
        showToast('Session refreshed', 'info');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 400);
    },

    checkSession() {
        // No login required; always remain on dashboard
    }
};

window.auth = auth;

