/**
 * confidenceService.js
 * Motor de Scoring Automático para Microcrédito (Premium) - Escala 0 a 1000
 */
import { differenceInDays } from 'date-fns';

export const calculateConfidence = async (user, credits = []) => {
    // Métricas Base
    let defaultRate = 0;
    let lateDaysAverage = 0;
    let totalPaidVolume = 0;
    let loanFrequency = credits.length;

    let totalLateDays = 0;
    let lateInstallmentsCount = 0;
    let defaultedCreditsCount = 0;

    // Processar Histórico de Crédito
    credits.forEach(credit => {
        const principalAmount = credit.approvedAmount || credit.amount || 0;
        totalPaidVolume += (credit.totalPaid || 0);

        if (credit.status === 'defaulted' || credit.status === 'cancelled') {
            defaultedCreditsCount++;
        }

        // Se populado com parcelas, ou assumir com base em multas (credit.delayPenalties)
        // Simplificação: Cada 100 MT de multa equivale a ~1 dia de atraso assumido, se parcelas não injetadas
        const assumedLateDays = (credit.delayPenalties || 0) / 100;
        if (assumedLateDays > 0) {
            totalLateDays += assumedLateDays;
            lateInstallmentsCount++;
        }
    });

    if (loanFrequency > 0) {
        defaultRate = (defaultedCreditsCount / loanFrequency) * 100;
        if (lateInstallmentsCount > 0) {
            lateDaysAverage = totalLateDays / lateInstallmentsCount;
        }
    }

    // -- Algoritmo de Score (0 - 1000) --
    // Base inicial para perfis "crus" sem histórico = 500 (Risco Médio)
    let score = 500;

    // Bónus Positivos
    score += (loanFrequency * 30); // Fidelidade: +30 pontos por crédito solicitado/pago
    score += Math.floor(totalPaidVolume / 10000) * 10; // Capacidade: +10 pontos por cada 10.000 MT pagos

    // Punições Severas (Risco)
    score -= (lateDaysAverage * 5); // Pontualidade: -5 pontos por média de dia de atraso
    score -= (defaultRate * 8); // Inadimplência: -8 pontos para cada % de default rate (10% defaults = -80 pts)

    // Limites de Segurança
    if (score > 1000) score = 1000;
    if (score < 0) score = 0;
    score = Math.round(score);

    // Determinar Nível de Confiança e Label
    let confidenceLevel = 1;
    let label = 'Muito Arriscado';

    if (score >= 800) {
        confidenceLevel = 5;
        label = 'Muito Confiável';
    } else if (score >= 600) {
        confidenceLevel = 4;
        label = 'Confiável';
    } else if (score >= 400) {
        confidenceLevel = 3;
        label = 'Moderado';
    } else if (score >= 200) {
        confidenceLevel = 2;
        label = 'Arriscado';
    }

    return {
        score,
        confidenceLevel,
        label,
        metrics: {
            defaultRate: Math.round(defaultRate * 100) / 100,
            lateDaysAverage: Math.round(lateDaysAverage * 100) / 100,
            totalPaidVolume,
            loanFrequency
        },
        lastCalculated: new Date()
    };
};

export const getRiskRecommendation = (confidenceData) => {
    // confidenceData comes from user.riskProfile
    const level = confidenceData.confidenceLevel || 3;
    const score = confidenceData.score || 500;

    if (level === 5) {
        return {
            recommendation: 'APPROVE',
            message: `🌟 Excelente histórico (Score: ${score}). Baixo risco de inadimplência.`,
            maxAmountParams: 1.5,
            interestRateDiscount: 0.1
        };
    } else if (level === 4) {
        return {
            recommendation: 'APPROVE',
            message: `🔵 Cliente estável (Score: ${score}), bom histórico de pagamentos.`,
            maxAmountParams: 1.2,
            interestRateDiscount: 0.05
        };
    } else if (level === 3) {
        return {
            recommendation: 'REVIEW',
            message: `🟡 Risco médio (Score: ${score}). Pode ser aprovado com acompanhamento.`,
            maxAmountParams: 1.0,
            interestRateDiscount: 0
        };
    } else if (level === 2) {
        return {
            recommendation: 'WARN',
            message: `🟠 Cliente com histórico instável (Score: ${score}). Crédito apenas com garantia.`,
            maxAmountParams: 0.7,
            interestRateDiscount: 0
        };
    } else {
        return {
            recommendation: 'REJECT',
            message: `🔴 Alto risco de inadimplência (Score: ${score}). Recusa recomendada.`,
            maxAmountParams: 0,
            interestRateDiscount: 0
        };
    }
};
