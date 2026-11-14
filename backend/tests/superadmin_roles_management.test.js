import { jest } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

describe('Super Admin Roles Governance & Profile Description Suite', () => {
    let superAdminToken;
    let ownerToken;
    let createdRoleId;

    const uniqueSuffix = Date.now() + '_' + Math.floor(Math.random() * 1000);

    const apiCall = async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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

    beforeAll(async () => {
        // 1. Login como Super Admin
        const superLogin = await apiCall('/auth/login', {
            method: 'POST',
            body: { email: 'mauro.patricio1@gmail.com', password: 'Patrick2019#' },
        });
        expect(superLogin.status).toBe(200);
        superAdminToken = superLogin.data.data.token;

        // 2. Registrar um Owner comum para testes de permissão
        const ownerEmail = `owner_perm_${uniqueSuffix}@teste.mz`;
        const ownerReg = await apiCall('/auth/register', {
            method: 'POST',
            body: {
                name: 'Gestor Institucional Perm',
                email: ownerEmail,
                password: 'Password123!',
                phone: '84' + Math.floor(1000000 + Math.random() * 9000000),
                identityDocument: 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'P',
                dateOfBirth: '1985-05-10',
                role: 'owner',
                institutionName: `Inst Permissoes ${uniqueSuffix}`,
                institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000),
            },
        });
        expect(ownerReg.status).toBe(201);
        ownerToken = ownerReg.data.data.token;
    });

    test('1. Super Admin consulta todos os perfis e valida que cada perfil tem descrição do que faz', async () => {
        const res = await apiCall('/roles', {
            token: superAdminToken,
        });

        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.isSuperAdmin).toBe(true);
        const roles = res.data.data;
        expect(roles.length).toBeGreaterThanOrEqual(14);

        // Verificar que perfis nativos essenciais possuem descrição
        const analyst = roles.find((r) => r.slug === 'analyst');
        expect(analyst).toBeDefined();
        expect(analyst.description).toMatch(/Triagem|Risco de Crédito|Analista/i);

        const approver = roles.find((r) => r.slug === 'approver');
        expect(approver).toBeDefined();
        expect(approver.description).toMatch(/Comité de Crédito|Aprovador/i);

        const financial = roles.find((r) => r.slug === 'financial');
        expect(financial).toBeDefined();
        expect(financial.description).toMatch(/Tesouraria|desembolso/i);
    });

    test('2. Não-Super-Admin (Owner) é impedido com 403 ao tentar alterar descrição de perfil do sistema', async () => {
        const rolesRes = await apiCall('/roles', { token: ownerToken });
        const analystRole = rolesRes.data.data.find((r) => r.slug === 'analyst');
        expect(analystRole).toBeDefined();

        const editRes = await apiCall(`/roles/${analystRole._id}`, {
            method: 'PUT',
            token: ownerToken,
            body: {
                description: 'Tentativa não autorizada de alteração de descrição.',
            },
        });

        expect(editRes.status).toBe(403);
        expect(editRes.data.success).toBe(false);
        expect(editRes.data.message).toMatch(/Apenas o Super Admin|Acesso negado/i);
    });

    test('3. Super Admin tem permissão exclusiva para descrever o que o perfil faz', async () => {
        const rolesRes = await apiCall('/roles', { token: superAdminToken });
        const analystRole = rolesRes.data.data.find((r) => r.slug === 'analyst');

        const newDescription =
            'Especialista em Triagem e Risco de Crédito: Responsável por avaliar a capacidade financeira do proponente, analisar garantias reais e emitir o parecer técnico inicial.';

        const editRes = await apiCall(`/roles/${analystRole._id}`, {
            method: 'PUT',
            token: superAdminToken,
            body: {
                description: newDescription,
            },
        });

        expect(editRes.status).toBe(200);
        expect(editRes.data.success).toBe(true);
        expect(editRes.data.data.description).toBe(newDescription);
    });

    test('4. Super Admin adiciona novo perfil à plataforma com descrição detalhada', async () => {
        const newRoleName = `Oficial de Risco Climático ${uniqueSuffix}`;
        const newRoleDesc =
            'Responsável pela avaliação de riscos ambientais, mitigação de sinistros em projetos agrícolas e validação de critérios ESG na concessão de microcrédito.';

        const addRes = await apiCall('/roles', {
            method: 'POST',
            token: superAdminToken,
            body: {
                name: newRoleName,
                description: newRoleDesc,
                approvalLimit: 85000,
                isSystem: true,
                permissions: ['creditos.view', 'creditos.analyze', 'relatorios.view'],
            },
        });

        expect(addRes.status).toBe(201);
        expect(addRes.data.success).toBe(true);
        expect(addRes.data.data.name).toBe(newRoleName);
        expect(addRes.data.data.description).toBe(newRoleDesc);
        expect(addRes.data.data.approvalLimit).toBe(85000);
        createdRoleId = addRes.data.data._id;
        expect(createdRoleId).toBeDefined();
    });

    test('5. Não-Super-Admin é impedido de remover perfis do sistema', async () => {
        const delRes = await apiCall(`/roles/${createdRoleId}`, {
            method: 'DELETE',
            token: ownerToken,
        });

        expect(delRes.status).toBe(403);
        expect(delRes.data.success).toBe(false);
    });

    test('6. Super Admin remove o perfil com sucesso', async () => {
        const delRes = await apiCall(`/roles/${createdRoleId}`, {
            method: 'DELETE',
            token: superAdminToken,
        });

        expect(delRes.status).toBe(200);
        expect(delRes.data.success).toBe(true);

        // Confirmar que o perfil foi eliminado da base de dados
        const verifyRes = await apiCall('/roles', { token: superAdminToken });
        const found = verifyRes.data.data.find((r) => r._id === createdRoleId);
        expect(found).toBeUndefined();
    });

    test('7. Proteção do Perfil Soberano: Super Administrador não pode ser eliminado', async () => {
        const rolesRes = await apiCall('/roles', { token: superAdminToken });
        const superAdminRole = rolesRes.data.data.find((r) => r.slug === 'super_admin');
        expect(superAdminRole).toBeDefined();

        const delRes = await apiCall(`/roles/${superAdminRole._id}`, {
            method: 'DELETE',
            token: superAdminToken,
        });

        expect(delRes.status).toBe(400);
        expect(delRes.data.success).toBe(false);
        expect(delRes.data.message).toMatch(/Super Administrador.*não pode ser eliminado/i);
    });
});
