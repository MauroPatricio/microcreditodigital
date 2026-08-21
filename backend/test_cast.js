import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
import User from './src/models/User.js';

const testCast = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findById('undefined');
        console.log("User:", user);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        mongoose.disconnect();
    }
};

testCast();
