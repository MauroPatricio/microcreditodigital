import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ContractTemplate from './src/models/ContractTemplate.js';
import Institution from './src/models/Institution.js';

dotenv.config();

const seedTemplates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB para seeding...');

        const institutions = await Institution.find();

        for (const inst of institutions) {
            const existing = await ContractTemplate.findOne({ institution: inst._id, name: 'standard_loan' });

            if (!existing) {
                await ContractTemplate.create({
                    institution: inst._id,
                    name: 'standard_loan',
                    title: 'CONTRATO DE MÚTUO FINANCEIRO',
                    content: `
# CONTRATO DE MÚTUO FINANCEIRO

Pelo presente instrumento particular, de um lado **{{institution_name}}**, doravante denominada MUTUANTE, e de outro lado **{{client_name}}**, portador do BI nº **{{client_id}}**, doravante denominado MUTUÁRIO, celebram o presente contrato sob as seguintes cláusulas:

1. **DO OBJETO**: O presente contrato tem por objeto o empréstimo do valor de **{{amount}}**.
2. **DOS JUROS E PRAZO**: O MUTUÁRIO pagará o valor acima em **{{term}}**, com taxa de juros de **{{interest}}**.
3. **DAS PARCELAS**: O valor de cada prestação mensal será de **{{monthly_payment}}**.
4. **DA MORA**: O atraso no pagamento implicará em multa de 10% sobre o valor da parcela.

Assinado digitalmente por ambas as partes.
                    `,
                    placeholders: [
                        { key: '{{client_name}}', description: 'Nome do Cliente' },
                        { key: '{{amount}}', description: 'Valor do Empréstimo' }
                    ]
                });
                console.log(`Template criado para: ${inst.name}`);
            }
        }

        console.log('Seeding concluído!');
        process.exit();
    } catch (error) {
        console.error('Erro no seeding:', error);
        process.exit(1);
    }
};

seedTemplates();
