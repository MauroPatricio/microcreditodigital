import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Check for clients
        const clients = await User.find({ role: 'client' });
        console.log(`Total Clients Found: ${clients.length}`);
        clients.forEach(c => {
            console.log(`- ${c.name} (${c.email || c.phone}) - Inst: ${c.institution}`);
        });

        // Check for owner to see active institution
        const owners = await User.find({ role: 'owner' });
        console.log(`Total Owners: ${owners.length}`);
        owners.forEach(o => {
            console.log(`- ${o.name} - Inst: ${o.institution} - ActiveInst: ${o.activeInstitution}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
