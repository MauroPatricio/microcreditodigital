import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from storage on app start
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const [token, storedUser] = await AsyncStorage.multiGet(['token', 'user']);

            if (token[1] && storedUser[1]) {
                setUser(JSON.parse(storedUser[1]));
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            const { user: userData, token, refreshToken } = response.data;

            await AsyncStorage.multiSet([
                ['token', token],
                ['refreshToken', refreshToken],
                ['user', JSON.stringify(userData)],
            ]);

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao fazer login',
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            const { user: newUser, token, refreshToken } = response.data;

            await AsyncStorage.multiSet([
                ['token', token],
                ['refreshToken', refreshToken],
                ['user', JSON.stringify(newUser)],
            ]);

            setUser(newUser);
            setIsAuthenticated(true);

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao registrar',
            };
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUser = async () => {
        try {
            const response = await authService.getMe();
            const userData = response.data.user;

            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Update user error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
