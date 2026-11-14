import { jest } from '@jest/globals';
import fetch from 'node-fetch';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:4000/api';

describe('Mobile Loan History & Payment Breakdown E2E Suite', () => {
    let institutionId;
    let ownerToken;
    let approverToken;
    let financialMakerToken;
    let financialCheckerToken;
    let clientToken;
    let clientId;
    let otherClientToken;
    let otherClientId;
    let creditId;
    let installment1Id;
    let installment2Id;
    let installment1Amount;
    let installment2Amount;
    let payment1Id;
    let payment2Id;

    const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 1000);

    const apiCall = async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...(options.institutionId ? { 'x-institution-id': options.institutionId } : {}),
            ...options.headers,
        };

        const fetchOptions = {
            method: options.method || 'GET',
            headers,
        };

        if (options.body) {
            fetchOptions.body = options.body;
        }

        const res = await fetch(url, fetchOptions);
        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            data = null;
        }
        return { status: res.status, ok: res.ok, data };
    };

    const createStaffUser = async (name, role, approvalLimit = null) => {
        const userSuffix = Date.now() + '_' + Math.floor(Math.random() * 1000000);
        const email = `${role}_${userSuffix}@example.com`;
        const phone = '84' + Math.floor(1000000 + Math.random() * 9000000);
        const identityDocument = 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'X';
        const res = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: JSON.stringify({
                name,
                email,
                password: 'password123',
                phone,
                identityDocument,
                dateOfBirth: '1988-01-01',
                role,
                approvalLimit,
            }),
        });
        expect(res.status).toBe(201);

        const loginRes = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: 'password123' }),
        });
        expect(loginRes.status).toBe(200);
        return {
            id: res.data?.data?.user?._id || res.data?.data?._id,
            token: loginRes.data.data.token,
        };
    };

    beforeAll(async () => {
        // 1. Registrar Owner e Instituição simultaneamente via /auth/register
        const ownerEmail = `owner_hist_${uniqueSuffix}@example.com`;
        const ownerReg = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: `Owner Histórico ${uniqueSuffix}`,
                email: ownerEmail,
                password: 'Password123!',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'O',
                dateOfBirth: '1982-05-15',
                role: 'owner',
                institutionName: `Microcrédito Histórico ${uniqueSuffix}`,
                institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000),
            }),
        });

        expect(ownerReg.status).toBe(201);
        expect(ownerReg.data.data.token).toBeDefined();
        ownerToken = ownerReg.data.data.token;
        institutionId = ownerReg.data.data.user.institution?._id || ownerReg.data.data.user.institution;
        expect(institutionId).toBeDefined();

        // 2. Inicializar saldo em caixa da instituição para permitir concessão de empréstimos
        await apiCall('/cashflow/initial-balance', {
            method: 'PUT',
            token: ownerToken,
            body: JSON.stringify({ initialBalance: 500000 }),
        });

        // 3. Criar equipa de backoffice (approver, maker, checker)
        const approver = await createStaffUser('Comite Aprovador', 'approver', 100000);
        approverToken = approver.token;

        const maker = await createStaffUser('Financeiro Maker', 'financial');
        financialMakerToken = maker.token;

        const checker = await createStaffUser('Financeiro Checker', 'financial');
        financialCheckerToken = checker.token;

        // 4. Registrar Cliente 1 (via app mobile)
        const clientEmail = `cliente1_${uniqueSuffix}@example.com`;
        const clientReg = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Celso Sitoe',
                email: clientEmail,
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                institutionId,
                role: 'client',
                identityDocument: 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'X',
                dateOfBirth: '1995-07-20',
            }),
        });
        expect(clientReg.status).toBe(201);
        clientToken = clientReg.data.data.token;
        clientId = clientReg.data.data.user._id;

        // Validar e verificar cliente pelo owner
        await apiCall(`/clients/${clientId}/verify`, {
            method: 'PUT',
            token: ownerToken,
            body: JSON.stringify({ isVerified: true }),
        });

        // 5. Registrar Outro Cliente (Cliente 2) para testes de segregação
        const otherEmail = `cliente2_${uniqueSuffix}@example.com`;
        const otherReg = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Lurdes Tembe',
                email: otherEmail,
                password: 'password123',
                phone: '85' + Math.floor(1000000 + Math.random() * 9000000),
                institutionId,
                role: 'client',
                identityDocument: 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'Y',
                dateOfBirth: '1996-03-12',
            }),
        });
        expect(otherReg.status).toBe(201);
        otherClientToken = otherReg.data.data.token;
        otherClientId = otherReg.data.data.user._id;

        await apiCall(`/clients/${otherClientId}/verify`, {
            method: 'PUT',
            token: ownerToken,
            body: JSON.stringify({ isVerified: true }),
        });
    });

    test('1. Cliente solicita empréstimo de 8.000 MT via mobile e valida em Meus Empréstimos', async () => {
        const reqRes = await apiCall('/credits/request', {
            method: 'POST',
            token: clientToken,
            institutionId,
            body: JSON.stringify({
                amount: 8000,
                term: 2,
                periodicity: 'monthly',
                purpose: 'Aquisição de mercadoria para comércio',
                collateral: {
                    type: 'equipment',
                    description: 'Gerador elétrico 5kVA',
                    estimatedValue: 45000,
                },
            }),
        });

        expect(reqRes.status).toBe(201);
        expect(reqRes.data.success).toBe(true);
        expect(reqRes.data.data.credit).toBeDefined();
        creditId = reqRes.data.data.credit._id;
        expect(creditId).toBeDefined();

        // Verificar histórico de empréstimos do cliente
        const myCredits = await apiCall('/credits', {
            token: clientToken,
            institutionId,
        });

        expect(myCredits.status).toBe(200);
        expect(myCredits.data.data.credits.length).toBeGreaterThanOrEqual(1);
        const myCredit = myCredits.data.data.credits.find((c) => c._id === creditId);
        expect(myCredit).toBeDefined();
        expect(myCredit.amount).toBe(8000);
        expect(myCredit.status).toBe('pending');
        expect(myCredit.createdAt).toBeDefined();
    });

    test('2. Aprovação, geração de contrato, assinatura digital e desembolso do empréstimo', async () => {
        // 1. Aprovar crédito pelo approver
        const approveRes = await apiCall(`/credits/${creditId}/approve`, {
            method: 'PUT',
            token: approverToken,
            body: JSON.stringify({ approvedAmount: 8000 }),
        });
        expect(approveRes.status).toBe(200);
        expect(approveRes.data.data.credit.status).toBe('approved');

        // 2. Gerar contrato
        const contractRes = await apiCall(`/credits/${creditId}/generate-contract`, {
            method: 'POST',
            token: approverToken,
            body: JSON.stringify({ templateName: 'Padrao' }),
        });
        expect(contractRes.status).toBe(200);

        // 3. Cliente assina contrato
        const signRes = await apiCall(`/credits/${creditId}/sign-contract`, {
            method: 'POST',
            token: clientToken,
            body: JSON.stringify({ method: 'otp' }),
        });
        expect(signRes.status).toBe(200);

        // 4. Aprovação do contrato pelo aprovador
        const approveContractRes = await apiCall(`/credits/${creditId}/approve-contract`, {
            method: 'POST',
            token: approverToken,
        });
        expect(approveContractRes.status).toBe(200);

        // 5. Financeiro Maker solicita desembolso
        const disburseReq = await apiCall(`/credits/${creditId}/disburse`, {
            method: 'PUT',
            token: financialMakerToken,
            body: JSON.stringify({ disbursementMethod: 'mpesa' }),
        });
        expect(disburseReq.status).toBe(200);

        // 6. Financeiro Checker aprova desembolso (gera parcelas)
        const approveDisburse = await apiCall(`/credits/${creditId}/approve-disbursement`, {
            method: 'PUT',
            token: financialCheckerToken,
        });
        expect(approveDisburse.status).toBe(200);

        // 7. Buscar detalhes do crédito e parcelas geradas
        const detailsRes = await apiCall(`/credits/${creditId}`, {
            token: clientToken,
            institutionId,
        });

        expect(detailsRes.status).toBe(200);
        expect(detailsRes.data.data.credit.status).toBe('active');
        expect(detailsRes.data.data.credit.installments.length).toBe(2);

        installment1Id = detailsRes.data.data.credit.installments[0]._id;
        installment2Id = detailsRes.data.data.credit.installments[1]._id;
        installment1Amount = detailsRes.data.data.credit.installments[0].totalAmount;
        installment2Amount = detailsRes.data.data.credit.installments[1].totalAmount;
        expect(installment1Id).toBeDefined();
        expect(installment2Id).toBeDefined();
    });

    test('3. Cliente submete 1º pagamento com M-Pesa e valida campos de quanto e quando foi pago', async () => {
        const payRes = await apiCall('/payments', {
            method: 'POST',
            token: clientToken,
            institutionId,
            body: JSON.stringify({
                creditId,
                installmentId: installment1Id,
                amount: installment1Amount,
                paymentMethod: 'mpesa',
                transactionId: `MPESA-HIST-${uniqueSuffix}-001`,
            }),
        });

        expect(payRes.status).toBe(201);
        expect(payRes.data.success).toBe(true);
        payment1Id = payRes.data.data.payment._id;
        expect(payment1Id).toBeDefined();
        expect(payRes.data.data.payment.amount).toBe(installment1Amount);
        expect(payRes.data.data.payment.status).toBe('pending');
        expect(payRes.data.data.payment.createdAt).toBeDefined();
    });

    test('4. Confirmação do 1º pagamento pela equipa financeira', async () => {
        const confirmRes = await apiCall(`/payments/${payment1Id}/confirm`, {
            method: 'PUT',
            token: financialCheckerToken,
            institutionId,
        });

        expect(confirmRes.status).toBe(200);
        expect(confirmRes.data.data.payment.status).toBe('confirmed');
        expect(confirmRes.data.data.payment.processedAt || confirmRes.data.data.payment.confirmedAt).toBeDefined();
    });

    test('5. Cliente submete 2º pagamento com e-Mola e equipa financeira confirma', async () => {
        const pay2Res = await apiCall('/payments', {
            method: 'POST',
            token: clientToken,
            institutionId,
            body: JSON.stringify({
                creditId,
                installmentId: installment2Id,
                amount: installment2Amount,
                paymentMethod: 'emola',
                transactionId: `EMOLA-HIST-${uniqueSuffix}-002`,
            }),
        });

        expect(pay2Res.status).toBe(201);
        payment2Id = pay2Res.data.data.payment._id;
        expect(payment2Id).toBeDefined();

        const confirm2Res = await apiCall(`/payments/${payment2Id}/confirm`, {
            method: 'PUT',
            token: financialCheckerToken,
            institutionId,
        });

        expect(confirm2Res.status).toBe(200);
        expect(confirm2Res.data.data.payment.status).toBe('confirmed');
    });

    test('6. Verificação do Histórico de Empréstimos: reflete o total solicitado e o total já pago', async () => {
        const creditsRes = await apiCall('/credits', {
            token: clientToken,
            institutionId,
        });

        expect(creditsRes.status).toBe(200);
        const credit = creditsRes.data.data.credits.find((c) => c._id === creditId);
        expect(credit).toBeDefined();
        expect(credit.amount).toBe(8000);
        expect(credit.totalPaid).toBe(installment1Amount + installment2Amount);
        expect(credit.status).toBe('paid'); // Totalmente liquidado
    });

    test('7. Verificação do Histórico de Pagamentos por Crédito: retorna detalhes exatos de quanto e quando foi pago', async () => {
        const historyRes = await apiCall(`/payments?creditId=${creditId}`, {
            token: clientToken,
            institutionId,
        });

        expect(historyRes.status).toBe(200);
        expect(historyRes.data.success).toBe(true);
        const payments = historyRes.data.data.payments;
        expect(payments.length).toBe(2);

        const p1 = payments.find((p) => p._id === payment1Id);
        const p2 = payments.find((p) => p._id === payment2Id);

        expect(p1).toBeDefined();
        expect(p2).toBeDefined();

        // Quanto foi pago
        expect(p1.amount).toBe(installment1Amount);
        expect(p2.amount).toBe(installment2Amount);

        // Quando foi pago
        expect(new Date(p1.createdAt).getTime()).toBeGreaterThan(0);
        expect(new Date(p2.createdAt).getTime()).toBeGreaterThan(0);

        // Quando foi processado/confirmado
        expect(p1.processedAt || p1.confirmedAt).toBeDefined();
        expect(p2.processedAt || p2.confirmedAt).toBeDefined();

        // Métodos e IDs de Transação
        expect(p1.paymentMethod).toBe('mpesa');
        expect(p1.transactionId).toBe(`MPESA-HIST-${uniqueSuffix}-001`);
        expect(p2.paymentMethod).toBe('emola');
        expect(p2.transactionId).toBe(`EMOLA-HIST-${uniqueSuffix}-002`);

        // Parcelas correspondentes
        expect(p1.installment.installmentNumber).toBe(1);
        expect(p2.installment.installmentNumber).toBe(2);

        // Estado confirmado
        expect(p1.status).toBe('confirmed');
        expect(p2.status).toBe('confirmed');
    });

    test('8. Verificação do Extrato Geral de Pagamentos: retorna todos os pagamentos do utilizador', async () => {
        const allPaymentsRes = await apiCall('/payments', {
            token: clientToken,
            institutionId,
        });

        expect(allPaymentsRes.status).toBe(200);
        expect(allPaymentsRes.data.success).toBe(true);
        const list = allPaymentsRes.data.data.payments;
        expect(list.length).toBeGreaterThanOrEqual(2);

        const found1 = list.find((p) => p._id === payment1Id);
        const found2 = list.find((p) => p._id === payment2Id);
        expect(found1).toBeDefined();
        expect(found2).toBeDefined();
    });

    test('9. Segregação de Dados: Outro cliente NÃO tem acesso aos empréstimos nem aos pagamentos deste utilizador', async () => {
        // Outro cliente buscando créditos
        const otherCreditsRes = await apiCall('/credits', {
            token: otherClientToken,
            institutionId,
        });
        expect(otherCreditsRes.status).toBe(200);
        const leakedCredit = otherCreditsRes.data.data.credits.find((c) => c._id === creditId);
        expect(leakedCredit).toBeUndefined();

        // Outro cliente buscando pagamentos
        const otherPaymentsRes = await apiCall('/payments', {
            token: otherClientToken,
            institutionId,
        });
        expect(otherPaymentsRes.status).toBe(200);
        const leakedPayment = otherPaymentsRes.data.data.payments.find(
            (p) => p._id === payment1Id || p._id === payment2Id
        );
        expect(leakedPayment).toBeUndefined();
    });
});
