// API Configuration - automatically switches between dev and production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('tug_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Generic fetch wrapper
const fetchAPI = async (endpoint, options = {}) => {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
        },
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(error.error || 'Error en la solicitud');
    }

    return response.json();
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
    register: (data) => fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    login: (data) => fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getMe: () => fetchAPI('/auth/me'),

    updateMe: (data) => fetchAPI('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    updateAvatar: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return fetchAPI('/auth/me/avatar', {
            method: 'PUT',
            body: formData,
        });
    },
};

// ============================================
// USERS API
// ============================================

export const usersAPI = {
    getById: (id) => fetchAPI(`/users/${id}`),

    getTracks: (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/users/${id}/tracks${query ? `?${query}` : ''}`);
    },

    getFollowers: (id) => fetchAPI(`/users/${id}/followers`),

    getFollowing: (id) => fetchAPI(`/users/${id}/following`),

    follow: (id) => fetchAPI(`/users/${id}/follow`, { method: 'POST' }),

    unfollow: (id) => fetchAPI(`/users/${id}/follow`, { method: 'DELETE' }),

    search: (query) => fetchAPI(`/users/search?q=${encodeURIComponent(query)}`),

    getTop: (limit = 10) => fetchAPI(`/users/top?limit=${limit}`),
};

// ============================================
// TRACKS API
// ============================================

export const tracksAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/tracks${query ? `?${query}` : ''}`);
    },

    getById: (id) => fetchAPI(`/tracks/${id}`),

    getTrending: (limit = 10) => fetchAPI(`/tracks/trending?limit=${limit}`),

    create: (data, audioFile, coverFile) => {
        const formData = new FormData();
        formData.append('title', data.title);
        if (data.description) formData.append('description', data.description);
        if (data.genre) formData.append('genre', data.genre);
        if (data.tags) formData.append('tags', data.tags);
        formData.append('audio', audioFile);
        if (coverFile) formData.append('cover', coverFile);

        return fetchAPI('/tracks', {
            method: 'POST',
            body: formData,
        });
    },

    update: (id, data) => fetchAPI(`/tracks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    delete: (id) => fetchAPI(`/tracks/${id}`, { method: 'DELETE' }),

    like: (id) => fetchAPI(`/tracks/${id}/like`, { method: 'POST' }),

    unlike: (id) => fetchAPI(`/tracks/${id}/like`, { method: 'DELETE' }),

    getComments: (id) => fetchAPI(`/tracks/${id}/comments`),

    addComment: (id, content) => fetchAPI(`/tracks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    }),

    getStreamUrl: (id) => `${API_URL.replace('/api', '')}/api/tracks/${id}/stream`,
};

// ============================================
// FEED API
// ============================================

export const feedAPI = {
    getFeed: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/feed${query ? `?${query}` : ''}`);
    },

    getRecent: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/feed/recent${query ? `?${query}` : ''}`);
    },

    getPopular: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/feed/popular${query ? `?${query}` : ''}`);
    },

    getSuggestions: () => fetchAPI('/feed/suggestions'),
};

// ============================================
// COMMUNITY API
// ============================================

export const communityAPI = {
    getCollabs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchAPI(`/community/collabs${query ? `?${query}` : ''}`);
    },

    getCollabById: (id) => fetchAPI(`/community/collabs/${id}`),

    createCollab: (data) => fetchAPI('/community/collabs', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    updateCollab: (id, data) => fetchAPI(`/community/collabs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    deleteCollab: (id) => fetchAPI(`/community/collabs/${id}`, { method: 'DELETE' }),

    getConversations: () => fetchAPI('/community/conversations'),

    getMessages: (userId) => fetchAPI(`/community/messages/${userId}`),

    sendMessage: (receiver_id, content) => fetchAPI('/community/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id, content }),
    }),

    getNotifications: (unread_only = false) =>
        fetchAPI(`/community/notifications?unread_only=${unread_only}`),

    markNotificationsRead: (ids = null) => fetchAPI('/community/notifications/read', {
        method: 'PUT',
        body: JSON.stringify({ ids }),
    }),

    getStats: () => fetchAPI('/community/stats'),
};

// ============================================
// AUTH HELPERS
// ============================================

export const saveAuth = (token, user) => {
    localStorage.setItem('tug_token', token);
    localStorage.setItem('tug_user', JSON.stringify(user));
};

export const getStoredUser = () => {
    const user = localStorage.getItem('tug_user');
    return user ? JSON.parse(user) : null;
};

export const clearAuth = () => {
    localStorage.removeItem('tug_token');
    localStorage.removeItem('tug_user');
};

export const isAuthenticated = () => {
    return !!localStorage.getItem('tug_token');
};

// Get base URL for static files (images, audio)
export const getStaticUrl = (path) => {
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
};
