import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import User from './models/User.js';
import Institution from './models/Institution.js';

const seedAllAdmins = async () => {
    try {
        console.log('A conectar ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conexão ao MongoDB estabelecida com sucesso.');

        // 1. Garantir que existe a instituição principal com subscrição ativa
        let institution = await Institution.findOne({
            $or: [
                { name: 'Microcrédito Central' },
                { nuit: '400999001' }
            ]
        });

        const tempOwnerId = new mongoose.Types.ObjectId();

        if (!institution) {
            console.log('A criar instituição principal...');
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 2);

            institution = await Institution.create({
                name: 'Microcrédito Central',
                nuit: '400999001',
                email: 'instituicao@microcredito.co.mz',
                owner: tempOwnerId,
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
            institution.isActive = true;
            if (!institution.subscription || institution.subscription.status !== 'active') {
                const expiry = new Date();
                expiry.setFullYear(expiry.getFullYear() + 2);
                institution.subscription = {
                    plan: 'premium',
                    status: 'active',
                    expiresAt: expiry
                };
            }
            await institution.save();
        }

        // 2. Criar / Atualizar Super Admin (mauro.patricio1@gmail.com)
        const superAdminEmail = 'mauro.patricio1@gmail.com';
        const superAdminPassword = 'Patrick2019#';
        let superAdmin = await User.findOne({ email: superAdminEmail });

        if (superAdmin) {
            console.log(`A atualizar Super Admin (${superAdminEmail})...`);
            superAdmin.password = superAdminPassword;
            superAdmin.role = 'super_admin';
            superAdmin.activeInstitution = institution._id;
            superAdmin.institution = institution._id;
            superAdmin.isBlocked = false;
            superAdmin.isVerified = true;
            await superAdmin.save();
            console.log('Super Admin atualizado com sucesso!');
        } else {
            console.log(`A criar novo Super Admin (${superAdminEmail})...`);
            superAdmin = new User({
                name: 'Mauro Patrício',
                email: superAdminEmail,
                phone: '+258 84 999 9999',
                password: superAdminPassword,
                role: 'super_admin',
                activeInstitution: institution._id,
                institution: institution._id,
                identityDocument: '123456789X',
                dateOfBirth: new Date('1990-01-01'),
                isBlocked: false,
                isVerified: true
            });
            await superAdmin.save();
            console.log('Super Admin criado com sucesso!');
        }

        // 3. Criar / Atualizar Admin Institucional (admin@example.com)
        const adminEmail = 'admin@example.com';
        const adminPassword = 'Patrick2019#';
        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log(`A atualizar Admin (${adminEmail})...`);
            adminUser.password = adminPassword;
            adminUser.role = 'admin';
            adminUser.institution = institution._id;
            adminUser.activeInstitution = institution._id;
            adminUser.isBlocked = false;
            adminUser.isVerified = true;
            await adminUser.save();
            console.log('Admin atualizado com sucesso!');
        } else {
            console.log(`A criar novo Admin (${adminEmail})...`);
            adminUser = new User({
                name: 'Administrador Local',
                email: adminEmail,
                phone: '+258 84 222 3333',
                password: adminPassword,
                role: 'admin',
                institution: institution._id,
                activeInstitution: institution._id,
                identityDocument: '9988112233B',
                dateOfBirth: new Date('1988-08-20'),
                isBlocked: false,
                isVerified: true
            });
            await adminUser.save();
            console.log('Admin criado com sucesso!');
        }

        // 4. Criar / Atualizar Owner (owner@example.com)
        const ownerEmail = 'owner@example.com';
        const ownerPassword = 'Password123#';
        let ownerUser = await User.findOne({ email: ownerEmail });

        if (ownerUser) {
            console.log(`A atualizar Owner (${ownerEmail})...`);
            ownerUser.password = ownerPassword;
            ownerUser.role = 'owner';
            ownerUser.institution = institution._id;
            ownerUser.activeInstitution = institution._id;
            ownerUser.isBlocked = false;
            ownerUser.isVerified = true;
            await ownerUser.save();
            console.log('Owner atualizado com sucesso!');
        } else {
            console.log(`A criar novo Owner (${ownerEmail})...`);
            ownerUser = new User({
                name: 'Owner Principal',
                email: ownerEmail,
                phone: '+258 84 111 2233',
                password: ownerPassword,
                role: 'owner',
                institution: institution._id,
                activeInstitution: institution._id,
                identityDocument: '110022334455A',
                dateOfBirth: new Date('1985-05-15'),
                isBlocked: false,
                isVerified: true
            });
            await ownerUser.save();
            console.log('Owner criado com sucesso!');
        }

        // Vincular owner à instituição
        institution.owner = ownerUser._id;
        await institution.save();

        console.log('\n=========================================================');
        console.log(' UTILIZADORES EXECUTADOS E ATUALIZADOS NA BASE DE DADOS:');
        console.log('---------------------------------------------------------');
        console.log(' 1. SUPER ADMIN');
        console.log(`    Login: ${superAdminEmail}`);
        console.log(`    Senha: ${superAdminPassword}`);
        console.log(`    Role:  ${superAdmin.role}`);
        console.log('---------------------------------------------------------');
        console.log(' 2. ADMIN (Institucional)');
        console.log(`    Login: ${adminEmail}`);
        console.log(`    Senha: ${adminPassword}`);
        console.log(`    Role:  ${adminUser.role}`);
        console.log(`    Inst.: ${institution.name}`);
        console.log('---------------------------------------------------------');
        console.log(' 3. OWNER (Proprietário)');
        console.log(`    Login: ${ownerEmail}`);
        console.log(`    Senha: ${ownerPassword}`);
        console.log(`    Role:  ${ownerUser.role}`);
        console.log(`    Inst.: ${institution.name}`);
        console.log('=========================================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Erro ao executar seed:', error);
        process.exit(1);
    }
};

seedAllAdmins();

