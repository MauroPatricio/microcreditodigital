import qrcode from 'qrcode';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('whatsapp-web.js');
const { Client, LocalAuth, MessageMedia } = pkg;

let client;
let qrCodeDataUrl = null;
let status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, AUTHENTICATED, READY

const initializeClient = async () => {
    if (client) return;

    console.log('Initializing WhatsApp Client...');
    status = 'INITIALIZING';

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        }
    });

    client.on('qr', async (qr) => {
        console.log('QR Code received');
        status = 'QR_READY';
        try {
            qrCodeDataUrl = await qrcode.toDataURL(qr);
        } catch (err) {
            console.error('Error generating QR code', err);
        }
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        status = 'READY';
        qrCodeDataUrl = null; // Clear QR when ready
    });

    client.on('authenticated', () => {
        console.log('WhatsApp Client authenticated');
        status = 'AUTHENTICATED';
    });

    client.on('auth_failure', msg => {
        console.error('WhatsApp Authentication failure', msg);
        status = 'DISCONNECTED';
    });

    client.on('disconnected', (reason) => {
        console.log('WhatsApp Client disconnected', reason);
        status = 'DISCONNECTED';
        client = null;
    });

    try {
        await client.initialize();
    } catch (err) {
        console.error('Failed to initialize WhatsApp client:', err.message);
        if (err.message.includes('user data directory is already in use')) {
            console.error('🚨 ATENÇÃO: Parece haver outra instância do backend rodando! Por favor, feche outros terminais.');
        }
        status = 'DISCONNECTED';
    }
};

const getStatus = () => {
    return { status, qrCode: qrCodeDataUrl };
};

const sendMessage = async (to, message) => {
    if (status !== 'READY') {
        throw new Error('WhatsApp client is not ready');
    }
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    try {
        const response = await client.sendMessage(chatId, message);
        return response;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
};

const sendFile = async (to, buffer, filename, caption = '', mimetype = 'application/pdf') => {
    if (status !== 'READY') {
        throw new Error('WhatsApp client is not ready');
    }
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;

    try {
        const media = new MessageMedia(
            mimetype,
            buffer.toString('base64'),
            filename
        );
        const response = await client.sendMessage(chatId, media, { caption });
        return response;
    } catch (error) {
        console.error('Error sending WhatsApp file:', error);
        throw error;
    }
};

const restartClient = async () => {
    if (client) {
        await client.destroy();
        client = null;
    }
    initializeClient();
    return { success: true };
};

export default {
    initializeClient,
    getStatus,
    sendMessage,
    sendFile,
    restartClient
};
