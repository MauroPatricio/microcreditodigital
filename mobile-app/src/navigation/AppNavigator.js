import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/Home/HomeScreen';
import CreditSimulatorScreen from '../screens/Credit/CreditSimulatorScreen';
import MyCreditsScreen from '../screens/Credit/MyCreditsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Main Tab Navigator
function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e2e8f0',
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    color: '#1e293b',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="CreditSimulator"
                component={CreditSimulatorScreen}
                options={{
                    title: 'Simular',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
                    headerTitle: 'Simulador de Crédito',
                }}
            />
            <Tab.Screen
                name="MyCredits"
                component={MyCreditsScreen}
                options={{
                    title: 'Meus Créditos',
                    tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📊</Text>,
                    headerTitle: 'Meus Créditos',
                }}
            />
        </Tab.Navigator>
    );
}

// Root Navigator
export default function AppNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null; // ou um componente de loading
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
