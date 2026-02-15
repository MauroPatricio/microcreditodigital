import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';

class ContractService {
    /**
     * Gera um PDF de contrato baseado nos dados do crédito
     * @param {string} creditId 
     * @returns {Promise<Buffer>}
     */
    async generateContractPDF(creditId) {
        const credit = await Credit.findById(creditId)
            .populate('client')
            .populate('institution');

        if (!credit) {
            throw new Error('Crédito não encontrado');
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(20).text('CONTRATO DE MÚTUO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Contrato Nº: ${credit._id.toString().toUpperCase()}`, { align: 'right' });
            doc.text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, { align: 'right' });
            doc.moveDown();

            // Partes
            doc.fontSize(12).text('1. AS PARTES', { underline: true });
            doc.fontSize(10).text(`MUTUANTE: ${credit.institution.name}`);
            doc.text(`Endereço: ${credit.institution.address?.street}, ${credit.institution.address?.city}`);
            doc.text(`Email: ${credit.institution.email}`);
            doc.moveDown(0.5);
            doc.text(`MUTUÁRIO: ${credit.client.name}`);
            doc.text(`Documento de Identidade: ${credit.client.identityDocument}`);
            doc.text(`Telefone: ${credit.client.phone}`);
            doc.text(`Endereço: ${credit.client.address || 'Não especificado'}`);
            doc.moveDown();

            // Objeto
            doc.fontSize(12).text('2. OBJETO DO CONTRATO', { underline: true });
            doc.fontSize(10).text(`O presente contrato tem por objeto o empréstimo (mútuo) do valor de ${this.formatCurrency(credit.approvedAmount)}.`);
            doc.moveDown();

            // Condições Financeiras
            doc.fontSize(12).text('3. CONDIÇÕES FINANCEIRAS', { underline: true });
            doc.fontSize(10).text(`Valor do Empréstimo: ${this.formatCurrency(credit.approvedAmount)}`);
            doc.text(`Taxa de Juros Mensal: ${credit.interestRate}%`);
            doc.text(`Prazo: ${credit.term} meses`);
            doc.text(`Valor da Parcela Mensal: ${this.formatCurrency(credit.monthlyPayment)}`);
            doc.text(`Total a Pagar: ${this.formatCurrency(credit.totalPayable)}`);
            doc.moveDown();

            // Obrigações
            doc.fontSize(12).text('4. OBRIGAÇÕES DO MUTUÁRIO', { underline: true });
            doc.fontSize(10).text('a) Proceder ao pagamento pontual das prestações mensais estabelecidas.');
            doc.text('b) Utilizar o crédito para os fins declarados na solicitação.');
            doc.text('c) Informar qualquer alteração de dados cadastrais ou situação financeira.');
            doc.moveDown();

            // Inadimplência
            doc.fontSize(12).text('5. INADIMPLÊNCIA', { underline: true });
            doc.fontSize(10).text('O não pagamento de qualquer prestação no seu vencimento implicará em:');
            doc.text('a) Vencimento antecipado de toda a dívida.');
            doc.text('b) Aplicação de multa por atraso conforme política da instituição.');
            doc.text('c) Registro nos órgãos de proteção ao crédito.');
            doc.moveDown();

            // Assinaturas
            doc.moveDown(4);
            doc.fontSize(10).text('__________________________________________', { align: 'center' });
            doc.text(credit.institution.name, { align: 'center' });
            doc.text('Pelo Mutuante', { align: 'center' });

            doc.moveDown(2);
            doc.text('__________________________________________', { align: 'center' });
            doc.text(credit.client.name, { align: 'center' });
            doc.text('Pelo Mutuário', { align: 'center' });

            doc.end();
        });
    }

    /**
     * Upload de PDF para storage local (ou Cloudinary opcionalmente)
     * @param {Buffer} buffer 
     * @param {string} fileName 
     * @returns {Promise<string>}
     */
    async uploadToLocal(buffer, fileName) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'contracts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, buffer);

        // Retorna o caminho relativo ou URL
        return `/uploads/contracts/${fileName}`;
    }

    /**
     * Formata valor para moeda local
     * @param {number} value 
     * @returns {string}
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    }

    /**
     * Simula o envio de contrato para assinatura
     */
    async sendForSignature(contractId, email) {
        // Implementar integração real com provider de assinatura
        console.log(`Enviando contrato ${contractId} para assinatura: ${email}`);
        return {
            success: true,
            signatureId: `sig_${Math.random().toString(36).substr(2, 9)}`,
            signatureUrl: `https://credismartplus.com/sign/${contractId}`
        };
    }
}

export default new ContractService();
