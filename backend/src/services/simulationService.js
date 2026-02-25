import { addDays, addWeeks, addMonths, startOfDay, isSunday, format } from 'date-fns';

/**
 * Calcula a simulação de crédito com suporte a termos flexíveis (dias, semanas, meses).
 * @param {number} amount Valor principal
 * @param {number} term Número de períodos
 * @param {number} interestRate Taxa de juros (%) por período selecionado
 * @param {string} periodicity 'daily', 'weekly', 'biweekly', 'monthly'
 * @param {Date} startDate Data de início
 */
export const calculateSimulation = (amount, term, interestRate, periodicity = 'monthly', startDate = new Date()) => {
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate) || 0;
    const ratePerPeriod = rate / 100;
    const numberOfPayments = parseInt(term);

    let installments = [];
    let paymentAmount = 0;

    // PMT Formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
    if (ratePerPeriod > 0) {
        paymentAmount = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfPayments)) / (Math.pow(1 + ratePerPeriod, numberOfPayments) - 1);
    } else {
        paymentAmount = principal / numberOfPayments;
    }

    let currentDate = startOfDay(new Date(startDate));
    let lastDate = currentDate;
    let remainingBalance = principal;
    let totalInterest = 0;

    for (let i = 1; i <= numberOfPayments; i++) {
        let dueDate;

        if (periodicity === 'monthly') {
            dueDate = addMonths(currentDate, i);
        } else if (periodicity === 'biweekly') {
            dueDate = addDays(currentDate, i * 14);
        } else if (periodicity === 'weekly') {
            dueDate = addWeeks(currentDate, i);
        } else if (periodicity === 'daily') {
            // Pular domingos para simulações diárias
            let nextDay = addDays(lastDate, 1);
            while (isSunday(nextDay)) {
                nextDay = addDays(nextDay, 1);
            }
            dueDate = nextDay;
            lastDate = nextDay;
        } else {
            dueDate = addMonths(currentDate, i);
        }

        let interestPart = remainingBalance * ratePerPeriod;
        let principalPart = paymentAmount - interestPart;

        if (i === numberOfPayments) {
            principalPart = remainingBalance;
            paymentAmount = principalPart + interestPart;
        }

        remainingBalance -= principalPart;
        if (remainingBalance < 0) remainingBalance = 0;

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

    // Explicação textual
    const periodLabel = periodicity === 'daily' ? 'dia' : periodicity === 'weekly' ? 'semana' : periodicity === 'biweekly' ? 'quinzena' : 'mês';
    const explanation = `Simulação de ${principal.toLocaleString()} MT com taxa de ${rate}% ao ${periodLabel}, paga em ${numberOfPayments} parcelas.`;

    return {
        summary: {
            amount: principal,
            totalPayable: Math.round(totalPayable * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            term: numberOfPayments,
            periodicity,
            paymentAmount: Math.round(paymentAmount * 100) / 100,
            interestRate: rate,
            explanation,
            endDate,
            formattedEndDate: endDate ? format(endDate, 'dd/MM/yyyy') : null
        },
        schedule: installments
    };
};

export default { calculateSimulation };
