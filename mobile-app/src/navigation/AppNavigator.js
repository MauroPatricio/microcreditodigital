import React from 'react';
import { Text } from 'react-native';
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
import RequestCreditScreen from '../screens/Credit/RequestCreditScreen';

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

import ProfileScreen from '../screens/Profile/ProfileScreen';
import { Home, Users, Wallet, Activity, CreditCard, User } from 'lucide-react-native';

const premiumTabOptions = {
    headerShown: false,
    tabBarShowLabel: true,
    tabBarActiveTintColor: '#3b82f6',
    tabBarInactiveTintColor: '#94a3b8',
    tabBarStyle: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        elevation: 0,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        height: 70,
        paddingBottom: 8,
        paddingTop: 8,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        borderTopWidth: 0,
    },
    tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    }
};

// Agent Navigator (Field Agents)
function AgentNavigator() {
    return (
        <Tab.Navigator screenOptions={premiumTabOptions}>
            <Tab.Screen
                name="AgentHome"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={24} strokeWidth={2.5} />,
                    headerShown: true,
                    headerTitle: 'Painel do Agente',
                    headerStyle: { backgroundColor: '#fcfcfc', elevation: 0, shadowOpacity: 0 },
                }}
            />
            <Tab.Screen
                name="AddClient"
                component={RegisterScreen}
                options={{
                    title: 'Novo Cliente',
                    tabBarIcon: ({ color, size }) => <Users color={color} size={24} strokeWidth={2.5} />,
                    headerShown: true,
                    headerTitle: 'Registar Cliente',
                    headerStyle: { backgroundColor: '#fcfcfc', elevation: 0, shadowOpacity: 0 },
                }}
            />
            <Tab.Screen
                name="Payments"
                component={CollectionsScreen}
                options={{
                    title: 'Cobranças',
                    tabBarIcon: ({ color, size }) => <Wallet color={color} size={24} strokeWidth={2.5} />,
                    headerShown: true,
                    headerTitle: 'Minhas Cobranças',
                    headerStyle: { backgroundColor: '#fcfcfc', elevation: 0, shadowOpacity: 0 },
                }}
            />
            <Tab.Screen
                name="AgentProfile"
                component={ProfileScreen}
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <User color={color} size={24} strokeWidth={2.5} />,
                }}
            />
        </Tab.Navigator>
    );
}

// Client Tab Navigator
function ClientTabNavigator() {
    return (
        <Tab.Navigator screenOptions={premiumTabOptions}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={24} strokeWidth={2.5} />,
                }}
            />
            <Tab.Screen
                name="CreditSimulator"
                component={CreditSimulatorScreen}
                options={{
                    title: 'Simular',
                    tabBarIcon: ({ color, size }) => <Activity color={color} size={24} strokeWidth={2.5} />,
                }}
            />
            <Tab.Screen
                name="MyCredits"
                component={MyCreditsScreen}
                options={{
                    title: 'Créditos',
                    tabBarIcon: ({ color, size }) => <CreditCard color={color} size={24} strokeWidth={2.5} />,
                }}
            />
            <Tab.Screen
                name="ClientProfile"
                component={ProfileScreen}
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => <User color={color} size={24} strokeWidth={2.5} />,
                }}
            />
        </Tab.Navigator>
    );
}

// Client Stack Navigator (for full screen screens)
import CreditDetailsScreen from '../screens/Credit/CreditDetailsScreen';
import InstallmentsCalendarScreen from '../screens/Credit/InstallmentsCalendarScreen';
import PaymentScreen from '../screens/Credit/PaymentScreen';
import PaymentHistoryScreen from '../screens/Credit/PaymentHistoryScreen';

function ClientStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="MainTabs" component={ClientTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="DocumentCenter" component={DocumentCenter} options={{ title: 'Documentos' }} />
            <Stack.Screen name="ContractSigner" component={ContractSigner} options={{ title: 'Assinar Contrato' }} />
            <Stack.Screen name="RequestCredit" component={RequestCreditScreen} options={{ title: 'Solicitar Crédito' }} />
            <Stack.Screen name="CreditDetails" component={CreditDetailsScreen} options={{ title: 'Detalhes do Crédito' }} />
            <Stack.Screen name="InstallmentsCalendarScreen" component={InstallmentsCalendarScreen} options={{ title: 'Calendário de Prestações' }} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ title: 'Pagar Prestação' }} />
            <Stack.Screen name="PaymentHistoryScreen" component={PaymentHistoryScreen} options={{ title: 'Histórico de Pagamentos' }} />
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
