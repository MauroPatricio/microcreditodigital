import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock Mongoose connect/disconnect to avoid trying to connect to a real DB
jest.spyOn(mongoose, 'connect').mockImplementation(() => Promise.resolve());
jest.spyOn(mongoose, 'disconnect').mockImplementation(() => Promise.resolve());

beforeAll(async () => {
    // No-op for DB start
});

afterAll(async () => {
    // No-op for DB stop
});

afterEach(async () => {
    // No cleaning needed as we are mocking
});
