import { addDays, addWeeks, addMonths, startOfDay, isSunday, format } from 'date-fns';

import Simulation from '../models/Simulation.js';

/**
 * Calcula a simulação de crédito com suporte a termos flexíveis e múltiplos de amortização.
 * @param {number} amount Valor principal
 * @param {number} term Número de períodos
 * @param {number} interestRate Taxa de juros (%) por período selecionado
 * @param {string} periodicity 'daily', 'weekly', 'biweekly', 'monthly'
 * @param {Date} startDate Data de início
 * @param {string} amortizationType 'price', 'sac', 'flat', 'simples', 'composto'
 */
export const calculateSimulation = (amount, term, interestRate, periodicity = 'monthly', startDate = new Date(), amortizationType = 'price') => {
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate) || 0;
    const ratePerPeriod = rate / 100;
    const numberOfPayments = parseInt(term);

    let installments = [];
    let currentDate = startOfDay(new Date(startDate));
    let lastDate = currentDate;
    let remainingBalance = principal;
    let totalInterest = 0;

    // Variáveis pré-calculadas dependendo do tipo
    let fixedPaymentAmount = 0;
    let fixedPrincipalPart = 0;
    let fixedInterestPart = 0;

    if (ratePerPeriod > 0) {
        if (amortizationType === 'price' || !amortizationType) {
            // PMT Formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
            fixedPaymentAmount = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfPayments)) / (Math.pow(1 + ratePerPeriod, numberOfPayments) - 1);
        } else if (amortizationType === 'sac') {
            fixedPrincipalPart = principal / numberOfPayments;
        } else if (amortizationType === 'flat' || amortizationType === 'simples') {
            // Juros Simples/Flat: J = P * i * n
            const totalJuros = principal * ratePerPeriod * numberOfPayments;
            fixedInterestPart = totalJuros / numberOfPayments;
            fixedPrincipalPart = principal / numberOfPayments;
            fixedPaymentAmount = fixedPrincipalPart + fixedInterestPart;
        } else if (amortizationType === 'composto') {
            // Juros Compostos: M = P * (1 + i)^n
            const montante = principal * Math.pow(1 + ratePerPeriod, numberOfPayments);
            const totalJuros = montante - principal;
            fixedInterestPart = totalJuros / numberOfPayments;
            fixedPrincipalPart = principal / numberOfPayments;
            fixedPaymentAmount = fixedPrincipalPart + fixedInterestPart;
        }
    } else {
        fixedPaymentAmount = principal / numberOfPayments;
        fixedPrincipalPart = principal / numberOfPayments;
        fixedInterestPart = 0;
    }

    for (let i = 1; i <= numberOfPayments; i++) {
        let dueDate;

        if (periodicity === 'monthly') {
            dueDate = addMonths(currentDate, i);
        } else if (periodicity === 'biweekly') {
            dueDate = addDays(currentDate, i * 14);
        } else if (periodicity === 'weekly') {
            dueDate = addWeeks(currentDate, i);
        } else if (periodicity === 'daily') {
            let nextDay = addDays(lastDate, 1);
            while (isSunday(nextDay)) {
                nextDay = addDays(nextDay, 1);
            }
            dueDate = nextDay;
            lastDate = nextDay;
        } else {
            dueDate = addMonths(currentDate, i);
        }

        let principalPart = 0;
        let interestPart = 0;
        let paymentAmount = 0;

        if (ratePerPeriod > 0) {
            if (amortizationType === 'price' || !amortizationType) {
                interestPart = remainingBalance * ratePerPeriod;
                principalPart = fixedPaymentAmount - interestPart;
                paymentAmount = fixedPaymentAmount;
            } else if (amortizationType === 'sac') {
                principalPart = fixedPrincipalPart;
                interestPart = remainingBalance * ratePerPeriod;
                paymentAmount = principalPart + interestPart;
            } else {
                // flat, simples, composto
                principalPart = fixedPrincipalPart;
                interestPart = fixedInterestPart;
                paymentAmount = fixedPaymentAmount;
            }
        } else {
            principalPart = fixedPrincipalPart;
            interestPart = 0;
            paymentAmount = fixedPaymentAmount;
        }

        // Correção de rounding na última parcela
        if (i === numberOfPayments) {
            principalPart = remainingBalance;
            paymentAmount = principalPart + interestPart;
        }

        remainingBalance -= principalPart;
        if (remainingBalance < 0.01) remainingBalance = 0;

        totalInterest += interestPart;

        installments.push({
            number: i,
            dueDate: dueDate,
            formattedDate: format(dueDate, 'dd/MM/yyyy'),
            amount: Math.round(paymentAmount * 100) / 100,
            principal: Math.round(principalPart * 100) / 100,
            interest: Math.round(interestPart * 100) / 100,
            balance: Math.round(remainingBalance * 100) / 100
        });
    }

    const totalPayable = installments.reduce((acc, curr) => acc + curr.amount, 0);
    const endDate = installments.length > 0 ? installments[installments.length - 1].dueDate : null;

    const periodLabel = periodicity === 'daily' ? 'dia' : periodicity === 'weekly' ? 'semana' : periodicity === 'biweekly' ? 'quinzena' : 'mês';
    const typeLabel = amortizationType.toUpperCase();
    const explanation = `Simulação de ${principal.toLocaleString()} MT com taxa de ${rate}% ao ${periodLabel} (${typeLabel}), paga em ${numberOfPayments} parcelas.`;

    // Para metadados/exibição
    let firstPaymentAmount = installments.length > 0 ? installments[0].amount : 0;

    return {
        summary: {
            amount: principal,
            totalPayable: Math.round(totalPayable * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            term: numberOfPayments,
            periodicity,
            paymentAmount: Math.round(firstPaymentAmount * 100) / 100, // SAC it changes, so we show the first
            interestRate: rate,
            amortizationType,
            explanation,
            endDate,
            formattedEndDate: endDate ? format(endDate, 'dd/MM/yyyy') : null
        },
        schedule: installments
    };
};

/**
 * Salva uma simulação no banco de dados
 */
export const saveSimulation = async (data, user) => {
    const simulation = new Simulation({
        ...data,
        institution: user.institution._id,
        agent: user._id
    });
    return await simulation.save();
};

/**
 * Busca uma simulação pelo ID com populado
 */
export const getSimulationById = async (id) => {
    return await Simulation.findById(id).populate('institution').populate('agent').populate('client');
};

export default { calculateSimulation, saveSimulation, getSimulationById };
