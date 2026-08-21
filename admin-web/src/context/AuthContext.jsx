import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    if (res.data.success) {
                        setUser(res.data.data.user);
                    }
                } catch (error) {
                    console.error("Failed to load user", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (email, password, twoFactorToken) => {
        try {
            const res = await api.post('/auth/login', { email, password, twoFactorToken });
            
            // If the server requires 2FA but we didn't provide one (or need to prompt)
            if (res.data.success && res.data.require2FA) {
                return { success: true, require2FA: true };
            }

            if (res.data.success) {
                localStorage.setItem('token', res.data.data.token);
                setUser(res.data.data.user); // Assuming backend returns user object
                return { success: true };
            }
        } catch (error) {
            console.error("Login failed", error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const updateUser = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data.user);
            }
        } catch (error) {
            console.error("Failed to update user", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
