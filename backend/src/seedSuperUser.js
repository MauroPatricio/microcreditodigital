import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/User.js';
import Institution from './models/Institution.js';

const seedSuperUser = async () => {
    try {
        console.log('A conectar ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexão ao MongoDB estabelecida com sucesso.');

        const email = 'owner@example.com';
        const password = 'Password123#';

        // 1. Obter ou preparar utilizador
        let user = await User.findOne({ email });
        const userId = user ? user._id : new mongoose.Types.ObjectId();

        // 2. Garantir que existe uma instituição ativa para este Owner
        let institution = await Institution.findOne({
            $or: [
                { email: email },
                { name: 'Microcrédito Central' },
                { nuit: '400999001' }
            ]
        });

        if (!institution) {
            console.log('A criar instituição principal vinculada ao Owner...');
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 2); // 2 anos de subscrição

            institution = await Institution.create({
                name: 'Microcrédito Central',
                nuit: '400999001',
                email: email,
                owner: userId,
                phone: '+258 84 000 0000',
                address: {
                    street: 'Av. 24 de Julho',
                    city: 'Maputo',
                    province: 'Maputo',
                    country: 'Moçambique'
                },
                settings: {
                    currency: 'MT',
                    initialBalance: 500000,
                    loanLimits: { min: 500, max: 100000 },
                    interestRates: { default: 15, penaltyRate: 1 }
                },
                subscription: {
                    plan: 'premium',
                    status: 'active',
                    expiresAt: expiry
                },
                isActive: true
            });
            console.log('Instituição criada:', institution.name);
        } else {
            institution.owner = userId;
            await institution.save();
        }

        // 3. Salvar o utilizador
        if (user) {
            console.log(`Utilizador ${email} já existe. A atualizar dados...`);
            user.password = password;
            user.role = 'owner';
            user.institution = institution._id;
            user.activeInstitution = institution._id;
            user.isBlocked = false;
            user.isVerified = true;
            await user.save();
            console.log('Utilizador atualizado com sucesso!');
        } else {
            console.log(`A criar novo Super User / Owner (${email})...`);
            user = new User({
                _id: userId,
                name: 'Owner Principal',
                email: email,
                phone: '+258 84 111 2233',
                password: password,
                role: 'owner',
                institution: institution._id,
                activeInstitution: institution._id,
                identityDocument: '110022334455A',
                dateOfBirth: new Date('1985-05-15'),
                isBlocked: false,
                isVerified: true
            });
            await user.save();
            console.log('Super User / Owner criado com sucesso!');
        }

        console.log('\n=============================================');
        console.log(' Credenciais do Super User (Owner) Criadas:');
        console.log(' Email: ' + email);
        console.log(' Senha: ' + password);
        console.log(' Role: ' + user.role);
        console.log(' Instituição: ' + institution.name + ' (' + institution._id + ')');
        console.log(' Subscrição: ' + institution.subscription.plan + ' (' + institution.subscription.status + ')');
        console.log('=============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Erro ao executar seed:', error);
        process.exit(1);
    }
};

seedSuperUser();
