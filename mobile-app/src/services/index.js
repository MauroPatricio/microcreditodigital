import api from './api';

// Auth Services
export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
};

// Credit Services
export const creditService = {
    simulate: async (amount, term) => {
        const response = await api.post('/credits/simulate', { amount, term });
        return response.data;
    },

    request: async (creditData) => {
        const response = await api.post('/credits/request', creditData);
        return response.data;
    },

    getMyCredits: async () => {
        const response = await api.get('/credits');
        return response.data;
    },

    getCreditDetails: async (creditId) => {
        const response = await api.get(`/credits/${creditId}`);
        return response.data;
    },
};

// Payment Services
export const paymentService = {
    makePayment: async (paymentData) => {
        const response = await api.post('/payments', paymentData);
        return response.data;
    },

    getPaymentHistory: async () => {
        const response = await api.get('/payments');
        return response.data;
    },

    getPaymentDetails: async (paymentId) => {
        const response = await api.get(`/payments/${paymentId}`);
        return response.data;
    },
};

// Notification Services
export const notificationService = {
    getNotifications: async (isRead) => {
        const params = isRead !== undefined ? { isRead } : {};
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    markAsRead: async (notificationId) => {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.put('/notifications/mark-all-read');
        return response.data;
    },
};

// Client Services
export const clientService = {
    create: async (clientData) => {
        const response = await api.post('/clients', clientData);
        return response.data;
    },

    updateProfile: async (userId, profileData) => {
        const response = await api.put(`/clients/${userId}`, profileData);
        return response.data;
    },

    uploadDocument: async (userId, documentData) => {
        const formData = new FormData();
        formData.append('type', documentData.type);
        formData.append('document', documentData.file);

        const response = await api.post(`/clients/${userId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
