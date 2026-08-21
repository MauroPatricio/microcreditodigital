import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services';
import { registerForPushNotificationsAsync, updatePushTokenOnServer } from '../services/pushNotificationService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user from storage on app start
    useEffect(() => {
        loadUser();
    }, []);

    const handlePushTokenRegistration = async () => {
        try {
            const token = await registerForPushNotificationsAsync();
            if (token) {
                await updatePushTokenOnServer(token);
            }
        } catch (error) {
            console.log('Push notification registration failed', error);
        }
    };

    const loadUser = async () => {
        try {
            const [token, storedUser] = await AsyncStorage.multiGet(['token', 'user']);

            if (token[1] && storedUser[1]) {
                setUser(JSON.parse(storedUser[1]));
                setIsAuthenticated(true);
                // Update user in background to get latest populated fields like institution
                updateUser();
                
                // Register for push notifications
                handlePushTokenRegistration();
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
            
            // Registar para Push Notifications após o login (e após o token estar salvo para a API o enviar)
            setTimeout(() => {
                handlePushTokenRegistration();
            }, 500);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = error.response?.data?.message || 'Erro ao fazer login';
            if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                errorMessage = error.response.data.errors[0].msg;
            }
            return {
                success: false,
                message: errorMessage,
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
            
            // Registar para Push Notifications após o registo inicial
            setTimeout(() => {
                handlePushTokenRegistration();
            }, 500);

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Register error:', error);
            let errorMessage = error.response?.data?.message || 'Erro ao registrar';
            if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                errorMessage = error.response.data.errors[0].msg;
            } else if (error.response?.data?.error && typeof error.response.data.error === 'string') {
                errorMessage = error.response.data.error;
            }

            return {
                success: false,
                message: errorMessage,
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

    const deleteAccount = async () => {
        try {
            await authService.deleteAccount();
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        } finally {
            await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
            setUser(null);
            setIsAuthenticated(false);
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
                deleteAccount,
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
