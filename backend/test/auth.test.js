import { jest } from '@jest/globals';

// Mocking dependencies
jest.unstable_mockModule('../src/models/User.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    }
}));

jest.unstable_mockModule('bcryptjs', () => ({
    default: {
        compare: jest.fn(),
        hash: jest.fn()
    }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jest.fn()
    }
}));

describe('Auth Controller Tests', () => {
    let authController;
    let User;
    let bcrypt;
    let jwt;

    beforeAll(async () => {
        const authModule = await import('../src/controllers/authController.js');
        authController = authModule;
        const UserModule = await import('../src/models/User.js');
        User = UserModule.default;
        const bcryptModule = await import('bcryptjs');
        bcrypt = bcryptModule.default;
        const jwtModule = await import('jsonwebtoken');
        jwt = jwtModule.default;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        const req = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                phone: '123456789'
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            _id: 'userid123',
            name: req.body.name,
            email: req.body.email,
            role: 'client'
        });
        jwt.sign.mockReturnValue('fake-jwt-token');

        await authController.registerUser(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: 'userid123',
                name: 'Test User',
                token: 'fake-jwt-token'
            })
        );
    });

    it('should not register user if email already exists', async () => {
        const req = {
            body: {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                phone: '123456789'
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        User.findOne.mockResolvedValue({ email: 'test@example.com' });

        await expect(authController.registerUser(req, res)).rejects.toThrow('Usuário já existe');
    });
});
