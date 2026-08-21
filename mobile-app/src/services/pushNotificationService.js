import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api'; // Assumindo que existe um interceptor axios ou fetch em ./api.js

// Configurar o comportamento das notificações quando a app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Pede permissões e obtém o token do dispositivo
 * @returns {Promise<string|null>} O Expo Push Token ou null se falhar
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Falha ao obter permissão para push notifications!');
      return null;
    }

    // Configurar o projectId
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '00000000-0000-0000-0000-000000000000'; // Fallback valid UUID to avoid crashes in development

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      console.log('Push Token gerado:', token);
    } catch (e) {
      console.error('Erro ao gerar Push Token:', e);
    }
  } else {
    console.warn('Tem de usar um dispositivo físico para Push Notifications (Simuladores não suportam FCM no Expo Go de forma fiável).');
  }

  return token;
}

/**
 * Envia o token para o backend
 * @param {string} token 
 */
export async function updatePushTokenOnServer(token) {
  if (!token) return;
  try {
    // Vamos usar a mesma lógica do api.js que já injeta o Auth Token (Bearer)
    await api.put('/auth/push-token', { pushToken: token });
    console.log('Push token enviado para o servidor com sucesso.');
  } catch (error) {
    console.error('Erro ao enviar push token para o servidor:', error?.response?.data || error.message);
  }
}
