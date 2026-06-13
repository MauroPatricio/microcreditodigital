import CashTransaction from '../models/CashTransaction.js';
import Institution from '../models/Institution.js';

/**
 * Calcula o saldo atual da instituição com base no saldo inicial configurado
 * e no histórico completo de transações de caixa (entradas e saídas).
 *
 * @param {String|ObjectId} institutionId - ID da Instituição
 * @param {Date} [upToDate=null] - Data limite para calcular o saldo. Se não for passada, calcula até o momento atual.
 * @returns {Promise<Number>} - Saldo atual do caixa
 */
export const getCurrentBalance = async (institutionId, upToDate = null) => {
    // Obter o saldo inicial base configurado na instituição
    const institution = await Institution.findById(institutionId).select('settings.initialBalance');
    const baseInitialBalance = institution?.settings?.initialBalance || 0;

    // Montar o filtro de data, se especificado
    const matchQuery = { institution: institutionId };
    if (upToDate) {
        matchQuery.date = { $lt: upToDate }; // Até a data (exclusivo)
    }

    // Calcular o total de entradas e saídas
    const transactions = await CashTransaction.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalEntradas: {
                    $sum: { $cond: [{ $eq: ['$type', 'entrada'] }, '$amount', 0] }
                },
                totalSaidas: {
                    $sum: { $cond: [{ $eq: ['$type', 'saida'] }, '$amount', 0] }
                }
            }
        }
    ]);

    const totalEntradas = transactions[0]?.totalEntradas || 0;
    const totalSaidas = transactions[0]?.totalSaidas || 0;

    // O saldo atual é o saldo inicial + entradas - saídas
    return baseInitialBalance + totalEntradas - totalSaidas;
};

export default {
    getCurrentBalance
};
