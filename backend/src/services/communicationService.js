import MessageSchedule from '../models/MessageSchedule.js';
import CommunicationTemplate from '../models/CommunicationTemplate.js';
import smsService from './sms.js';
import whatsappService from './whatsappService.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';

class CommunicationService {
    /**
     * Replace variables in a template string
     * Variables: {nome}, {valor}, {data}, {numero_contrato}, {multa}
     */
    replaceVariables(text, data) {
        let result = text;
        const replacements = {
            '{nome}': data.name || '',
            '{valor}': data.amount || '',
            '{data}': data.date || '',
            '{numero_contrato}': data.contractNumber || '',
            '{multa}': data.penalty || '0.00'
        };

        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    }

    /**
     * Schedule a message for later delivery
     */
    async scheduleMessage({ clientId, agentId, institutionId, creditId, channel, message, type, scheduledFor, priority = 'medium' }) {
        try {
            const schedule = await MessageSchedule.create({
                client: clientId,
                agent: agentId,
                institution: institutionId,
                credit: creditId,
                channel,
                message,
                type,
                scheduledFor,
                priority,
                status: 'pending'
            });
            return schedule;
        } catch (error) {
            console.error('Error scheduling message:', error);
            throw error;
        }
    }

    /**
     * Send a message immediately and log it
     */
    async sendImmediate({ clientId, agentId, institutionId, creditId, channel, message, type }) {
        const schedule = await this.scheduleMessage({
            clientId, agentId, institutionId, creditId, channel, message, type,
            scheduledFor: new Date()
        });
        return this.processMessage(schedule);
    }

    /**
     * Process a single scheduled message
     */
    async processMessage(schedule) {
        try {
            const client = await User.findById(schedule.client);
            if (!client || !client.phone) {
                throw new Error('Client not found or phone missing');
            }

            let result;
            if (schedule.channel === 'whatsapp') {
                result = await whatsappService.sendMessage(client.phone, schedule.message);
            } else {
                // smsService.sendSMS returns { success, to, message }
                result = await smsService.sendSMS(
                    client.phone,
                    schedule.message,
                    schedule.type,
                    schedule.institution,
                    schedule.agent,
                    schedule.credit
                );
            }

            schedule.status = 'sent';
            schedule.sentAt = new Date();
            await schedule.save();
            return { success: true, schedule };
        } catch (error) {
            console.error(`Failed to process message ${schedule._id}:`, error.message);
            schedule.status = 'failed';
            schedule.error = error.message;
            await schedule.save();
            return { success: false, error: error.message };
        }
    }

    /**
     * Process all pending messages due now
     */
    async processQueue() {
        const now = new Date();
        const pending = await MessageSchedule.find({
            status: 'pending',
            scheduledFor: { $lte: now }
        }).sort({ priority: -1, scheduledFor: 1 }).limit(50);

        const results = [];
        for (const schedule of pending) {
            results.push(await this.processMessage(schedule));
        }
        return results;
    }

    /**
     * Create default templates if they don't exist
     */
    async seedTemplates(institutionId = null) {
        const defaults = [
            {
                name: 'Lembrete 3 dias antes',
                content: 'Prezado(a) {nome}, informamos que seu pagamento de {valor} vence em 3 dias ({data}). Evite multas e mantenha seu crédito em dia.',
                type: 'reminder_pre_due',
                variables: ['nome', 'valor', 'data']
            },
            {
                name: 'Lembrete 1 dia antes',
                content: 'Olá {nome}, lembramos que sua parcela de {valor} vence amanhã ({data}). Garanta o pagamento para manter seu histórico positivo.',
                type: 'reminder_pre_due',
                variables: ['nome', 'valor', 'data']
            },
            {
                name: 'Aviso Vencimento Hoje',
                content: '⚠️ Atenção {nome}: Seu pagamento de {valor} vence hoje ({data}). Realize o pagamento via M-Pesa ou E-Mola para evitar encargos.',
                type: 'reminder_due',
                variables: ['nome', 'valor', 'data']
            },
            {
                name: 'Notificação de Atraso (1 dia)',
                content: 'Prezado(a) {nome}, seu pagamento de {valor} venceu ontem. Por favor, regularize sua situação para evitar a suspensão de novos créditos.',
                type: 'overdue_notice',
                variables: ['nome', 'valor', 'data']
            },
            {
                name: 'Notificação de Atraso (3 dias)',
                content: 'Aviso de Multa: {nome}, seu pagamento de {valor} está atrasado há 3 dias. Multas foram aplicadas. Valor atualizado: {multa}. Regularize agora.',
                type: 'overdue_notice',
                variables: ['nome', 'valor', 'multa']
            },
            {
                name: 'Notificação de Atraso (7 dias)',
                content: '🚨 NOTIFICAÇÃO GRAVE: {nome}, seu débito de {valor} está com 7 dias de atraso. Seu nome poderá ser incluído em restrição de crédito. Entre em contato urgente.',
                type: 'overdue_notice',
                variables: ['nome', 'valor']
            },
            {
                name: 'Confirmação de Pagamento',
                content: '✅ Pagamento de {valor} recebido com sucesso. Obrigado pela confiança, {nome}. Seu crédito continua disponível.',
                type: 'payment_confirmation',
                variables: ['nome', 'valor']
            }
        ];

        for (const tpl of defaults) {
            await CommunicationTemplate.findOneAndUpdate(
                { name: tpl.name, institution: institutionId },
                { ...tpl, institution: institutionId },
                { upsert: true, new: true }
            );
        }
    }
}

export default new CommunicationService();
