import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente (Procurar .env na raiz do backend)
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/User.js';

const seedSuperAdmin = async () => {
    try {
        console.log('A conectar ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexão ao MongoDB estabelecida com sucesso.');

        const adminEmail = 'mauro.patricio1@gmail.com';
        const adminData = {
            name: 'Mauro Patrício',
            email: adminEmail,
            phone: '+258 84 999 9999',
            password: 'Patrick2019#',
            role: 'super_admin',
            identityDocument: '123456789X',
            dateOfBirth: new Date('1990-01-01')
        };

        const existingUser = await User.findOne({ email: adminEmail });

        if (existingUser) {
            console.log(`Utilizador com email ${adminEmail} já existe. A actualizar para super_admin...`);
            existingUser.role = 'super_admin';
            existingUser.password = adminData.password;
            await existingUser.save();
            console.log('Utilizador actualizado com sucesso!');
        } else {
            console.log(`A criar novo Super Admin com email ${adminEmail}...`);
            const newUser = new User(adminData);
            await newUser.save();
            console.log('Super Admin criado com sucesso!');
        }
        
        console.log('Seed de Super Admin concluído!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao executar seed:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
