import admin from 'firebase-admin';

/**
 * Serviço de notificações push via Firebase Cloud Messaging
 */

class PushNotificationService {
    constructor() {
        this.initialized = false;
        this.initializeFirebase();
    }

    initializeFirebase() {
        try {
            if (!process.env.FIREBASE_PROJECT_ID) {
                console.warn('⚠️  Firebase não configurado. Push notifications desabilitadas.');
                return;
            }

            const serviceAccount = {
                type: 'service_account',
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL
            };

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }

            this.initialized = true;
            console.log('✅ Firebase inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar Firebase:', error.message);
            this.initialized = false;
        }
    }

    /**
     * Enviar notificação push para um dispositivo
     * @param {string} token - Token FCM do dispositivo
     * @param {Object} notification - Dados da notificação
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendToDevice(token, notification) {
        if (!this.initialized) {
            return { success: false, error: 'Firebase não inicializado' };
        }

        try {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: notification.metadata || {},
                token: token
            };

            const response = await admin.messaging().send(message);

            return {
                success: true,
                messageId: response
            };
        } catch (error) {
            console.error('Erro ao enviar push notification:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enviar notificação para múltiplos dispositivos
     * @param {Array<string>} tokens - Array de tokens FCM
     * @param {Object} notification - Dados da notificação
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendToMultipleDevices(tokens, notification) {
        if (!this.initialized) {
            return { success: false, error: 'Firebase não inicializado' };
        }

        try {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: notification.metadata || {},
                tokens: tokens
            };

            const response = await admin.messaging().sendMulticast(message);

            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
                responses: response.responses
            };
        } catch (error) {
            console.error('Erro ao enviar push notifications:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enviar notificação para um tópico
     * @param {string} topic - Nome do tópico
     * @param {Object} notification - Dados da notificação
     * @returns {Promise<Object>} - Resultado do envio
     */
    async sendToTopic(topic, notification) {
        if (!this.initialized) {
            return { success: false, error: 'Firebase não inicializado' };
        }

        try {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.message
                },
                data: notification.metadata || {},
                topic: topic
            };

            const response = await admin.messaging().send(message);

            return {
                success: true,
                messageId: response
            };
        } catch (error) {
            console.error('Erro ao enviar push notification para tópico:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new PushNotificationService();
