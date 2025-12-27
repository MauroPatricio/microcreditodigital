import { jest } from '@jest/globals';

// Mock middleware
jest.unstable_mockModule('../src/middleware/auth.js', () => ({
    protect: (req, res, next) => {
        req.user = { _id: 'mockUserId', role: 'client' };
        next();
    },
    generateToken: () => 'mockToken',
    generateRefreshToken: () => 'mockRefreshToken',
    verifyRefreshToken: () => ({ id: 'mockUserId' }),
}));

// Mock User model
jest.unstable_mockModule('../src/models/User.js', () => {
    const mockUserInstance = {
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({}),
    };

    const MockUser = jest.fn(() => mockUserInstance);
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
const { default: authRoutes } = await import('../src/routes/auth.js');
const { default: User } = await import('../src/models/User.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes (ESM Mocks)', () => {
    let userData;

    beforeEach(() => {
        userData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '841234567',
            password: 'password123',
            identityDocument: '110100100100B',
            dateOfBirth: '1990-01-01',
            address: 'Maputo'
        };

        jest.clearAllMocks();

        // Setup default mock return for new User()
        User.mockImplementation(() => ({
            save: jest.fn().mockResolvedValue(true),
            comparePassword: jest.fn().mockResolvedValue(true),
            toJSON: jest.fn().mockReturnValue({ ...userData, _id: 'userId' })
        }));
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                ...userData,
                _id: 'newUserId',
                role: 'client',
                toJSON: () => ({ ...userData, _id: 'newUserId', role: 'client' })
            });

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });

        it('should not register a user with existing email', async () => {
            User.findOne.mockResolvedValue({ ...userData });

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser = {
                ...userData,
                _id: 'userId',
                role: 'client',
                isBlocked: false,
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn(),
                toJSON: () => ({ ...userData, _id: 'userId' })
            };

            // Using mockReturnValue for chainable query
            // In controller: const user = await User.findOne(...).select('+password');
            // So User.findOne must return an object with select() method.
            const mockSelect = jest.fn().mockResolvedValue(mockUser);
            User.findOne.mockReturnValue({ select: mockSelect });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
        });
    });
});
