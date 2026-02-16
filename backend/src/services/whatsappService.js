import WhatsAppLog from '../models/WhatsAppLog.js';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';

/**
 * Serviço de integração com WhatsApp
 * Camada desacoplada para suportar múltiplos provedores (Twilio, Meta APIs, etc)
 */
class WhatsAppService {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || 'simulated';
        this.initialized = false;

        console.log(`✅ WhatsApp Service em modo: ${this.provider}`);
    }

    /**
     * Parse do template com dados dinâmicos
     */
    parseTemplate(body, data) {
        let parsed = body;
        const placeholders = {
            '{{name}}': data.client?.name || 'Cliente',
            '{{amount}}': this.formatCurrency(data.amount || 0),
            '{{date}}': data.dueDate ? new Date(data.dueDate).toLocaleDateString() : '',
            '{{institution}}': data.institution?.name || 'Nossa Instituição',
            '{{contract}}': data.contractNumber || '',
            '{{installment}}': data.installmentNumber || ''
        };

        Object.keys(placeholders).forEach(key => {
            parsed = parsed.replace(new RegExp(key, 'g'), placeholders[key]);
        });

        return parsed;
    }

    /**
     * Enviar mensagem genérica
     */
    async sendMessage(to, message, metadata = {}) {
        let status = 'sent';
        let error = null;

        try {
            // Lógica de envio real aqui (integração com API externa)
            console.log(`🟢 [WHATSAPP ${this.provider.toUpperCase()}] para ${to}: ${message}`);

            // Registrar no log
            await WhatsAppLog.create({
                institution: metadata.institutionId,
                recipient: to,
                client: metadata.clientId,
                credit: metadata.creditId,
                installment: metadata.installmentId,
                template: metadata.templateId,
                message,
                status,
                provider: this.provider,
                metadata: metadata.extra
            });

            return { success: true, status };
        } catch (err) {
            console.error(`❌ Erro ao enviar WhatsApp: ${err.message}`);

            await WhatsAppLog.create({
                institution: metadata.institutionId,
                recipient: to,
                client: metadata.clientId,
                message,
                status: 'failed',
                error: err.message
            }).catch(() => { });

            return { success: false, error: err.message };
        }
    }

    /**
     * Enviar usando um template específico
     */
    async sendByTemplate(templateName, recipient, data, metadata = {}) {
        try {
            const template = await WhatsAppTemplate.findOne({
                institution: metadata.institutionId,
                name: templateName,
                isActive: true
            });

            if (!template) {
                console.warn(`⚠️ Template ${templateName} não encontrado ou inativo`);
                return { success: false, error: 'Template not found' };
            }

            const message = this.parseTemplate(template.body, data);

            return this.sendMessage(recipient, message, {
                ...metadata,
                templateId: template._id
            });
        } catch (error) {
            console.error('Erro ao buscar template/enviar:', error);
            return { success: false, error: error.message };
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    }
}

export default new WhatsAppService();
