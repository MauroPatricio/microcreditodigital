import cron from 'node-cron';
import communicationService from '../services/communicationService.js';
import Installment from '../models/Installment.js';
import CommunicationTemplate from '../models/CommunicationTemplate.js';
import MessageSchedule from '../models/MessageSchedule.js';

/**
 * Job to process the message queue every minute
 */
const messageQueueJob = cron.schedule('* * * * *', async () => {
    try {
        console.log('📬 Processando fila de mensagens...');
        const results = await communicationService.processQueue();
        if (results.length > 0) {
            console.log(`✅ ${results.filter(r => r.success).length} mensagens enviadas, ${results.filter(r => !r.success).length} falhas.`);
        }
    } catch (error) {
        console.error('❌ Erro no processamento da fila:', error.message);
    }
});

/**
 * Job to generate automated reminders
 * Runs daily at 09:00 AM
 */
const automatedRemindersJob = cron.schedule('0 9 * * *', async () => {
    try {
        console.log('🔔 Gerando lembretes automáticos...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Rules: 3 days before, 1 day before, day of, 1 day after, 3 days after, 7 days after
        const rules = [
            { days: 3, type: 'reminder_pre_due', template: 'Lembrete 3 dias antes' },
            { days: 1, type: 'reminder_pre_due', template: 'Lembrete 1 dia antes' },
            { days: 0, type: 'reminder_due', template: 'Aviso Vencimento Hoje' },
            { days: -1, type: 'overdue_notice', template: 'Notificação de Atraso (1 dia)' },
            { days: -3, type: 'overdue_notice', template: 'Notificação de Atraso (3 dias)' },
            { days: -7, type: 'overdue_notice', template: 'Notificação de Atraso (7 dias)' }
        ];

        for (const rule of rules) {
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + rule.days);

            const installments = await Installment.find({
                status: 'pending',
                dueDate: {
                    $gte: targetDate,
                    $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
                }
            }).populate({
                path: 'credit',
                populate: { path: 'client' }
            });

            for (const inst of installments) {
                const client = inst.credit.client;
                if (!client) continue;

                // Check if already scheduled
                const exists = await MessageSchedule.findOne({
                    client: client._id,
                    credit: inst.credit._id,
                    type: 'auto_reminder',
                    metadata: { installmentId: inst._id, ruleDays: rule.days }
                });

                if (exists) continue;

                // Find template
                const template = await CommunicationTemplate.findOne({ name: rule.template });
                const messageText = template ? template.content : `Lembrete de pagamento: Parcela de ${inst.totalAmount} vence em ${inst.dueDate.toLocaleDateString()}.`;

                const personalizedMessage = communicationService.replaceVariables(messageText, {
                    name: client.name,
                    amount: `${inst.totalAmount.toFixed(2)} MT`,
                    date: inst.dueDate.toLocaleDateString()
                });

                // Default channel is WhatsApp if documented, or SMS
                await communicationService.scheduleMessage({
                    clientId: client._id,
                    institutionId: inst.credit.institution,
                    creditId: inst.credit._id,
                    channel: 'whatsapp', // default
                    message: personalizedMessage,
                    type: 'auto_reminder',
                    scheduledFor: new Date(), // send now
                    priority: rule.days <= 0 ? 'high' : 'medium',
                    metadata: { installmentId: inst._id, ruleDays: rule.days }
                });
            }
        }

        console.log('✅ Lembretes automáticos gerados com sucesso.');
    } catch (error) {
        console.error('❌ Erro na geração de lembretes:', error.message);
    }
});

export { messageQueueJob, automatedRemindersJob };
