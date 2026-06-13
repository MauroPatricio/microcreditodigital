import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';

dotenv.config();

(async () => {
    await connectDB();
    // Atualizar email de mauropatricio2@gmail.com para mauro.patricio2@gmail.com
    const result = await User.updateOne(
        { email: 'mauropatricio2@gmail.com' },
        { $set: { email: 'mauro.patricio2@gmail.com' } }
    );
    console.log('Update result:', result);
    process.exit(0);
})();
