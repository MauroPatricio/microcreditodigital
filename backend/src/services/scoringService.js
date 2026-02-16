/**
 * scoringService.js
 * Motor de Scoring Automático para Microcrédito
 */

export const calculateScore = async (user, credits = []) => {
    let score = 500; // Base score
    const indicators = {
        paymentHistory: 250,
        incomeScore: 250,
        stabilityScore: 250,
        referenceScore: 250
    };

    // 1. Histórico de Pagamentos (Peso: 40%)
    if (credits.length > 0) {
        const completedCredits = credits.filter(c => c.status === 'paid');
        const defaultedCredits = credits.filter(c => c.status === 'defaulted');

        const successRate = completedCredits.length / credits.length;
        indicators.paymentHistory = Math.round(successRate * 400);

        if (defaultedCredits.length > 0) {
            indicators.paymentHistory -= (defaultedCredits.length * 150);
        }
    } else {
        indicators.paymentHistory = 200; // Neutro para novos clientes
    }

    // 2. Renda e Estabilidade Financeira (Peso: 30%)
    const income = user.professionalInfo?.monthlyIncome || 0;
    if (income > 50000) indicators.incomeScore = 300;
    else if (income > 20000) indicators.incomeScore = 200;
    else if (income > 10000) indicators.incomeScore = 150;
    else indicators.incomeScore = 50;

    const employment = user.professionalInfo?.employmentStatus;
    if (employment === 'employed') indicators.stabilityScore = 300;
    else if (employment === 'self_employed') indicators.stabilityScore = 200;
    else indicators.stabilityScore = 100;

    // 3. Referências e Verificação (Peso: 30%)
    const refCount = user.references?.length || 0;
    indicators.referenceScore = Math.min(refCount * 100, 300);

    if (user.isVerified) indicators.referenceScore += 100;

    // Somatório final (Limitado a 0-1000)
    score = indicators.paymentHistory + indicators.incomeScore + indicators.stabilityScore + indicators.referenceScore;
    score = Math.max(0, Math.min(1000, score));

    let riskLevel = 'high';
    if (score >= 750) riskLevel = 'low';
    else if (score >= 450) riskLevel = 'medium';

    return {
        score,
        riskLevel,
        indicators,
        calculatedAt: new Date()
    };
};

export const getRiskRecommendation = (scoreData) => {
    const { score, riskLevel } = scoreData;

    if (riskLevel === 'low') {
        return {
            recommendation: 'APPROVE',
            message: 'Perfil de baixo risco. Recomendado aprovação rápida.',
            suggestedMultiplier: 1.5 // Pode oferecer 50% a mais do solicitado se dentro dos limites
        };
    } else if (riskLevel === 'medium') {
        return {
            recommendation: 'REVIEW',
            message: 'Risco moderado. Solicitar garantias adicionais ou fiadores.',
            suggestedMultiplier: 1.0
        };
    } else {
        return {
            recommendation: 'REJECT_OR_STRICT_WIZARD',
            message: 'Alto risco detectado. Rejeitar ou limitar valor ao mínimo histórico.',
            suggestedMultiplier: 0.5
        };
    }
};
