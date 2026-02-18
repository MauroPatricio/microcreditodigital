import { addDays, addWeeks, addMonths, startOfDay, isSunday, format } from 'date-fns';

export const calculateSimulation = (amount, term, interestRate, periodicity = 'monthly', startDate = new Date()) => {
    const principal = parseFloat(amount);
    const rate = parseFloat(interestRate) || 0;
    const monthlyRate = rate / 100;
    const numberOfPayments = parseInt(term);

    let installments = [];
    let paymentAmount = 0;

    // 1. Calculate Rate Per Period
    let ratePerPeriod = 0;
    switch (periodicity) {
        case 'daily':
            ratePerPeriod = monthlyRate / 30;
            break;
        case 'weekly':
            ratePerPeriod = monthlyRate / 4;
            break;
        case 'biweekly':
            ratePerPeriod = monthlyRate / 2;
            break;
        case 'monthly':
            ratePerPeriod = monthlyRate;
            break;
        default:
            ratePerPeriod = monthlyRate;
    }

    // 2. Calculate Payment Amount (PMT Formula)
    if (ratePerPeriod > 0) {
        paymentAmount = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, numberOfPayments)) / (Math.pow(1 + ratePerPeriod, numberOfPayments) - 1);
    } else {
        paymentAmount = principal / numberOfPayments;
    }

    // 3. Generate Schedule
    let currentDate = startOfDay(new Date(startDate));
    // Start counting from tomorrow/next period usually

    let remainingBalance = principal;
    let totalInterest = 0;

    // Helper to calculate next date avoiding Sundays/Weekends if needed
    // For MVP, simplistic ADD logic. Daily loans often skip Sundays.
    let lastDate = currentDate;

    for (let i = 1; i <= numberOfPayments; i++) {
        let dueDate;

        if (periodicity === 'monthly') {
            dueDate = addMonths(currentDate, i);
        } else if (periodicity === 'biweekly') {
            dueDate = addDays(currentDate, i * 14);
        } else if (periodicity === 'weekly') {
            dueDate = addWeeks(currentDate, i);
        } else if (periodicity === 'daily') {
            // Logic to skip Sundays:
            // Find next valid day
            let nextDay = addDays(lastDate, 1);
            while (isSunday(nextDay)) {
                nextDay = addDays(nextDay, 1);
            }
            dueDate = nextDay;
            lastDate = nextDay; // Update reference for next iteration
        } else {
            dueDate = addMonths(currentDate, i);
        }

        // Amortization Calc
        let interestPart = remainingBalance * ratePerPeriod;
        let principalPart = paymentAmount - interestPart;

        // Handle last installment rounding differences
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

    return {
        summary: {
            amount: principal,
            totalPayable: Math.round(totalPayable * 100) / 100,
            totalInterest: Math.round(totalInterest * 100) / 100,
            term: numberOfPayments,
            periodicity,
            paymentAmount: Math.round(paymentAmount * 100) / 100,
            interestRate: rate
        },
        schedule: installments
    };
};

export default { calculateSimulation };
