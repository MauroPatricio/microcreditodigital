const cron = require('node-cron');
const Credit = require('../models/Credit');
const Installment = require('../models/Installment');

// Job para cálculo automático de juros
// Executa diariamente à 01:00 AM
const interestCalculationJob = cron.schedule('0 1 * * *', async () => {
    try {
        console.log('💰 Iniciando job de cálculo de juros...');

        const activeCredits = await Credit.find({ status: 'active' });

        for (const credit of activeCredits) {
            // Buscar parcelas pendentes
            const pendingInstallments = await Installment.find({
                credit: credit._id,
                status: { $in: ['pending', 'partially_paid', 'overdue'] }
            });

            // Atualizar informações do crédito
            const totalPending = pendingInstallments.reduce((sum, inst) => {
                return sum + (inst.totalAmount - inst.paidAmount);
            }, 0);

            // Logs para acompanhamento
            console.log(`   Crédito ${credit._id}: ${pendingInstallments.length} parcelas pendentes, total: ${totalPending.toFixed(2)} MT`);
        }

        console.log(`✅ Cálculo de juros concluído para ${activeCredits.length} créditos ativos`);
    } catch (error) {
        console.error('❌ Erro no job de cálculo de juros:', error.message);
    }
}, {
    scheduled: false
});

module.exports = interestCalculationJob;
