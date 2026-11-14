import { jest } from '@jest/globals';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:4000/api';

describe('Full End-to-End Workflow: Mobile to Web & RBAC Multi-Profile Matrix', () => {
    let superAdminToken;
    let ownerToken;
    let institutionId;
    let analystToken;
    let analystId;
    let approverToken;
    let approverId;
    let financialMakerToken;
    let financialCheckerToken;
    let collectorToken;
    let supportToken;
    let auditorToken;
    let clientToken;
    let clientId;
    let creditId;
    let installmentId;
    let paymentId;
    let standardPackage;

    const testProofPath = path.join(__dirname, 'dummy_test_proof.pdf');
    const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 1000);

    beforeAll(async () => {
        fs.writeFileSync(testProofPath, '%PDF-1.4 Dummy Subscription Proof Document');

        // Obter ou criar Super Admin
        const superAdminEmail = 'mauro.patricio1@gmail.com';
        const loginRes = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: superAdminEmail, password: 'Patrick2019#' }),
        });

        if (loginRes.status === 200 && loginRes.data?.data?.token) {
            superAdminToken = loginRes.data.data.token;
        } else {
            console.error('Super Admin login failed:', loginRes.data);
        }

        // Buscar pacotes de subscrição
        const pkgsRes = await apiCall('/subscriptions/admin/packages', {
            token: superAdminToken,
        });
        const pkgsList = Array.isArray(pkgsRes.data?.data) ? pkgsRes.data.data : [];
        standardPackage = pkgsList.find((p) => p.slug === 'standard') || pkgsList[0];
    });

    afterAll(() => {
        if (fs.existsSync(testProofPath)) {
            try { fs.unlinkSync(testProofPath); } catch (e) {}
        }
    });

    // Helper fetch wrapper
    const apiCall = async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...options.headers,
        };
        const response = await fetch(url, {
            ...options,
            headers,
        });
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }
        return { status: response.status, data };
    };

    describe('1. Inscrição de Nova Instituição & Configuração de Trial 7 Dias', () => {
        it('deve registar novo Proprietário (Owner) e criar Instituição com período experimental de 7 dias', async () => {
            const ownerEmail = `owner_${uniqueSuffix}@example.com`;
            const regRes = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: `Owner Test ${uniqueSuffix}`,
                    email: ownerEmail,
                    password: 'password123',
                    phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                    identityDocument: `BI_OWNER_${uniqueSuffix}`,
                    dateOfBirth: '1982-05-15',
                    role: 'owner',
                    institutionName: `Microcrédito Avançado ${uniqueSuffix}`,
                    institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000),
                }),
            });

            expect(regRes.status).toBe(201);
            expect(regRes.data.success).toBe(true);
            expect(regRes.data.data.token).toBeDefined();

            ownerToken = regRes.data.data.token;
            institutionId = regRes.data.data.user.institution?._id || regRes.data.data.user.institution;
            expect(institutionId).toBeDefined();

            // Verificar se o plano inicial é trial e está activo via /subscriptions/current
            const currentSubRes = await apiCall('/subscriptions/current', { token: ownerToken });
            expect(currentSubRes.status).toBe(200);
            expect(currentSubRes.data.success).toBe(true);
            expect(currentSubRes.data.data.subscription.status).toBe('active');
            expect(currentSubRes.data.data.subscription.plan).toBe('trial');
        });

        it('deve inicializar saldo em caixa da instituição', async () => {
            const res = await apiCall('/cashflow/initial-balance', {
                method: 'PUT',
                token: ownerToken,
                body: JSON.stringify({ initialBalance: 1000000 }),
            });
            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
        });
    });

    describe('2. Criação da Equipa Multi-Perfil (RBAC) pelo Owner', () => {
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
            if (res.status !== 201) {
                console.error(`Failed to create staff ${role}:`, res.data);
            }
            expect(res.status).toBe(201);
            expect(res.data.success).toBe(true);

            // Fazer login para obter o token de sessão do perfil
            const loginRes = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: 'password123' }),
            });
            expect(loginRes.status).toBe(200);
            const createdUser = res.data?.data?.user || res.data?.data;
            return {
                id: createdUser?._id,
                token: loginRes.data.data.token,
            };
        };

        it('deve criar e autenticar Analista de Crédito (analyst)', async () => {
            const user = await createStaffUser('Analista Teste', 'analyst');
            analystId = user.id;
            analystToken = user.token;
            expect(analystToken).toBeDefined();
        });

        it('deve criar e autenticar Aprovador de Crédito (approver) com limite de 50.000 MT', async () => {
            const user = await createStaffUser('Comite Aprovador Teste', 'approver', 50000);
            approverId = user.id;
            approverToken = user.token;
            expect(approverToken).toBeDefined();
        });

        it('deve criar e autenticar 2 utilizadores Financeiros (Maker e Checker)', async () => {
            const maker = await createStaffUser('Financeiro Maker', 'financial');
            financialMakerToken = maker.token;
            const checker = await createStaffUser('Financeiro Checker', 'financial');
            financialCheckerToken = checker.token;
            expect(financialMakerToken).toBeDefined();
            expect(financialCheckerToken).toBeDefined();
        });

        it('deve criar e autenticar Técnico de Cobranças (collector)', async () => {
            const user = await createStaffUser('Agente Cobranca', 'collector');
            collectorToken = user.token;
            expect(collectorToken).toBeDefined();
        });

        it('deve criar e autenticar Apoio ao Cliente (support)', async () => {
            const user = await createStaffUser('Suporte Tecnico', 'support');
            supportToken = user.token;
            expect(supportToken).toBeDefined();
        });

        it('deve criar e autenticar Auditor Interno (auditor)', async () => {
            const user = await createStaffUser('Auditor Independente', 'auditor');
            auditorToken = user.token;
            expect(auditorToken).toBeDefined();
        });
    });

    describe('3. Fluxo Mobile: Cadastro de Cliente, Simulação e Solicitação de Empréstimo', () => {
        it('deve registar novo cliente via API Mobile associado à instituição', async () => {
            const clientEmail = `cliente_${uniqueSuffix}@example.com`;
            const res = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    name: `Cliente Mobile ${uniqueSuffix}`,
                    email: clientEmail,
                    password: 'password123',
                    phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                    identityDocument: `BI_CLI_${uniqueSuffix}`.slice(0, 20),
                    dateOfBirth: '1995-07-20',
                    role: 'client',
                    institutionId,
                }),
            });

            expect(res.status).toBe(201);
            expect(res.data.success).toBe(true);
            clientId = res.data.data.user._id;

            // Login no mobile
            const loginRes = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: clientEmail,
                    password: 'password123',
                    isMobile: true,
                }),
            });
            expect(loginRes.status).toBe(200);
            expect(loginRes.data.data.token).toBeDefined();
            clientToken = loginRes.data.data.token;

            // Verificar conta do cliente pelo Owner (KYC aprovado)
            const verifyRes = await apiCall(`/clients/${clientId}/verify`, {
                method: 'PUT',
                token: ownerToken,
                body: JSON.stringify({ isVerified: true }),
            });
            expect(verifyRes.status).toBe(200);
        });

        it('cliente no mobile deve conseguir simular crédito com diferentes prazos e montantes', async () => {
            const res = await apiCall('/credits/simulate', {
                method: 'POST',
                token: clientToken,
                body: JSON.stringify({
                    amount: 20000,
                    term: 4,
                    periodicity: 'monthly',
                }),
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.totalPayable).toBeGreaterThan(20000);
            expect(res.data.schedule).toHaveLength(4);
        });

        it('cliente submete solicitação de empréstimo de 20.000 MT via Mobile', async () => {
            const res = await apiCall('/credits/request', {
                method: 'POST',
                token: clientToken,
                body: JSON.stringify({
                    amount: 20000,
                    term: 4,
                    purpose: 'Aquisição de Stock Comercial',
                    periodicity: 'monthly',
                    interestRate: 10,
                    amortizationType: 'price',
                }),
            });

            expect(res.status).toBe(201);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.status).toBe('pending');
            creditId = res.data.data.credit._id;
            expect(creditId).toBeDefined();
        });
    });

    describe('4. Fluxo Web Backoffice: Análise, Segregação Maker-Checker, Aprovação e Desembolso', () => {
        it('Analista deve aceder ao crédito e registar parecer técnico de crédito', async () => {
            const res = await apiCall(`/credits/${creditId}/analyze`, {
                method: 'PUT',
                token: analystToken,
                body: JSON.stringify({
                    creditScore: 820,
                    riskLevel: 'low',
                    recommendation: 'approve',
                    notes: 'Cliente com histórico estável e capacidade financeira comprovada.',
                }),
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.makerChecker.analyzedBy).toBeDefined();
        });

        it('Segregação de Funções: Analista NÃO pode aprovar o crédito que analisou', async () => {
            const res = await apiCall(`/credits/${creditId}/approve`, {
                method: 'PUT',
                token: analystToken,
                body: JSON.stringify({ approvedAmount: 20000 }),
            });

            expect(res.status).toBe(403);
            expect(res.data.success).toBe(false);
            expect(res.data.message).toMatch(/Segregação de Funções|não é permitida|não tem permissão/i);
        });

        it('Aprovador aprova o crédito com sucesso dentro do seu limite de aprovação', async () => {
            const res = await apiCall(`/credits/${creditId}/approve`, {
                method: 'PUT',
                token: approverToken,
                body: JSON.stringify({ approvedAmount: 20000 }),
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.status).toBe('approved');
        });

        it('Geração e assinatura do contrato', async () => {
            // Gerar contrato
            const genRes = await apiCall(`/credits/${creditId}/generate-contract`, {
                method: 'POST',
                token: approverToken,
                body: JSON.stringify({ templateName: 'Padrao' }),
            });
            expect(genRes.status).toBe(200);

            // Cliente assina no mobile via OTP
            const signRes = await apiCall(`/credits/${creditId}/sign-contract`, {
                method: 'POST',
                token: clientToken,
                body: JSON.stringify({ method: 'otp' }),
            });
            expect(signRes.status).toBe(200);

            // Aprovação final do contrato pela instituição
            const approveContractRes = await apiCall(`/credits/${creditId}/approve-contract`, {
                method: 'POST',
                token: approverToken,
            });
            expect(approveContractRes.status).toBe(200);
        });

        it('Financeiro Maker solicita desembolso dos fundos', async () => {
            const res = await apiCall(`/credits/${creditId}/disburse`, {
                method: 'PUT',
                token: financialMakerToken,
                body: JSON.stringify({ disbursementMethod: 'bank_transfer' }),
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.currentStage).toBe('awaiting_disbursement');
        });

        it('Segregação de Funções no Desembolso: Maker não pode ser o Checker a aprovar a si mesmo', async () => {
            const res = await apiCall(`/credits/${creditId}/approve-disbursement`, {
                method: 'PUT',
                token: financialMakerToken,
            });

            expect(res.status).toBe(403);
            expect(res.data.success).toBe(false);
            expect(res.data.message).toMatch(/Maker.*Checker|não pode ser o mesmo/i);
        });

        it('Financeiro Checker aprova desembolso -> Crédito torna-se activo e gera parcelas', async () => {
            const res = await apiCall(`/credits/${creditId}/approve-disbursement`, {
                method: 'PUT',
                token: financialCheckerToken,
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.status).toBe('active');
        });
    });

    describe('5. Fluxo de Pagamento Mobile -> Web: Notificação em Badges, Confirmação e Caixa', () => {
        it('Cliente consulta parcelas activas no mobile', async () => {
            const res = await apiCall(`/credits/${creditId}`, {
                method: 'GET',
                token: clientToken,
            });

            if (res.status !== 200) {
                console.error('Approve failed:', res.data);
            }
            expect(res.status).toBe(200);
            expect(res.data.success).toBe(true);
            expect(res.data.data.credit.installments.length).toBeGreaterThan(0);

            installmentId = res.data.data.credit.installments[0]._id;
            const installmentAmount = res.data.data.credit.installments[0].amount;
            expect(installmentId).toBeDefined();
        });

        it('Cliente submete pagamento da parcela via Mobile', async () => {
            const creditRes = await apiCall(`/credits/${creditId}`, { token: clientToken });
            const amountToPay = creditRes.data?.data?.credit?.installments?.[0]?.amount || 5500;

            const res = await apiCall('/payments', {
                method: 'POST',
                token: clientToken,
                body: JSON.stringify({
                    creditId,
                    installmentId,
                    amount: amountToPay,
                    paymentMethod: 'mpesa',
                    transactionId: `TX_${Date.now()}`,
                }),
            });

            expect(res.status).toBe(201);
            expect(res.data.success).toBe(true);
            expect(res.data.data.payment.status).toBe('pending');
            paymentId = res.data.data.payment._id;
            expect(paymentId).toBeDefined();
        });

        it('Staff da instituição deve receber badge com contagem de pagamentos pendentes', async () => {
            const badgeRes = await apiCall('/notifications/badges', {
                token: financialMakerToken,
            });

            expect(badgeRes.status).toBe(200);
            expect(badgeRes.data.success).toBe(true);
            expect(badgeRes.data.data.pendingPayments).toBeGreaterThanOrEqual(1);
        });

        it('Financeiro consulta lista de pagamentos pendentes', async () => {
            const pendingRes = await apiCall('/payments/pending', {
                token: financialMakerToken,
            });

            expect(pendingRes.status).toBe(200);
            expect(pendingRes.data.success).toBe(true);
            const found = pendingRes.data.data.payments.some((p) => p._id === paymentId);
            expect(found).toBe(true);
        });

        it('Financeiro confirma pagamento -> Parcela torna-se paga e transacção em caixa é registada', async () => {
            const confirmRes = await apiCall(`/payments/${paymentId}/confirm`, {
                method: 'PUT',
                token: financialMakerToken,
            });

            expect(confirmRes.status).toBe(200);
            expect(confirmRes.data.success).toBe(true);
            expect(confirmRes.data.data.payment.status).toBe('confirmed');

            // Verificar parcela
            const creditRes = await apiCall(`/credits/${creditId}`, { token: clientToken });
            const inst = creditRes.data.data.credit.installments.find((i) => i._id === installmentId);
            expect(inst.status).toBe('paid');

            // Verificar caixa institucional
            const cashflowRes = await apiCall('/cashflow/summary', { token: ownerToken });
            expect(cashflowRes.status).toBe(200);
            expect(cashflowRes.data.data.totalEntradas).toBeGreaterThan(0);
        });
    });

    describe('6. Gestão de Subscrições, Expiração de Trial e Controlo de Acesso', () => {
        it('Super Admin deve conseguir actualizar estado da subscrição institucional', async () => {
            // Simular expiração do trial para testar bloqueio
            const expireRes = await apiCall(`/institutions/${institutionId}/subscription`, {
                method: 'PUT',
                token: superAdminToken,
                body: JSON.stringify({
                    plan: 'starter',
                    status: 'expired',
                    subscriptionDays: 0,
                }),
            });

            expect(expireRes.status).toBe(200);
            expect(expireRes.data.success).toBe(true);
        });

        it('Rotas operacionais devem ser bloqueadas com 403 subscriptionBlocked quando subscrição expira', async () => {
            const blockedRes = await apiCall('/credits', { token: ownerToken });
            expect(blockedRes.status).toBe(403);
            expect(blockedRes.data.subscriptionBlocked).toBe(true);
        });

        it('Owner da Instituição submete renovação/comprovativo de subscrição para o Super Admin', async () => {
            const form = new FormData();
            if (standardPackage?._id) {
                form.append('packageId', String(standardPackage._id));
            } else {
                form.append('planRequested', 'standard');
            }
            form.append('paymentMethod', 'Transferência Bancária');
            form.append('referenceCode', `SUB_TX_${Date.now()}`);
            form.append('proof', fs.createReadStream(testProofPath), {
                filename: 'comprovativo.pdf',
                contentType: 'application/pdf',
            });

            const response = await fetch(`${BASE_URL}/institutions/subscription-request`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ownerToken}`,
                    ...form.getHeaders(),
                },
                body: form,
            });

            const data = await response.json();
            if (response.status !== 201) {
                console.error('Subscription request failed:', data);
            }
            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
        });

        it('Super Admin visualiza pedido pendente e aprova reactivação da subscrição', async () => {
            // Verificar contagem no badge do Super Admin
            const badgeRes = await apiCall('/notifications/badges', { token: superAdminToken });
            expect(badgeRes.status).toBe(200);
            expect(badgeRes.data.data.pendingSubscriptions).toBeGreaterThanOrEqual(1);

            // Listar pedidos de subscrição
            const requestsRes = await apiCall('/subscriptions/admin/requests', { token: superAdminToken });
            expect(requestsRes.status).toBe(200);
            const requestsList = Array.isArray(requestsRes.data.data) ? requestsRes.data.data : requestsRes.data.data.requests;
            expect(requestsList.length).toBeGreaterThan(0);

            const pendingReq = requestsList[0];

            // Aprovar
            const approveRes = await apiCall(`/subscriptions/admin/requests/${pendingReq._id}/approve`, {
                method: 'PUT',
                token: superAdminToken,
            });

            expect(approveRes.status).toBe(200);
            expect(approveRes.data.success).toBe(true);

            // Acesso operacional restaurado para o owner
            const accessRes = await apiCall('/credits', { token: ownerToken });
            expect(accessRes.status).toBe(200);
            expect(accessRes.data.success).toBe(true);
        });
    });

    describe('7. Matriz Rigorosa de Permissões RBAC (10 Perfis)', () => {
        it('Auditor tem acesso a relatórios e logs, mas é barrado ao tentar criar ou aprovar créditos', async () => {
            // Acesso a relatórios: permitido
            const repRes = await apiCall('/reports/credit-performance', { token: auditorToken });
            expect(repRes.status).not.toBe(403);

            // Criar crédito: negado
            const createRes = await apiCall('/credits/request', {
                method: 'POST',
                token: auditorToken,
                body: JSON.stringify({ amount: 10000, term: 3, purpose: 'Tentativa Auditor' }),
            });
            expect(createRes.status).toBe(403);

            // Aprovar crédito: negado
            const approveRes = await apiCall(`/credits/${creditId}/approve`, {
                method: 'PUT',
                token: auditorToken,
                body: JSON.stringify({ approvedAmount: 10000 }),
            });
            expect(approveRes.status).toBe(403);
        });

        it('Cobranças (collector) pode visualizar clientes e registar cobranças, mas não pode aprovar ou desembolsar', async () => {
            const disburseRes = await apiCall(`/credits/${creditId}/disburse`, {
                method: 'PUT',
                token: collectorToken,
                body: JSON.stringify({ disbursementMethod: 'mpesa' }),
            });
            expect(disburseRes.status).toBe(403);
        });

        it('Apoio ao Cliente (support) tem acesso de leitura e não de escrita crítica', async () => {
            const clientListRes = await apiCall('/clients', { token: supportToken });
            expect(clientListRes.status).toBe(200);

            const approveRes = await apiCall(`/credits/${creditId}/approve`, {
                method: 'PUT',
                token: supportToken,
                body: JSON.stringify({ approvedAmount: 5000 }),
            });
            expect(approveRes.status).toBe(403);
        });

        it('Cliente não pode aceder aos dados internos da instituição nem gerir utilizadores', async () => {
            const usersRes = await apiCall('/users', { token: clientToken });
            expect(usersRes.status).toBe(403);

            const disburseRes = await apiCall(`/credits/${creditId}/disburse`, {
                method: 'PUT',
                token: clientToken,
                body: JSON.stringify({ disbursementMethod: 'mpesa' }),
            });
            expect(disburseRes.status).toBe(403);
        });
    });
});
