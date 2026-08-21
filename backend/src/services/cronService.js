import cron from 'node-cron';
import Installment from '../models/Installment.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import CommunicationTemplate from '../models/CommunicationTemplate.js';
import communicationService from './communicationService.js';
import { differenceInDays, startOfDay } from 'date-fns';

class CronService {
    constructor() {
        this.dailyJob = null;
        this.queueJob = null;
    }

    start() {
        console.log('[CronService] A iniciar serviços de agendamento automático...');

        // 1. Job Diário (Corre todos os dias às 08:00)
        // Expressão: '0 8 * * *'
        this.dailyJob = cron.schedule('0 8 * * *', async () => {
            console.log('[CronService] A executar a rotina diária de avaliação de carteira e subscrições...');
            try {
                await this.processDailyCollectionRules();
                await this.processExpiredSubscriptions();
            } catch (error) {
                console.error('[CronService] Erro na rotina diária:', error);
            }
        });

        // 2. Job de Fila (Corre a cada minuto)
        // Expressão: '* * * * *'
        this.queueJob = cron.schedule('* * * * *', async () => {
            try {
                await communicationService.processQueue();
            } catch (error) {
                console.error('[CronService] Erro no processamento da fila de mensagens:', error);
            }
        });

        console.log('[CronService] Serviços iniciados com sucesso.');
    }

    async processDailyCollectionRules() {
        const now = startOfDay(new Date());
        
        // Buscar todas as parcelas "pendentes" ou "atrasadas" que não estão pagas
        const activeInstallments = await Installment.find({ status: { $in: ['pending', 'overdue'] } })
            .populate({ path: 'credit', populate: { path: 'client institution' } });

        for (const inst of activeInstallments) {
            if (!inst.credit || !inst.credit.client || !inst.credit.client.phone) continue;

            const client = inst.credit.client;
            const dueDate = startOfDay(new Date(inst.dueDate));
            const diffDays = differenceInDays(dueDate, now);

            // Cálculo de Multas Automáticas (Agravamento)
            let updated = false;
            if (diffDays < 0) {
                const daysPastDue = Math.abs(diffDays);
                const penaltyRate = (inst.credit.institution.settings?.interestRates?.penaltyRate || 1) / 100;
                // Multa: Valor Original * (Taxa de Mora / 100) * Dias de Atraso
                const newLateFee = inst.amount * penaltyRate * daysPastDue;
                
                if (inst.lateFee !== newLateFee || inst.status !== 'overdue') {
                    inst.lateFee = newLateFee;
                    inst.status = 'overdue';
                    inst.daysPastDue = daysPastDue;
                    await inst.save(); // A trigger pre-save do modelo vai recalcular o totalAmount
                    updated = true;
                }
            }

            const amountLeft = (inst.totalAmount - (inst.paidAmount || 0)).toFixed(2);
            const templateData = {
                name: client.name,
                amount: `${amountLeft} MT`,
                date: new Date(inst.dueDate).toLocaleDateString('pt-MZ'),
                contractNumber: inst.credit.loanNumber || 'N/A',
                penalty: (inst.lateFee || 0).toFixed(2) + ' MT'
            };

            let templateType = null;
            let priority = 'medium';

            // Regras de Negócio baseadas nas configurações da Instituição
            const notificationSettings = inst.credit.institution.settings?.notificationSettings || {
                remindersBeforeDue: [7, 3, 1],
                remindOnDueDate: true,
                remindAfterDue: true,
                channels: { push: true, email: true, sms: false, whatsapp: true }
            };

            const remindersBeforeDue = notificationSettings.remindersBeforeDue || [7, 3, 1];

            if (diffDays > 0 && remindersBeforeDue.includes(diffDays)) {
                templateType = 'reminder_pre_due';
            } else if (diffDays === 0 && notificationSettings.remindOnDueDate) {
                templateType = 'reminder_due';
                priority = 'high';
            } else if (diffDays < 0 && notificationSettings.remindAfterDue) {
                // Notificar em certos intervalos após atraso
                if (diffDays === -1 || diffDays === -3 || diffDays === -7) {
                    templateType = 'overdue_notice';
                    priority = 'critical';
                }
            }

            if (templateType) {
                await this.dispatchMessage(inst.credit, client, templateType, templateData, priority, notificationSettings.channels);
            }
        }
    }

    async processExpiredSubscriptions() {
        try {
            console.log('[CronService] A verificar subscrições expiradas...');
            const now = new Date();
            
            // Find all active institutions that have a subscription active but past the expiration date
            const result = await Institution.updateMany(
                {
                    'subscription.status': 'active',
                    'subscription.expiresAt': { $lt: now }
                },
                {
                    $set: { 'subscription.status': 'expired' }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[CronService] ${result.modifiedCount} instituições tiveram as suas subscrições marcadas como expiradas.`);
            }
        } catch (error) {
            console.error('[CronService] Erro ao processar subscrições expiradas:', error);
        }
    }

    async dispatchMessage(credit, client, templateType, data, priority, channels) {
        // Encontra o template mais adequado para a instituição e o tipo
        let template = await CommunicationTemplate.findOne({ 
            institution: credit.institution._id, 
            type: templateType 
        });

        // Fallback genérico caso a instituição não tenha personalizado
        if (!template) {
            template = await CommunicationTemplate.findOne({ institution: null, type: templateType });
        }

        if (!template) {
            console.warn(`[CronService] Nenhum template encontrado para o tipo ${templateType}`);
            return;
        }

        const messageContent = communicationService.replaceVariables(template.content, data);
        
        // Push Notification Firebase
        if (channels && channels.push && client.pushToken) {
            const pushNotificationService = (await import('./pushNotification.js')).default;
            await pushNotificationService.sendToDevice(client.pushToken, {
                title: templateType.includes('overdue') ? 'Pagamento em Atraso' : 'Lembrete de Pagamento',
                message: messageContent,
                metadata: {
                    type: templateType,
                    creditId: credit._id.toString()
                }
            });
        }

        // WhatsApp / SMS via Communication Queue
        let channelToUse = 'whatsapp';
        if (channels) {
            if (channels.whatsapp) channelToUse = 'whatsapp';
            else if (channels.sms) channelToUse = 'sms';
            else if (channels.email) channelToUse = 'email';
        }

        await communicationService.scheduleMessage({
            clientId: client._id,
            agentId: credit.agent || null,
            institutionId: credit.institution._id,
            creditId: credit._id,
            channel: channelToUse,
            message: messageContent,
            type: templateType,
            scheduledFor: new Date(),
            priority: priority
        });
    }
}

export default new CronService();
