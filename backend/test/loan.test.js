import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/models/Loan.js', () => ({
    default: {
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    }
}));

jest.unstable_mockModule('../src/models/Client.js', () => ({
    default: {
        findById: jest.fn()
    }
}));

describe('Loan Controller Tests', () => {
    let loanController;
    let Loan;
    let Client;

    beforeAll(async () => {
        const loanModule = await import('../src/controllers/loanController.js');
        loanController = loanModule;
        const LoanModule = await import('../src/models/Loan.js');
        Loan = LoanModule.default;
        const ClientModule = await import('../src/models/Client.js');
        Client = ClientModule.default;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get all loans for the logged in user if client', async () => {
        const req = {
            user: { _id: 'client123', role: 'client' },
            query: {}
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        const mockLoans = [{ _id: 'loan1', amount: 5000 }];
        Loan.find.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockResolvedValue(mockLoans)
        });

        await loanController.getLoans(req, res);

        expect(Loan.find).toHaveBeenCalledWith({ client: 'client123' });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                count: 1,
                data: mockLoans
            })
        );
    });
});
