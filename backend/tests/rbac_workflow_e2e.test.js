import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'test_secret_rbac_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_rbac_123';

const {
    checkUserPermission,
    requirePermission,
    enforceSegregationOfDuties,
    requireApprovalLimit,
    PERMISSIONS_CATALOG,
    DEFAULT_ROLE_PERMISSIONS
} = await import('../src/middleware/rbac.js');

describe('RBAC & Credit Workflow Unit and Integration Suite', () => {

    describe('1. Catalog & Default Permissions Coverage for 10 Roles', () => {

        it('should have PERMISSIONS_CATALOG populated with modules and actions', () => {
            expect(PERMISSIONS_CATALOG).toBeDefined();
            expect(PERMISSIONS_CATALOG.length).toBeGreaterThan(0);
            
            const moduleNames = PERMISSIONS_CATALOG.map(m => m.module);
            expect(moduleNames).toContain('clientes');
            expect(moduleNames).toContain('creditos');
            expect(moduleNames).toContain('pagamentos');
            expect(moduleNames).toContain('cobrancas');
            expect(moduleNames).toContain('relatorios');
            expect(moduleNames).toContain('utilizadores');
            expect(moduleNames).toContain('auditoria');
        });

        it('should verify permissions for Super Admin', async () => {
            const superAdminUser = { role: 'super_admin' };
            expect(await checkUserPermission(superAdminUser, 'clientes.delete')).toBe(true);
            expect(await checkUserPermission(superAdminUser, 'creditos.approve')).toBe(true);
            expect(await checkUserPermission(superAdminUser, 'any.custom.perm')).toBe(true);
        });

        it('should verify permissions for Agent (Oficial de Crédito)', async () => {
            const agentUser = { role: 'agent' };
            expect(await checkUserPermission(agentUser, 'clientes.create')).toBe(true);
            expect(await checkUserPermission(agentUser, 'creditos.create')).toBe(true);
            expect(await checkUserPermission(agentUser, 'creditos.approve')).toBe(false);
            expect(await checkUserPermission(agentUser, 'creditos.disburse')).toBe(false);
        });

        it('should verify permissions for Credit Analyst (Analista de Crédito)', async () => {
            const analystUser = { role: 'analyst' };
            expect(await checkUserPermission(analystUser, 'creditos.analyze')).toBe(true);
            expect(await checkUserPermission(analystUser, 'creditos.recommend')).toBe(true);
            expect(await checkUserPermission(analystUser, 'creditos.approve')).toBe(false);
            expect(await checkUserPermission(analystUser, 'creditos.disburse')).toBe(false);
        });

        it('should verify permissions for Approver (Comité de Crédito)', async () => {
            const approverUser = { role: 'approver' };
            expect(await checkUserPermission(approverUser, 'creditos.approve')).toBe(true);
            expect(await checkUserPermission(approverUser, 'creditos.reject')).toBe(true);
            expect(await checkUserPermission(approverUser, 'creditos.disburse')).toBe(false);
        });

        it('should verify permissions for Financial (Caixa / Financeiro)', async () => {
            const financialUser = { role: 'financial' };
            expect(await checkUserPermission(financialUser, 'creditos.disburse')).toBe(true);
            expect(await checkUserPermission(financialUser, 'pagamentos.create')).toBe(true);
            expect(await checkUserPermission(financialUser, 'creditos.approve')).toBe(false);
        });

        it('should verify permissions for Collections (Cobranças)', async () => {
            const collectorUser = { role: 'collector' };
            expect(await checkUserPermission(collectorUser, 'cobrancas.view')).toBe(true);
            expect(await checkUserPermission(collectorUser, 'cobrancas.contact')).toBe(true);
            expect(await checkUserPermission(collectorUser, 'cobrancas.negotiate')).toBe(true);
            expect(await checkUserPermission(collectorUser, 'creditos.approve')).toBe(false);
        });

        it('should verify permissions for Customer Support (Atendimento)', async () => {
            const supportUser = { role: 'support' };
            expect(await checkUserPermission(supportUser, 'clientes.view')).toBe(true);
            expect(await checkUserPermission(supportUser, 'clientes.history')).toBe(true);
            expect(await checkUserPermission(supportUser, 'creditos.approve')).toBe(false);
            expect(await checkUserPermission(supportUser, 'creditos.disburse')).toBe(false);
        });

        it('should verify permissions for Auditor', async () => {
            const auditorUser = { role: 'auditor' };
            expect(await checkUserPermission(auditorUser, 'auditoria.view')).toBe(true);
            expect(await checkUserPermission(auditorUser, 'relatorios.view')).toBe(true);
            expect(await checkUserPermission(auditorUser, 'creditos.approve')).toBe(false);
            expect(await checkUserPermission(auditorUser, 'clientes.delete')).toBe(false);
        });

        it('should verify permissions for Client', async () => {
            const clientUser = { role: 'client' };
            expect(await checkUserPermission(clientUser, 'client_area.view')).toBe(true);
            expect(await checkUserPermission(clientUser, 'creditos.approve')).toBe(false);
            expect(await checkUserPermission(clientUser, 'utilizadores.view')).toBe(false);
        });

        it('should support Custom Roles with granular permission overrides', async () => {
            const customUser = {
                role: 'agent',
                customRole: {
                    name: 'Gestor Regional',
                    permissions: ['clientes.view', 'creditos.view', 'creditos.approve']
                }
            };
            expect(await checkUserPermission(customUser, 'creditos.approve')).toBe(true);
            expect(await checkUserPermission(customUser, 'creditos.disburse')).toBe(false);
        });
    });

    describe('2. Segregation of Duties (Maker-Checker)', () => {
        const creatorId = '605c72ef1f0e4b0015b6d111';
        const analystId = '605c72ef1f0e4b0015b6d222';
        const approverId = '605c72ef1f0e4b0015b6d333';

        const dummyCredit = {
            _id: '605c72ef1f0e4b0015b6d999',
            createdBy: creatorId,
            makerChecker: {
                analyzedBy: analystId
            }
        };

        const mockCreditResolver = async () => dummyCredit;

        it('should block credit creator from approving the credit (Maker restriction)', async () => {
            const req = {
                user: { _id: creatorId, role: 'approver' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const middleware = enforceSegregationOfDuties(mockCreditResolver);
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('Segregação de Funções: O criador da solicitação não pode aprovar')
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should block analyst from approving the credit (Checker restriction)', async () => {
            const req = {
                user: { _id: analystId, role: 'approver' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const middleware = enforceSegregationOfDuties(mockCreditResolver);
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('Segregação de Funções: O analista que avaliou a solicitação não pode aprovar')
            }));
            expect(next).not.toHaveBeenCalled();
        });

        it('should allow independent approver to approve the credit', async () => {
            const req = {
                user: { _id: approverId, role: 'approver' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const middleware = enforceSegregationOfDuties(mockCreditResolver);
            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('3. Threshold-based Approval Limits', () => {

        it('should allow approval when amount is within user limit', async () => {
            const req = {
                user: { role: 'approver', approvalLimit: 50000 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const amountResolver = async () => 20000;
            const middleware = requireApprovalLimit(amountResolver);
            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block approval when amount exceeds user approval limit', async () => {
            const req = {
                user: { role: 'approver', approvalLimit: 20000 }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();

            const amountResolver = async () => 50000;
            const middleware = requireApprovalLimit(amountResolver);
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('Limite de Aprovação Excedido')
            }));
            expect(next).not.toHaveBeenCalled();
        });
    });
});
