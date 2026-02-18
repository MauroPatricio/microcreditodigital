/**
 * scoringService.js
 * Motor de Scoring Automático para Microcrédito (Premium)
 */

export const calculateScore = async (user, credits = []) => {
    let score = 0;
    const indicators = {
        paymentHistory: 0,    // 40% (Max 400)
        financialStability: 0, // 30% (Max 300)
        demographics: 0,      // 20% (Max 200)
        relationship: 0       // 10% (Max 100)
    };

    // 1. PAYMENT HISTORY (Max 400)
    if (credits.length > 0) {
        const completedCredits = credits.filter(c => c.status === 'paid');
        const activeCredits = credits.filter(c => c.status === 'active' || c.status === 'approved');
        const defaultedCredits = credits.filter(c => c.status === 'defaulted' || c.status === 'cancelled');

        // Taxa de Sucesso (Max 150)
        const successRate = completedCredits.length / credits.length;
        indicators.paymentHistory += Math.round(successRate * 150);

        // Pontualidade (Max 150)
        let totalDelayDays = 0;
        let onTimePayments = 0;
        // Simulação de verificação de atrasos (em produção viria da tabela Installments)
        // Se status é paid, assumimos pontualidade por enquanto se não houver dados detalhados
        indicators.paymentHistory += 100;

        // Penalidade por Incumprimento (Max -400)
        if (defaultedCredits.length > 0) {
            indicators.paymentHistory -= (defaultedCredits.length * 100);
        }

        // Volume de Crédito (Max 100)
        const totalBorrowed = credits.reduce((acc, c) => acc + (c.approvedAmount || 0), 0);
        if (totalBorrowed > 100000) indicators.paymentHistory += 100;
        else if (totalBorrowed > 50000) indicators.paymentHistory += 75;
        else if (totalBorrowed > 10000) indicators.paymentHistory += 50;

    } else {
        indicators.paymentHistory = 200; // Pontuação neutra para novos clientes ("Credit Builder")
    }

    // Garantir limites
    indicators.paymentHistory = Math.max(0, Math.min(400, indicators.paymentHistory));


    // 2. FINANCIAL STABILITY (Max 300)
    const income = user.professionalInfo?.monthlyIncome || 0;
    const employment = user.professionalInfo?.employmentStatus;

    // Renda (Max 150)
    if (income > 50000) indicators.financialStability += 150;
    else if (income > 25000) indicators.financialStability += 120;
    else if (income > 10000) indicators.financialStability += 80;
    else if (income > 5000) indicators.financialStability += 40;

    // Tipo de Emprego (Max 150)
    if (employment === 'civil_servant') indicators.financialStability += 175; // Altíssima estabilidade
    else if (employment === 'employed') indicators.financialStability += 150; // Funcionário público/privado estável
    else if (employment === 'self_employed') indicators.financialStability += 100;
    else if (employment === 'retired') indicators.financialStability += 120; // Pensionista
    else if (employment === 'student') indicators.financialStability += 50;
    else indicators.financialStability += 20;


    // 3. DEMOGRAPHICS (Max 200)
    const residenceType = user.demographics?.residenceType;
    const yearsInResidence = user.demographics?.yearsInResidence || 0;
    const education = user.demographics?.educationLevel;

    // Residência (Max 100)
    if (residenceType === 'owned') indicators.demographics += 100; // Casa própria = estabilidade
    else if (residenceType === 'family') indicators.demographics += 80;
    else if (residenceType === 'rented') {
        if (yearsInResidence > 2) indicators.demographics += 60;
        else indicators.demographics += 40;
    }

    // Educação (Max 50)
    if (['university', 'post_grad'].includes(education)) indicators.demographics += 50;
    else if (education === 'secondary') indicators.demographics += 30;
    else indicators.demographics += 10;

    // Idade/Experiência (Max 50)
    const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
    if (age > 30 && age < 60) indicators.demographics += 50;
    else if (age >= 18) indicators.demographics += 30;


    // 4. RELATIONSHIP / VERIFICATION (Max 100)
    if (user.isVerified) indicators.relationship += 50;
    if (user.documents && user.documents.length >= 2) indicators.relationship += 30; // BI + NUIT
    if (user.references && user.references.length >= 2) indicators.relationship += 20;


    // SCORE FINAL
    score = indicators.paymentHistory + indicators.financialStability + indicators.demographics + indicators.relationship;
    score = Math.max(0, Math.min(1000, score));

    // Níveis de Risco
    let riskLevel = 'critical';
    if (score >= 800) riskLevel = 'low';          // Aprovado Automático
    else if (score >= 600) riskLevel = 'medium';  // Análise Humana
    else if (score >= 400) riskLevel = 'high';    // Requer Garantias Fortes

    return {
        score,
        riskLevel,
        breakdown: indicators,
        calculatedAt: new Date()
    };
};

export const getRiskRecommendation = (scoreData) => {
    const { score, riskLevel } = scoreData;

    if (riskLevel === 'low') {
        return {
            recommendation: 'APPROVE',
            message: '🌟 Cliente Premium. Aprovação imediata recomendada.',
            maxAmountParams: 1.5, // Pode pedir 50% a mais
            interestRateDiscount: 0.1 // 10% de desconto na taxa
        };
    } else if (riskLevel === 'medium') {
        return {
            recommendation: 'REVIEW',
            message: '⚠️ Risco Moderado. Verificar taxa de esforço.',
            maxAmountParams: 1.0,
            interestRateDiscount: 0
        };
    } else if (riskLevel === 'high') {
        return {
            recommendation: 'WARN',
            message: '🛑 Risco Elevado. Exigir garantias reais (veículo/imóvel).',
            maxAmountParams: 0.7, // Limitar a 70% do pedido
            interestRateDiscount: 0
        };
    } else {
        return {
            recommendation: 'REJECT',
            message: '⛔ Risco Crítico. Histórico de incumprimento ou instabilidade.',
            maxAmountParams: 0,
            interestRateDiscount: 0
        };
    }
};
