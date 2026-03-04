import axios from 'axios';

const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Fallback para o IP da rede local se estiver em desenvolvimento
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para renovação de token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(`${getBaseURL()}/auth/refresh`, {
                    refreshToken,
                });

                const { token } = response.data.data;
                localStorage.setItem('token', token);

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (err) {
                // Se falhar o refresh, limpa tudo e manda pro login
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
