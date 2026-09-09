import qrcode from 'qrcode';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';
import WhatsAppLog from '../models/WhatsAppLog.js';

const require = createRequire(import.meta.url);
const pkg = require('whatsapp-web.js');
const { Client, LocalAuth, MessageMedia } = pkg;

let client = null;
let qrCodeDataUrl = null;
let status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, AUTHENTICATED, READY

const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    let clean = String(phone).replace(/\D/g, '');
    if (clean.length === 9 && (clean.startsWith('84') || clean.startsWith('85') || clean.startsWith('86') || clean.startsWith('87'))) {
        clean = '258' + clean;
    }
    return clean.includes('@c.us') ? clean : `${clean}@c.us`;
};

const initializeClient = async () => {
    if (client) return;

    console.log('Initializing WhatsApp Client...');
    status = 'INITIALIZING';
    qrCodeDataUrl = null;

    try {
        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './.wwebjs_auth'
            }),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                headless: true
            }
        });

        client.on('qr', async (qr) => {
            console.log('📱 WhatsApp QR Code recebido com sucesso!');
            status = 'QR_READY';
            try {
                qrCodeDataUrl = await qrcode.toDataURL(qr);
            } catch (err) {
                console.error('Erro ao gerar URL do QR code', err);
            }
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp Client está pronto e operacional!');
            status = 'READY';
            qrCodeDataUrl = null; // Limpa o QR quando conectado
        });

        client.on('authenticated', () => {
            console.log('🔑 WhatsApp Client autenticado');
            status = 'AUTHENTICATED';
        });

        client.on('auth_failure', msg => {
            console.error('❌ Falha de Autenticação WhatsApp:', msg);
            status = 'DISCONNECTED';
            client = null;
        });

        client.on('disconnected', (reason) => {
            console.log('🔌 WhatsApp Client desconectado:', reason);
            status = 'DISCONNECTED';
            client = null;
            qrCodeDataUrl = null;
        });

        await client.initialize();
    } catch (err) {
        console.error('Erro na inicialização do cliente WhatsApp:', err.message);
        if (err.message && err.message.includes('already in use')) {
            console.error('🚨 ATENÇÃO: Pasta .wwebjs_auth em uso. Tente reiniciar o serviço ou desconectar.');
        }
        status = 'DISCONNECTED';
        client = null;
    }
};

const getStatus = () => {
    return { status, qrCode: qrCodeDataUrl };
};

const sendMessage = async (to, message, metadata = {}) => {
    if (status !== 'READY' && status !== 'AUTHENTICATED') {
        throw new Error('Serviço WhatsApp não está pronto. Escaneie o QR Code no painel administrativo para conectar.');
    }
    const chatId = formatPhoneForWhatsApp(to);
    if (!chatId) {
        throw new Error('Número de telefone inválido para envio do WhatsApp.');
    }

    try {
        const response = await client.sendMessage(chatId, message);

        if (metadata.institutionId) {
            await WhatsAppLog.create({
                institution: metadata.institutionId,
                recipient: to,
                client: metadata.clientId || null,
                credit: metadata.creditId || null,
                installment: metadata.installmentId || null,
                template: metadata.templateId || null,
                message,
                status: 'sent',
                provider: 'whatsapp-web.js',
                providerId: response?.id?.id || null
            }).catch(err => console.error('Error logging WhatsApp message:', err));
        }

        return response;
    } catch (error) {
        console.error('Erro ao enviar mensagem WhatsApp:', error);
        if (metadata.institutionId) {
            await WhatsAppLog.create({
                institution: metadata.institutionId,
                recipient: to,
                client: metadata.clientId || null,
                credit: metadata.creditId || null,
                installment: metadata.installmentId || null,
                template: metadata.templateId || null,
                message,
                status: 'failed',
                error: error.message,
                provider: 'whatsapp-web.js'
            }).catch(err => console.error('Error logging WhatsApp failure:', err));
        }
        throw error;
    }
};

const sendByTemplate = async (templateName, to, data = {}, metadata = {}) => {
    try {
        let template = await WhatsAppTemplate.findOne({ name: templateName, isActive: true });
        let messageText = '';

        if (template && template.body) {
            messageText = template.body;
            if (data.client) {
                messageText = messageText.replace(/\{\{name\}\}|\{client\.name\}|\{nome\}/gi, data.client.name || 'Cliente');
            }
            if (data.amount !== undefined) {
                messageText = messageText.replace(/\{\{amount\}\}|\{amount\}|\{valor\}/gi, `${data.amount} MT`);
            }
            if (data.dueDate) {
                const dateStr = new Date(data.dueDate).toLocaleDateString('pt-MZ');
                messageText = messageText.replace(/\{\{date\}\}|\{dueDate\}|\{data\}/gi, dateStr);
            }
            if (data.installmentNumber) {
                messageText = messageText.replace(/\{\{installmentNumber\}\}|\{parcela\}/gi, String(data.installmentNumber));
            }
            metadata.templateId = template._id;
        } else {
            const clientName = data.client?.name || 'Cliente';
            const amountStr = data.amount !== undefined ? `${data.amount} MT` : '';
            const dateStr = data.dueDate ? new Date(data.dueDate).toLocaleDateString('pt-MZ') : '';
            messageText = `Prezado(a) ${clientName}, lembramos que a sua parcela de ${amountStr} vence em ${dateStr}. Mantenha seus pagamentos em dia.`;
        }

        return await sendMessage(to, messageText, metadata);
    } catch (error) {
        console.error(`Error sending template message [${templateName}] to ${to}:`, error);
        throw error;
    }
};

const sendFile = async (to, buffer, filename, caption = '', mimetype = 'application/pdf') => {
    if (status !== 'READY' && status !== 'AUTHENTICATED') {
        throw new Error('WhatsApp client is not ready');
    }
    const chatId = formatPhoneForWhatsApp(to);

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

const restartClient = async (clearSession = false) => {
    try {
        if (client) {
            await client.destroy().catch(() => {});
            client = null;
        }
    } catch (e) {
        console.error("Erro ao encerrar cliente WhatsApp:", e);
    }
    client = null;
    qrCodeDataUrl = null;
    status = 'INITIALIZING';

    if (clearSession) {
        try {
            const authPath = path.resolve('./.wwebjs_auth');
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log('🧹 Pasta de sessão .wwebjs_auth removida para nova conexão.');
            }
        } catch (err) {
            console.error('Erro ao remover pasta de sessão:', err);
        }
    }

    setTimeout(() => {
        initializeClient();
    }, 1000);

    return { success: true };
};

export default {
    initializeClient,
    getStatus,
    sendMessage,
    sendByTemplate,
    sendFile,
    restartClient,
    formatPhoneForWhatsApp
};
