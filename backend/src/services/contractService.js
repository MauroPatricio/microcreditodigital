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

        return this.generatePDF(credit, templateName, 'contract');
    }

    async generateSimulationPDF(simulationData, user) {
        // Mock a credit-like object for the generic generator or create a specific one
        // For simplicity, we'll create a specific generator or reuse logic.
        // Let's create a generic _generatePDFWithLogo helper.

        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Logo Loading Logic (Reused)
            if (user.institution.settings?.appearance?.logoUrl) {
                try {
                    const cleanPath = user.institution.settings.appearance.logoUrl.replace(/^\/api\//, '').replace(/^\//, '');
                    let logoPath = path.join(process.cwd(), cleanPath);
                    if (!fs.existsSync(logoPath)) logoPath = path.join(process.cwd(), 'uploads', path.basename(cleanPath));

                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, 50, 45, { width: 80 });
                    }
                } catch (e) {
                    console.error("Erro ao carregar logo na Simulação:", e);
                }
            }

            const titleY = user.institution.settings?.appearance?.logoUrl ? 110 : 50;

            doc.fontSize(18).text('SIMULAÇÃO DE CRÉDITO', { align: 'center' });
            doc.moveDown();

            doc.fontSize(10).text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, { align: 'right' });
            doc.text(`Simulado por: ${user.name}`, { align: 'right' });
            doc.moveDown(2);

            // Simulation Details
            doc.fontSize(12).text('Detalhes da Simulação', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);

            const rows = [
                ['Valor Solicitado:', this.formatCurrency(simulationData.amount)],
                ['Prazo:', `${simulationData.term} Meses`],
                ['Taxa de Juros:', `${simulationData.interestRate}%`],
                ['Prestação Mensal:', this.formatCurrency(simulationData.monthlyPayment)],
                ['Total a Pagar:', this.formatCurrency(simulationData.totalPayable)],
                ['Total de Juros:', this.formatCurrency(simulationData.totalInterest)]
            ];

            let y = doc.y;
            rows.forEach(([label, value]) => {
                doc.text(label, 50, y);
                doc.text(value, 200, y, { align: 'left' });
                y += 20;
            });

            doc.moveDown(2);
            doc.fontSize(8).text('Nota: Esta simulação não garante a aprovação do crédito. Valores sujeitos a alteração.', { align: 'center' });

            doc.end();
        });
    }

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
        const buffers = [];

        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const content = template ? this.parseTemplate(template.content, credit) : this.getDefaultContent(credit);

            // --- Header com Logo (se existir) ---
            if (credit.institution.settings?.appearance?.logoUrl) {
                try {
                    // Remover prefixo /api se existir e construir caminho absoluto
                    // Assumindo que logoUrl vem como 'uploads/logos/...' ou '/uploads/logos/...'
                    const cleanPath = credit.institution.settings.appearance.logoUrl.replace(/^\/api\//, '').replace(/^\//, '');

                    // Tentar caminho relativo ao backend root
                    let logoPath = path.join(process.cwd(), cleanPath);

                    // Se não encontrar, tentar caminho em 'public' ou 'uploads' diretamente
                    if (!fs.existsSync(logoPath)) {
                        logoPath = path.join(process.cwd(), 'uploads', path.basename(cleanPath));
                    }

                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, 50, 45, { width: 80 });
                    }
                } catch (e) {
                    console.error("Erro ao carregar logo no PDF:", e);
                }
            }

            // Ajustar posição do título se tiver logo
            const titleY = credit.institution.settings?.appearance?.logoUrl ? 110 : 50;

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
