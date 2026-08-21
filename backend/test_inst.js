import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
import User from './src/models/User.js';
import Institution from './src/models/Institution.js';

const testInst = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findById('6a2d1c4f8de5c6e100254aa9')
            .populate('institution')
            .populate('activeInstitution');
        
        console.log("Populated User institution:", user.institution ? user.institution._id : 'null');
        console.log("Populated User activeInstitution:", user.activeInstitution ? user.activeInstitution._id : 'null');
        
        const instCount = await Institution.countDocuments();
        console.log("Total institutions:", instCount);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

testInst();
