import { jest } from '@jest/globals';
import { mpesaService } from '../src/services/mpesaService.js';
import axios from 'axios';

jest.unstable_mockModule('axios', () => ({
    default: {
        post: jest.fn()
    }
}));

describe('MpesaService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Deve retornar sucesso simulado em ambiente local (não-produção)', async () => {
        process.env.NODE_ENV = 'test';
        
        const payload = {
            amount: 1000,
            phoneNumber: '841234567',
            referenceId: 'REF123456789'
        };

        const result = await mpesaService.executeMpesaPayout(payload);
        
        expect(result.success).toBe(true);
        expect(result.transactionId).toBeDefined();
    });

    test('Deve falhar simulador com prefixo inválido', async () => {
        process.env.NODE_ENV = 'test';
        
        const payload = {
            amount: 1000,
            phoneNumber: '821234567', // Não é 84 ou 85 ou 258
            referenceId: 'REF123456789'
        };

        const result = await mpesaService.executeMpesaPayout(payload);
        
        expect(result.success).toBe(false);
        expect(result.errorMessage).toContain('Prefixo inválido');
    });
});
