import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
import User from './src/models/User.js';

const testUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findById('6a2d1c4f8de5c6e100254aa9');
        console.log("User role:", user.role);
        console.log("User institution:", user.institution);
        console.log("User activeInstitution:", user.activeInstitution);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

testUser();
