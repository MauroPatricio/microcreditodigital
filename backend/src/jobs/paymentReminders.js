import cron from 'node-cron';
import Installment from '../models/Installment.js';
import Notification from '../models/Notification.js';

// Job para enviar lembretes de pagamento
// Executa diariamente às 10:00 AM
const paymentRemindersJob = cron.schedule('0 10 * * *', async () => {
    try {
        console.log('🔔 Iniciando job de lembretes de pagamento...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parcelas que vencem em 3 dias
        const threeDaysAhead = new Date(today);
        threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

        const upcomingInstallments = await Installment.find({
            status: 'pending',
            dueDate: {
                $gte: threeDaysAhead,
                $lt: new Date(threeDaysAhead.getTime() + 24 * 60 * 60 * 1000)
            }
        }).populate({
            path: 'credit',
            populate: { path: 'client' }
        });

        for (const installment of upcomingInstallments) {
            const client = installment.credit.client;

            await Notification.create({
                user: client._id,
                type: 'payment_reminder',
                title: 'Lembrete de Pagamento',
                message: `Sua parcela ${installment.installmentNumber} de ${installment.totalAmount.toFixed(2)} MT vence em 3 dias (${installment.dueDate.toLocaleDateString()}).`,
                metadata: {
                    installmentId: installment._id,
                    creditId: installment.credit._id,
                    daysUntilDue: 3
                },
                channel: 'push'
            });
        }

        // Parcelas que vencem amanhã
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowInstallments = await Installment.find({
            status: 'pending',
            dueDate: {
                $gte: tomorrow,
                $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
            }
        }).populate({
            path: 'credit',
            populate: { path: 'client' }
        });

        for (const installment of tomorrowInstallments) {
            const client = installment.credit.client;

            await Notification.create({
                user: client._id,
                type: 'payment_reminder',
                title: 'Pagamento Vence Amanhã!',
                message: `Lembre-se: sua parcela ${installment.installmentNumber} de ${installment.totalAmount.toFixed(2)} MT vence amanhã!`,
                metadata: {
                    installmentId: installment._id,
                    creditId: installment.credit._id,
                    daysUntilDue: 1
                },
                channel: 'push'
            });
        }

        console.log(`✅ Lembretes enviados: ${upcomingInstallments.length + tomorrowInstallments.length} notificações`);
    } catch (error) {
        console.error('❌ Erro no job de lembretes:', error.message);
    }
}, {
    scheduled: false
});

export default paymentRemindersJob;
