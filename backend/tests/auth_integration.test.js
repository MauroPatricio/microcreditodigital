import { jest } from '@jest/globals';

// Use real middleware variables but mock environment
process.env.JWT_SECRET = 'test_secret_123';
process.env.JWT_EXPIRE = '1h';

// Explicit Mock for User model
jest.unstable_mockModule('../src/models/User.js', () => {
    const mockUserInstance = {
        save: jest.fn(),
        comparePassword: jest.fn(),
        toJSON: jest.fn(),
        isBlocked: false
    };

    // Default export must be the model constructor/function
    const MockUser = jest.fn(() => mockUserInstance);
    // Attach static methods to the default export
    MockUser.findOne = jest.fn();
    MockUser.findById = jest.fn();
    MockUser.create = jest.fn();

    return {
        default: MockUser
    };
});

// Dynamic imports
const { default: request } = await import('supertest');
const { default: express } = await import('express');
const { default: jwt } = await import('jsonwebtoken');
const { default: authRoutes } = await import('../src/routes/auth.js');
const { default: User } = await import('../src/models/User.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Integration (Mocked DB)', () => {
    let userData;

    beforeEach(() => {
        userData = {
            name: 'Integration User',
            email: 'integration@example.com',
            phone: '820000000',
            password: 'password123',
            identityDocument: '110100100100C',
            dateOfBirth: '1990-01-01',
            address: 'Maputo'
        };
        jest.clearAllMocks();

        // Setup instance behavior
        User.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true),
            comparePassword: jest.fn().mockResolvedValue(true),
            toJSON: jest.fn().mockReturnValue({ ...userData, _id: 'integrationUserId' })
        }));

        // Setup findById default (used by protect middleware)
        User.findById.mockResolvedValue({
            ...userData,
            _id: 'integrationUserId',
            role: 'client',
            isBlocked: false
        });
    });

    it('should allow access to protected route with valid token', async () => {
        // Mock Login Flow
        const mockUser = {
            ...userData,
            _id: 'integrationUserId',
            role: 'client',
            isBlocked: false,
            comparePassword: jest.fn().mockResolvedValue(true),
            save: jest.fn(),
            toJSON: () => ({ ...userData, _id: 'integrationUserId' })
        };

        // Mock findOne for login
        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        User.findOne.mockReturnValue({ select: mockSelect });

        // 1. Login to get token
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        if (!loginRes.body.success) {
            console.error('Login Response:', JSON.stringify(loginRes.body, null, 2));
        }

        const token = loginRes.body.data && loginRes.body.data.token;
        expect(token).toBeDefined();

        // 2. Access protected route
        const meRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(meRes.statusCode).toBe(200);
        expect(meRes.body.success).toBe(true);
        expect(meRes.body.data.user.email).toBe(userData.email);
    });

    it('should deny access without token', async () => {
        const res = await request(app)
            .get('/api/auth/me');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should deny access with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken123');

        expect(res.statusCode).toBe(401);
    });

    it('should deny access with expired token', async () => {
        const expiredToken = jwt.sign(
            { id: 'someid' },
            process.env.JWT_SECRET,
            { expiresIn: '-1s' }
        );

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.statusCode).toBe(401);
    });
});
