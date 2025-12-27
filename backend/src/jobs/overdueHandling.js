import cron from 'node-cron';
import Installment from '../models/Installment.js';
import Credit from '../models/Credit.js';
import Notification from '../models/Notification.js';

// Job para lidar com parcelas vencidas
// Executa diariamente à meia-noite
const overdueHandlingJob = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('⚠️  Iniciando job de tratamento de parcelas vencidas...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Buscar parcelas vencidas não pagas
        const overdueInstallments = await Installment.find({
            status: { $in: ['pending', 'partially_paid'] },
            dueDate: { $lt: today }
        }).populate({
            path: 'credit',
            populate: { path: 'client' }
        });

        const lateFeePercentage = parseFloat(process.env.LATE_PAYMENT_FEE_PERCENTAGE) || 5;
        let updatedCount = 0;

        for (const installment of overdueInstallments) {
            // Calcular dias de atraso
            const daysPastDue = installment.calculateDaysPastDue();
            installment.daysPastDue = daysPastDue;

            // Atualizar status para overdue
            if (installment.status !== 'overdue') {
                installment.status = 'overdue';
            }

            // Aplicar multa por atraso (5% do valor da parcela)
            if (installment.lateFee === 0) {
                installment.lateFee = (installment.amount * lateFeePercentage) / 100;

                const client = installment.credit.client;

                // Notificar cliente
                await Notification.create({
                    user: client._id,
                    type: 'late_fee_applied',
                    title: 'Multa por Atraso Aplicada',
                    message: `Uma multa de ${installment.lateFee.toFixed(2)} MT foi aplicada à parcela ${installment.installmentNumber} por atraso de ${daysPastDue} dias.`,
                    metadata: {
                        installmentId: installment._id,
                        creditId: installment.credit._id,
                        lateFee: installment.lateFee,
                        daysPastDue
                    },
                    channel: 'push'
                });
            }

            await installment.save();
            updatedCount++;

            // Se mais de 30 dias de atraso, marcar crédito como defaulted
            if (daysPastDue > 30 && installment.credit.status === 'active') {
                const credit = await Credit.findById(installment.credit._id);
                credit.status = 'defaulted';
                await credit.save();

                // Notificar sobre inadimplência
                await Notification.create({
                    user: installment.credit.client._id,
                    type: 'overdue_notice',
                    title: 'Crédito em Inadimplência',
                    message: 'Seu crédito foi marcado como inadimplente devido a atraso superior a 30 dias. Entre em contato urgentemente.',
                    metadata: {
                        creditId: credit._id,
                        daysPastDue
                    },
                    channel: 'push'
                });
            }
        }

        console.log(`✅ Parcelas vencidas processadas: ${updatedCount}`);
    } catch (error) {
        console.error('❌ Erro no job de parcelas vencidas:', error.message);
    }
}, {
    scheduled: false
});

export default overdueHandlingJob;
