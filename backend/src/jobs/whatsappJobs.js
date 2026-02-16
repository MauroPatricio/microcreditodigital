import cron from 'node-cron';
import Installment from '../models/Installment.js';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';
import WhatsAppService from '../services/whatsappService.js';

/**
 * Job para processar notificações automáticas de WhatsApp
 * Executa às 09:00 AM diariamente
 */
const whatsappJobs = cron.schedule('0 9 * * *', async () => {
    try {
        console.log('🤖 Processando notificações WhatsApp agendadas...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Buscar todos os templates ativos com gatilhos automáticos
        const activeTemplates = await WhatsAppTemplate.find({
            isActive: true,
            triggerType: { $in: ['before_due', 'on_due_date', 'after_due'] }
        });

        for (const template of activeTemplates) {
            const targetDate = new Date(today);

            // Ajustar data alvo baseada no triggerDays
            // Ex: if triggerType is 'before_due' and triggerDays is 3, we look for installments due in 3 days.
            targetDate.setDate(targetDate.getDate() + (template.triggerDays || 0));

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

            console.log(`   - Template [${template.name}]: ${installments.length} parcelas encontradas para data ${targetDate.toLocaleDateString()}`);

            for (const installment of installments) {
                const client = installment.credit.client;
                if (!client.phone) continue;

                await WhatsAppService.sendByTemplate(template.name, client.phone, {
                    client,
                    amount: installment.totalAmount,
                    dueDate: installment.dueDate,
                    installmentNumber: installment.installmentNumber,
                    institution: template.institution // Em um ambiente real, popularíamos isso adequadamente
                }, {
                    institutionId: template.institution,
                    clientId: client._id,
                    creditId: installment.credit._id,
                    installmentId: installment._id
                });
            }
        }

        console.log('✅ Processamento de WhatsApp concluído.');
    } catch (error) {
        console.error('❌ Erro no automação de WhatsApp:', error);
    }
}, {
    scheduled: false
});

export default whatsappJobs;
