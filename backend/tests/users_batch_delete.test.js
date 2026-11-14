import { jest } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

describe('Users Batch Deletion & Bulk Management Test Suite', () => {
    let superAdminToken;
    let ownerToken;
    let ownerUser;
    let createdUserIds = [];

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
            fetchOptions.body = JSON.stringify(options.body);
        }

        const res = await fetch(url, fetchOptions);
        let data = null;
        try {
            data = await res.json();
        } catch (_) {}
        return { status: res.status, ok: res.ok, data };
    };

    beforeAll(async () => {
        // 1. Login como Super Admin
        const saLogin = await apiCall('/auth/login', {
            method: 'POST',
            body: {
                email: 'mauro.patricio1@gmail.com',
                password: 'Patrick2019#',
            },
        });

        expect(saLogin.status).toBe(200);
        superAdminToken = saLogin.data.data.token;

        // 2. Registar um Owner com instituição
        const ownerEmail = `batch_owner_${uniqueSuffix}@credismart.mz`;
        const ownerReg = await apiCall('/auth/register', {
            method: 'POST',
            body: {
                name: 'Batch Owner Test',
                email: ownerEmail,
                password: 'Password123!',
                phone: `84${Math.floor(1000000 + Math.random() * 9000000)}`,
                identityDocument: 'B' + Math.floor(10000000 + Math.random() * 90000000) + 'P',
                dateOfBirth: '1988-06-15',
                role: 'owner',
                institutionName: `Inst Batch ${uniqueSuffix}`,
                institutionNuit: '400' + Math.floor(100000 + Math.random() * 900000),
            },
        });

        expect(ownerReg.status).toBe(201);
        ownerToken = ownerReg.data.data.token;
        ownerUser = ownerReg.data.data.user;
    });

    afterAll(async () => {
        if (createdUserIds.length > 0 && superAdminToken) {
            await apiCall('/users/batch-delete', {
                method: 'POST',
                token: superAdminToken,
                body: { userIds: createdUserIds }
            }).catch(() => {});
        }
    });

    it('1. Deve criar múltiplos utilizadores para testar o fluxo de remoção', async () => {
        const u1 = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: {
                name: `User Removivel 1 ${uniqueSuffix}`,
                email: `del1_${uniqueSuffix}@test.mz`,
                password: 'Password123!',
                role: 'agent',
                phone: `841${Math.floor(100000 + Math.random() * 900000)}`,
            }
        });

        const u2 = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: {
                name: `User Removivel 2 ${uniqueSuffix}`,
                email: `del2_${uniqueSuffix}@test.mz`,
                password: 'Password123!',
                role: 'financial',
                phone: `842${Math.floor(100000 + Math.random() * 900000)}`,
            }
        });

        const u3 = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: {
                name: `User Preservado 3 ${uniqueSuffix}`,
                email: `del3_${uniqueSuffix}@test.mz`,
                password: 'Password123!',
                role: 'analyst',
                phone: `843${Math.floor(100000 + Math.random() * 900000)}`,
            }
        });

        expect(u1.status).toBe(201);
        expect(u2.status).toBe(201);
        expect(u3.status).toBe(201);

        createdUserIds = [u1.data.data._id, u2.data.data._id, u3.data.data._id];
        expect(createdUserIds.length).toBe(3);
    });

    it('2. Deve rejeitar pedido de remoção em lote sem IDs ou com lista vazia (400)', async () => {
        const res = await apiCall('/users/batch-delete', {
            method: 'POST',
            token: ownerToken,
            body: { userIds: [] }
        });

        expect(res.status).toBe(400);
        expect(res.data.success).toBe(false);
    });

    it('3. Deve impedir que o utilizador autenticado se auto-elimine em lote (400)', async () => {
        if (!ownerUser?._id) return;

        const res = await apiCall('/users/batch-delete', {
            method: 'POST',
            token: ownerToken,
            body: { userIds: [ownerUser._id] }
        });

        expect(res.status).toBe(400);
        expect(res.data.success).toBe(false);
        expect(res.data.message).toMatch(/próprio/i);
    });

    it('4. Owner elimina com sucesso utilizadores selecionados via batch-delete', async () => {
        const idsToRemove = [createdUserIds[0], createdUserIds[1]];

        const res = await apiCall('/users/batch-delete', {
            method: 'POST',
            token: ownerToken,
            body: { userIds: idsToRemove }
        });

        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.deletedCount).toBe(2);

        // Verificar que os dois foram eliminados e o terceiro foi preservado
        const checkU1 = await apiCall(`/users/${createdUserIds[0]}`, { token: ownerToken });
        const checkU2 = await apiCall(`/users/${createdUserIds[1]}`, { token: ownerToken });
        const checkU3 = await apiCall(`/users/${createdUserIds[2]}`, { token: ownerToken });

        expect(checkU1.status).toBe(404);
        expect(checkU2.status).toBe(404);
        expect(checkU3.status).toBe(200);
    });

    it('5. Super Admin tem permissão para eliminar utilizadores em lote globalmente', async () => {
        // Criar utilizador temporário
        const temp = await apiCall('/users', {
            method: 'POST',
            token: ownerToken,
            body: {
                name: `Temp SuperAdmin Del ${uniqueSuffix}`,
                email: `temp_sa_${uniqueSuffix}@test.mz`,
                password: 'Password123!',
                role: 'agent',
                phone: `849${Math.floor(100000 + Math.random() * 900000)}`,
            }
        });

        expect(temp.status).toBe(201);
        const tempId = temp.data.data._id;

        const res = await apiCall('/users/batch-delete', {
            method: 'POST',
            token: superAdminToken,
            body: { userIds: [tempId] }
        });

        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
        expect(res.data.deletedCount).toBe(1);

        const check = await apiCall(`/users/${tempId}`, { token: superAdminToken });
        expect(check.status).toBe(404);
    });
});
