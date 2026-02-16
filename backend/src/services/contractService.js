import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Credit from '../models/Credit.js';
import ContractTemplate from '../models/ContractTemplate.js';

class ContractService {
    /**
     * Gera um PDF de contrato baseado num template dinâmico
     * @param {string} creditId 
     * @param {string} templateName 
     * @returns {Promise<Buffer>}
     */
    async generateContractPDF(creditId, templateName = 'standard_loan') {
        const credit = await Credit.findById(creditId)
            .populate('client')
            .populate('institution');

        if (!credit) throw new Error('Crédito não encontrado');

        const template = await ContractTemplate.findOne({
            institution: credit.institution._id,
            name: templateName,
            isActive: true
        });

        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];

        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const content = template ? this.parseTemplate(template.content, credit) : this.getDefaultContent(credit);

            // Header com Logo (se existir)
            if (credit.institution.settings?.appearance?.logoUrl) {
                // doc.image(...) logic
            }

            doc.fontSize(18).text(template?.title || 'CONTRATO DE MÚTUO', { align: 'center' });
            doc.moveDown();

            doc.fontSize(10).text(`Contrato Nº: ${credit._id.toString().toUpperCase()}`, { align: 'right' });
            doc.text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, { align: 'right' });
            doc.moveDown();

            doc.fontSize(10).text(content, { align: 'justify' });

            // Área de Assinatura
            doc.moveDown(4);
            doc.text('__________________________________________', { align: 'center' });
            doc.text(credit.institution.name, { align: 'center' });

            doc.moveDown(2);
            doc.text('__________________________________________', { align: 'center' });
            doc.text(credit.client.name, { align: 'center' });
            doc.text('Assinatura do Mutuário', { align: 'center' });

            doc.end();
        });
    }

    parseTemplate(content, credit) {
        let parsed = content;
        const tags = {
            '{{client_name}}': credit.client.name,
            '{{client_id}}': credit.client.identityDocument,
            '{{amount}}': this.formatCurrency(credit.approvedAmount),
            '{{interest}}': `${credit.interestRate}%`,
            '{{term}}': `${credit.term} meses`,
            '{{monthly_payment}}': this.formatCurrency(credit.monthlyPayment),
            '{{institution_name}}': credit.institution.name,
            '{{nuit}}': credit.institution.nuit
        };

        Object.keys(tags).forEach(tag => {
            parsed = parsed.replace(new RegExp(tag, 'g'), tags[tag]);
        });
        return parsed;
    }

    getDefaultContent(credit) {
        return `Pelo presente instrumento particular de contrato de mútuo, de um lado ${credit.institution.name} (MUTUANTE)...`;
    }

    async uploadToLocal(buffer, fileName) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'contracts');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        await fs.promises.writeFile(filePath, buffer);
        return `/uploads/contracts/${fileName}`;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    }
}

export default new ContractService();
