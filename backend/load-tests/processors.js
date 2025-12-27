export function generateRandomUser(context, events, done) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);

    context.vars.name = `Test User ${random}`;
    context.vars.email = `user${timestamp}${random}@test.com`;
    context.vars.phone = `84${String(random).padStart(7, '0')}`;
    context.vars.identityDocument = `${timestamp}${random}A`;

    return done();
}

export function generateCreditData(context, events, done) {
    const amounts = [5000, 10000, 15000, 20000, 25000];
    const terms = [6, 12, 18, 24];

    context.vars.amount = amounts[Math.floor(Math.random() * amounts.length)];
    context.vars.term = terms[Math.floor(Math.random() * terms.length)];
    context.vars.purpose = 'Load testing';

    return done();
}
