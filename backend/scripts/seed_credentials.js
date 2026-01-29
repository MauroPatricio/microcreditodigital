import axios from 'axios';

// O usuário alterou a porta para 4000 no index.js
const API_URL = 'http://localhost:4000/api';

const seed = async () => {
    console.log('🚀 Iniciando geração de credenciais de teste...');

    try {
        // 1. Registrar Instituição e Administrador (Owner)
        console.log('\n--- Criando Administrador (Owner) ---');
        const ownerData = {
            name: 'Mauro Patrício',
            email: 'admin@credismart.com',
            phone: '840000001',
            password: 'admin123',
            identityDocument: 'A000000001',
            dateOfBirth: '1990-01-01',
            address: {
                city: 'Maputo',
                province: 'Maputo Cidade'
            },
            role: 'owner',
            institutionName: 'CrediSmart Microcrédito',
            institutionNuit: '400500600'
        };

        const ownerRes = await axios.post(`${API_URL}/auth/register`, ownerData);
        console.log('✅ Administrador registrado com sucesso!');
        console.log('   Email: admin@credismart.com');
        console.log('   Senha: admin123');

        // 2. Registrar um Cliente para teste
        console.log('\n--- Criando Cliente de Teste ---');
        const clientData = {
            name: 'João Manuel',
            email: 'cliente@exemplo.com',
            phone: '820000001',
            password: 'cliente123',
            identityDocument: 'B000000002',
            dateOfBirth: '1995-05-20',
            address: {
                city: 'Matola',
                province: 'Maputo'
            },
            role: 'client'
        };

        const clientRes = await axios.post(`${API_URL}/auth/register`, clientData);
        console.log('✅ Cliente registrado com sucesso!');
        console.log('   Email: cliente@exemplo.com');
        console.log('   Senha: cliente123');

    } catch (error) {
        console.error('\n❌ Erro ao gerar credenciais:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Mensagem:', error.message);
        }
        console.log('\n💡 Dica: Verifique se o servidor backend está rodando na porta 4000.');
    }
};

seed();
