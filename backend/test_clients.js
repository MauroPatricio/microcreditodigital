import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
import User from './src/models/User.js';

const testClients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ role: 'client' });
        console.log("Clients:", users.map(u => u._id + ' - ' + u.name));
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

testClients();
