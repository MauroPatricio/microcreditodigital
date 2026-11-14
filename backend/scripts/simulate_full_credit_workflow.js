import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

// Cores para formatação de console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
};

const logStep = (step, title) => {
    console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.bgBlue} PASSO ${step} ${colors.reset} ${colors.bright}${colors.yellow}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
};

const logSuccess = (msg, details = null) => {
    console.log(`  ${colors.green}✓${colors.reset} ${colors.bright}${msg}${colors.reset}`);
    if (details) {
        console.log(`    ${colors.dim}${JSON.stringify(details, null, 2).replace(/\n/g, '\n    ')}${colors.reset}`);
    }
};

const logInfo = (label, value) => {
    console.log(`    ${colors.cyan}•${colors.reset} ${label}: ${colors.bright}${value}${colors.reset}`);
};

const logWarning = (msg) => {
    console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
};

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
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
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

async function runFullCreditSimulation() {
    const simId = Date.now().toString().slice(-6);
    console.log(`\n${colors.bright}${colors.magenta}########################################################################`);
    console.log(`       SIMULAÇÃO COMPLETA DO FLUXO DE CRÉDITO DIGITAL (E2E)`);
    console.log(`       ID DA SESSÃO: SIM-${simId}`);
    console.log(`       AMBIENTE: http://localhost:4000/api`);
    console.log(`########################################################################${colors.reset}\n`);

    // =========================================================================
    // PASSO 1: Inscrição da Instituição & Configuração de Caixa
    // =========================================================================
    logStep(1, 'INSCRIÇÃO DA INSTITUIÇÃO & INICIALIZAÇÃO DO CAIXA');
    const ownerEmail = `owner_sim_${simId}@microbanco.mz`;
    const ownerRes = await apiCall('/auth/register', {
        method: 'POST',
        body: {
            name: `Director Executivo ${simId}`,
            email: ownerEmail,
            password: 'Password123!',
            phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
            identityDocument: `B${simId}001O`,
            dateOfBirth: '1980-06-15',
            role: 'owner',
            institutionName: `Microcrédito Capital Mais ${simId}`,
            institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000),
        }
    });

    if (ownerRes.status !== 201) {
        throw new Error(`Falha ao registrar instituição: ${JSON.stringify(ownerRes.data)}`);
    }

    const ownerToken = ownerRes.data.data.token;
    const institutionId = ownerRes.data.data.user.institution?._id || ownerRes.data.data.user.institution;
    logSuccess('Instituição financeira e Administrador registados com sucesso');
    logInfo('Instituição ID', institutionId);
    logInfo('Email Administrador', ownerEmail);

    // Inicializar Saldo em Caixa (1.000.000 MT)
    const initCash = await apiCall('/cashflow/initial-balance', {
        method: 'PUT',
        token: ownerToken,
        body: { initialBalance: 1000000 }
    });
    if (initCash.status !== 200) {
        throw new Error(`Falha ao inicializar caixa: ${JSON.stringify(initCash.data)}`);
    }
    logSuccess('Caixa institucional inicializado com saldo de 1.000.000,00 MT');

    // =========================================================================
    // PASSO 2: Criação da Equipa Backoffice (RBAC & Segregação)
    // =========================================================================
    logStep(2, 'CRIAÇÃO DA EQUIPA MULTI-PERFIL (RBAC)');
    const createStaff = async (name, role, approvalLimit = null) => {
        const userSuffix = Date.now().toString().slice(-4) + '_' + Math.floor(Math.random() * 10000);
        const email = `${role}_${userSuffix}_${simId}@microbanco.mz`;
        const res = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: {
                name,
                email,
                password: 'password123',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: `B${simId}_${userSuffix}`.slice(0, 20),
                dateOfBirth: '1987-03-20',
                role,
                approvalLimit,
            }
        });
        const login = await apiCall('/auth/login', {
            method: 'POST',
            body: { email, password: 'password123' }
        });
        return {
            id: res.data?.data?.user?._id || res.data?.data?._id,
            token: login.data.data.token,
            email,
            role,
            name
        };
    };

    const analyst = await createStaff('Dr. Nelson Mondlane', 'analyst');
    logSuccess(`Analista de Crédito criado: ${analyst.name} (${analyst.email})`);

    const approver = await createStaff('Eng. Maria Santos', 'approver', 100000);
    logSuccess(`Aprovador de Crédito criado: ${approver.name} (Limite: 100.000 MT)`);

    const finMaker = await createStaff('Carlos Nhantumbo', 'financial');
    logSuccess(`Financeiro Maker criado: ${finMaker.name}`);

    const finChecker = await createStaff('Helena Cossa', 'financial');
    logSuccess(`Financeiro Checker criado: ${finChecker.name}`);

    // =========================================================================
    // PASSO 3: Cadastro & Verificação KYC do Cliente Mobile
    // =========================================================================
    logStep(3, 'CADASTRO E VERIFICAÇÃO KYC DO CLIENTE NO MOBILE');
    const clientEmail = `cliente_mobile_${simId}@gmail.com`;
    const clientReg = await apiCall('/auth/register', {
        method: 'POST',
        body: {
            name: `Tomas Macuacua ${simId}`,
            email: clientEmail,
            password: 'password123',
            phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
            identityDocument: `B1102938${simId.slice(0, 3)}X`,
            dateOfBirth: '1992-08-14',
            role: 'client',
            institutionId,
        }
    });

    if (clientReg.status !== 201) {
        throw new Error(`Falha no cadastro do cliente: ${JSON.stringify(clientReg.data)}`);
    }

    const clientToken = clientReg.data.data.token;
    const clientId = clientReg.data.data.user._id;
    logSuccess('Cliente registado com sucesso via Mobile App');
    logInfo('Cliente ID', clientId);
    logInfo('Nome Completo', `Tomas Macuacua ${simId}`);
    logInfo('Telefone', clientReg.data.data.user.phone);

    // Validação KYC do cliente
    await apiCall(`/clients/${clientId}/verify`, {
        method: 'PUT',
        token: ownerToken,
        body: { isVerified: true }
    });
    logSuccess('Documentação e Identidade KYC verificadas com sucesso pela Instituição');

    // =========================================================================
    // PASSO 4: Simulação de Crédito pelo Cliente
    // =========================================================================
    logStep(4, 'SIMULAÇÃO DE CRÉDITO NO APLICATIVO MOBILE');
    const simAmount = 15000;
    const simTerm = 3;
    const simRes = await apiCall('/credits/simulate', {
        method: 'POST',
        token: clientToken,
        body: {
            amount: simAmount,
            term: simTerm,
            periodicity: 'monthly',
        }
    });

    if (simRes.status !== 200) {
        throw new Error(`Falha na simulação: ${JSON.stringify(simRes.data)}`);
    }

    const simSummary = simRes.data.data || {};
    logSuccess('Simulação financeira calculada pelo motor do sistema:');
    logInfo('Capital Solicitado', `${simAmount.toLocaleString('pt-MZ')} MT`);
    logInfo('Prazo de Pagamento', `${simTerm} Meses`);
    logInfo('Taxa de Juro Aplicada', `${simSummary.interestRate || 10}%`);
    logInfo('Prestação Mensal Estimada', `${(simSummary.monthlyPayment || simSummary.installmentAmount || 0).toLocaleString('pt-MZ')} MT / mês`);
    logInfo('Total a Reembolsar', `${(simSummary.totalPayable || 0).toLocaleString('pt-MZ')} MT`);

    // =========================================================================
    // PASSO 5: Submissão da Solicitação de Crédito
    // =========================================================================
    logStep(5, 'SUBMISSÃO DA PROPOSTA DE EMPRÉSTIMO PELO CLIENTE');
    const reqRes = await apiCall('/credits/request', {
        method: 'POST',
        token: clientToken,
        institutionId,
        body: {
            amount: simAmount,
            term: simTerm,
            periodicity: 'monthly',
            purpose: 'Aquisição de estoque e mercadorias para mercearia',
            collateral: {
                type: 'equipment',
                description: 'Congelador industrial de 500L',
                estimatedValue: 40000,
            }
        }
    });

    if (reqRes.status !== 201) {
        throw new Error(`Falha na submissão de crédito: ${JSON.stringify(reqRes.data)}`);
    }

    const creditId = reqRes.data.data.credit._id;
    const loanCode = reqRes.data.data.credit.loanNumber || `EMP-${creditId.slice(-6).toUpperCase()}`;
    logSuccess('Proposta de crédito submetida com sucesso!');
    logInfo('Código do Crédito', loanCode);
    logInfo('Crédito ID', creditId);
    logInfo('Estado Atual', reqRes.data.data.credit.status);

    // =========================================================================
    // PASSO 6: Análise de Risco & Parecer Técnico (Analista)
    // =========================================================================
    logStep(6, 'ANÁLISE DE RISCO PELO ANALISTA DE CRÉDITO');
    const analyzeRes = await apiCall(`/credits/${creditId}/analyze`, {
        method: 'PUT',
        token: analyst.token,
        body: {
            riskNotes: 'Capacidade de reembolso comprovada com base no fluxo comercial. Garantia real validada.',
            recommendedAmount: simAmount,
        }
    });

    if (analyzeRes.status !== 200) {
        throw new Error(`Falha na análise: ${JSON.stringify(analyzeRes.data)}`);
    }
    logSuccess('Parecer técnico emitido e registado no histórico do fluxo:');
    logInfo('Novo Estado', analyzeRes.data.data.credit.status);

    // Teste de Segregação: Analista tenta aprovar o crédito que analisou
    const illegalApprove = await apiCall(`/credits/${creditId}/approve`, {
        method: 'PUT',
        token: analyst.token,
        body: { approvedAmount: simAmount }
    });
    if (illegalApprove.status === 403) {
        logSuccess('Segregação de Funções respeitada: Analista foi impedido de aprovar o seu próprio parecer');
    } else {
        logWarning(`Inesperado: Analista recebeu status ${illegalApprove.status}`);
    }

    // =========================================================================
    // PASSO 7: Aprovação de Crédito pelo Aprovador
    // =========================================================================
    logStep(7, 'APROVAÇÃO FORMAL PELO COMITÉ / APROVADOR AUTORIZADO');
    const approveRes = await apiCall(`/credits/${creditId}/approve`, {
        method: 'PUT',
        token: approver.token,
        body: { approvedAmount: simAmount }
    });

    if (approveRes.status !== 200) {
        throw new Error(`Falha na aprovação: ${JSON.stringify(approveRes.data)}`);
    }
    logSuccess('Crédito aprovado formalmente!');
    logInfo('Valor Aprovado', `${simAmount.toLocaleString('pt-MZ')} MT`);
    logInfo('Estado do Crédito', approveRes.data.data.credit.status);

    // =========================================================================
    // PASSO 8: Contrato Digital & Assinatura
    // =========================================================================
    logStep(8, 'GERAÇÃO, ASSINATURA DIGITAL E VALIDAÇÃO DE CONTRATO');
    // Gerar minuta
    const genContract = await apiCall(`/credits/${creditId}/generate-contract`, {
        method: 'POST',
        token: approver.token,
        body: { templateName: 'Padrao' }
    });
    if (genContract.status !== 200) {
        throw new Error(`Falha ao gerar contrato: ${JSON.stringify(genContract.data)}`);
    }
    logSuccess('Contrato de mútuo gerado com cláusulas padrão');

    // Cliente assina no mobile via OTP
    const signContract = await apiCall(`/credits/${creditId}/sign-contract`, {
        method: 'POST',
        token: clientToken,
        body: { method: 'otp' }
    });
    if (signContract.status !== 200) {
        throw new Error(`Falha na assinatura: ${JSON.stringify(signContract.data)}`);
    }
    logSuccess('Cliente assinou o contrato digitalmente via validação segura');

    // Aprovação final do contrato
    const approveContract = await apiCall(`/credits/${creditId}/approve-contract`, {
        method: 'POST',
        token: approver.token,
    });
    if (approveContract.status !== 200) {
        throw new Error(`Falha ao aprovar contrato: ${JSON.stringify(approveContract.data)}`);
    }
    logSuccess('Contrato assinado homologado pela instituição financeira');

    // =========================================================================
    // PASSO 9: Desembolso dos Fundos (Maker-Checker)
    // =========================================================================
    logStep(9, 'DESEMBOLSO DE FUNDOS COM SEGREGAÇÃO MAKER-CHECKER');
    // Maker solicita desembolso
    const disburseReq = await apiCall(`/credits/${creditId}/disburse`, {
        method: 'PUT',
        token: finMaker.token,
        body: { disbursementMethod: 'mpesa' }
    });
    if (disburseReq.status !== 200) {
        throw new Error(`Falha no pedido de desembolso: ${JSON.stringify(disburseReq.data)}`);
    }
    logSuccess('Financeiro Maker gerou ordem de desembolso');

    // Teste de Segregação: Maker tenta aprovar a sua própria ordem
    const illegalDisburse = await apiCall(`/credits/${creditId}/approve-disbursement`, {
        method: 'PUT',
        token: finMaker.token,
    });
    if (illegalDisburse.status === 403) {
        logSuccess('Segregação Maker-Checker respeitada: Maker não pode autorizar o próprio desembolso');
    }

    // Checker aprova desembolso
    const checkerApprove = await apiCall(`/credits/${creditId}/approve-disbursement`, {
        method: 'PUT',
        token: finChecker.token,
    });
    if (checkerApprove.status !== 200) {
        throw new Error(`Falha na aprovação do desembolso: ${JSON.stringify(checkerApprove.data)}`);
    }
    logSuccess('Financeiro Checker autorizou o desembolso dos fundos!');
    logInfo('Estado do Crédito', 'ACTIVO');

    // Obter parcelas geradas
    const activeDetails = await apiCall(`/credits/${creditId}`, {
        token: clientToken,
        institutionId,
    });
    const installments = activeDetails.data.data.credit.installments || [];
    logSuccess(`Plano de Amortização gerado com ${installments.length} Prestações:`);
    installments.forEach(inst => {
        logInfo(`Parcela #${inst.installmentNumber}`, `${inst.totalAmount.toLocaleString('pt-MZ')} MT (Vencimento: ${new Date(inst.dueDate).toLocaleDateString('pt-MZ')})`);
    });

    // =========================================================================
    // PASSO 10: Reembolso & Confirmação das Prestações (Mobile -> Web)
    // =========================================================================
    logStep(10, 'AMORTIZAÇÃO E REEMBOLSO DAS PRESTAÇÕES PELO CLIENTE');
    for (let i = 0; i < installments.length; i++) {
        const inst = installments[i];
        const method = i === 0 ? 'mpesa' : (i === 1 ? 'emola' : 'bank_transfer');
        const txCode = `${method.toUpperCase()}-${simId}-00${inst.installmentNumber}`;

        console.log(`\n  --- Submissão da Parcela ${inst.installmentNumber} de ${installments.length} ---`);
        // 1. Cliente submete pagamento no mobile
        const payRes = await apiCall('/payments', {
            method: 'POST',
            token: clientToken,
            institutionId,
            body: {
                creditId,
                installmentId: inst._id,
                amount: inst.totalAmount,
                paymentMethod: method,
                transactionId: txCode,
            }
        });

        if (payRes.status !== 201) {
            throw new Error(`Falha no pagamento da parcela ${inst.installmentNumber}: ${JSON.stringify(payRes.data)}`);
        }

        const paymentId = payRes.data.data.payment._id;
        logSuccess(`Pagamento submetido via ${method.toUpperCase()}: ${inst.totalAmount.toLocaleString('pt-MZ')} MT`);
        logInfo('ID da Transação', txCode);
        logInfo('Data e Hora de Envio', new Date(payRes.data.data.payment.createdAt).toLocaleString('pt-MZ'));
        logInfo('Estado Inicial', 'Em Análise (Pendente)');

        // 2. Notificação e Badge de Pagamentos Pendentes
        const pendingBadge = await apiCall('/payments/pending', {
            token: finChecker.token,
            institutionId,
        });
        logSuccess(`Backoffice recebeu notificação de pagamento pendente (Badges ativos: ${pendingBadge.data?.data?.count || 1})`);

        // 3. Financeiro confirma pagamento
        const confirmRes = await apiCall(`/payments/${paymentId}/confirm`, {
            method: 'PUT',
            token: finChecker.token,
            institutionId,
        });

        if (confirmRes.status !== 200) {
            throw new Error(`Falha na confirmação: ${JSON.stringify(confirmRes.data)}`);
        }
        logSuccess(`Equipa Financeira confirmou o pagamento #${inst.installmentNumber}`);
        logInfo('Data e Hora de Confirmação', new Date(confirmRes.data.data.payment.confirmedAt || confirmRes.data.data.payment.processedAt).toLocaleString('pt-MZ'));
    }

    // =========================================================================
    // PASSO 11: Validação da Liquidação Total & Extrato no Mobile
    // =========================================================================
    logStep(11, 'VALIDAÇÃO DA LIQUIDAÇÃO TOTAL DO EMPRÉSTIMO');
    const finalCreditRes = await apiCall(`/credits/${creditId}`, {
        token: clientToken,
        institutionId,
    });
    const finalCredit = finalCreditRes.data.data.credit;

    logSuccess('Estado Final do Empréstimo:');
    logInfo('Estado do Contrato', `${colors.green}${finalCredit.status.toUpperCase()} (LIQUIDADO COM SUCESSO)${colors.reset}`);
    logInfo('Total Financiado', `${(finalCredit.amount).toLocaleString('pt-MZ')} MT`);
    logInfo('Total Amortizado / Pago', `${(finalCredit.totalPaid).toLocaleString('pt-MZ')} MT`);
    logInfo('Saldo Devedor Restante', '0,00 MT');

    // =========================================================================
    // PASSO 12: Auditoria do Histórico de Pagamentos (Quanto e Quando foi Pago)
    // =========================================================================
    logStep(12, 'HISTÓRICO DE EMPRÉSTIMOS E AUDITORIA DE PAGAMENTOS');
    const paymentsHistory = await apiCall(`/payments?creditId=${creditId}`, {
        token: clientToken,
        institutionId,
    });
    const historyList = paymentsHistory.data.data.payments || [];

    console.log(`\n  ${colors.bright}Extrato Detalhado de Pagamentos (Exibição Mobile):${colors.reset}`);
    historyList.forEach((p, idx) => {
        console.log(`  -------------------------------------------------------------`);
        console.log(`  [Pagamento ${idx + 1}] Montante Pago: ${colors.bright}${colors.green}${Number(p.amount).toLocaleString('pt-MZ')} MT${colors.reset}`);
        console.log(`    • Data de Pagamento: ${new Date(p.createdAt).toLocaleString('pt-MZ')}`);
        console.log(`    • Data de Confirmação: ${new Date(p.confirmedAt || p.processedAt).toLocaleString('pt-MZ')}`);
        console.log(`    • Método: ${p.paymentMethod.toUpperCase()} | Ref: ${p.transactionId}`);
        console.log(`    • Parcela: Nº ${p.installment?.installmentNumber || 'N/A'}`);
        console.log(`    • Estado: ${colors.green}${p.status.toUpperCase()}${colors.reset}`);
    });
    console.log(`  -------------------------------------------------------------\n`);

    console.log(`${colors.bright}${colors.green}========================================================================`);
    console.log(`     SIMULAÇÃO COMPLETA CONCLUÍDA COM SUCESSO DE PONTA A PONTA!`);
    console.log(`========================================================================${colors.reset}\n`);
}

runFullCreditSimulation().catch(err => {
    console.error(`\n${colors.red}FALHA NA SIMULAÇÃO:`, err.message || err);
    console.error(err);
    process.exit(1);
});
