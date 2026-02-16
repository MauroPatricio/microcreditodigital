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
import CollectionsScreen from '../screens/Home/CollectionsScreen';
import CreditSimulatorScreen from '../screens/Credit/CreditSimulatorScreen';
import MyCreditsScreen from '../screens/Credit/MyCreditsScreen';

// Profile/Extra Screens
import DocumentCenter from '../screens/Profile/DocumentCenter';
import ContractSigner from '../screens/Profile/ContractSigner';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Agent Navigator (Field Agents)
function AgentNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: { height: 60, paddingBottom: 5 },
                headerShown: true,
                headerStyle: { backgroundColor: '#fff', elevation: 0, shadowOpacity: 0 },
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Tab.Screen
                name="AgentHome"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏢</Text>,
                    headerTitle: 'Painel do Agente',
                }}
            />
            <Tab.Screen
                name="AddClient"
                component={RegisterScreen}
                options={{
                    title: 'Novo Cliente',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
                    headerTitle: 'Registar Cliente',
                }}
            />
            <Tab.Screen
                name="Payments"
                component={CollectionsScreen}
                options={{
                    title: 'Cobranças',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>💰</Text>,
                    headerTitle: 'Minhas Cobranças',
                }}
            />
        </Tab.Navigator>
    );
}

// Client Tab Navigator
function ClientTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: { height: 60, paddingBottom: 5 },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏠</Text>,
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="CreditSimulator"
                component={CreditSimulatorScreen}
                options={{
                    title: 'Simular',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>⚖️</Text>,
                    headerTitle: 'Simulador',
                }}
            />
            <Tab.Screen
                name="MyCredits"
                component={MyCreditsScreen}
                options={{
                    title: 'Créditos',
                    tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
                    headerTitle: 'Meus Créditos',
                }}
            />
        </Tab.Navigator>
    );
}

// Client Stack Navigator (for full screen screens)
function ClientStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainTabs" component={ClientTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="DocumentCenter" component={DocumentCenter} options={{ title: 'Documentos' }} />
            <Stack.Screen name="ContractSigner" component={ContractSigner} options={{ title: 'Assinar Contrato' }} />
        </Stack.Navigator>
    );
}

// Root Navigator
export default function AppNavigator() {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return null;

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <AuthNavigator />
            ) : user?.role === 'agent' ? (
                <AgentNavigator />
            ) : (
                <ClientStack />
            )}
        </NavigationContainer>
    );
}
