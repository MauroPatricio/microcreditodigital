import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Credit from '../models/Credit.js';
import ContractTemplate from '../models/ContractTemplate.js';

class ContractService {
    /**
     * Gera um PDF de simulação
     * @param {Object} simulationData 
     * @param {Object} user 
     * @returns {Promise<Buffer>}
     */
    async generateSimulationPDF(simulationData, user) {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Logo
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

            // Template-specific header
            if (simulationData.template === 'premium') {
                doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('SIMULAÇÃO DE CRÉDITO', { align: 'center' });
                doc.fontSize(12).font('Helvetica-Bold').text('FINTECH PREMIUM – DOCUMENTO OFICIAL', { align: 'center' });
                doc.moveDown(0.5);
                doc.lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke('#000000');
            } else {
                doc.fontSize(20).text('SIMULAÇÃO DE CRÉDITO', { align: 'center', color: '#00E676' });
            }
            doc.moveDown(2);

            // Period label logic
            const periodLabel = simulationData.periodicity === 'daily' ? 'Dias' : simulationData.periodicity === 'weekly' ? 'Semanas' : simulationData.periodicity === 'biweekly' ? 'Quinzenas' : 'Meses';

            if (simulationData.template === 'premium' && simulationData.clientName) {
                doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('1. IDENTIFICAÇÃO DO CLIENTE', 50, doc.y);
                doc.moveDown(0.5);
                doc.rect(50, doc.y, 500, 40).stroke('#000');
                const startY = doc.y + 10;
                doc.fontSize(8).fillColor('#64748b').text('NOME COMPLETO:', 60, startY);
                doc.fontSize(10).fillColor('#000').text(simulationData.clientName.toUpperCase(), 150, startY);
                doc.fontSize(8).fillColor('#64748b').text('BI / NUIT:', 350, startY);
                doc.fontSize(10).fillColor('#000').text('....................................', 400, startY);
                doc.moveDown(3);
            } else if (simulationData.clientName) {
                doc.fontSize(12).fillColor('#0f172a').font('Helvetica-Bold').text(`Cliente: ${simulationData.clientName}`, { align: 'left' });
                doc.font('Helvetica');
            }

            if (simulationData.template !== 'premium') {
                doc.fontSize(10).fillColor('#64748b').text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, { align: 'right' });
                doc.text(`Instituição: ${user.institution.name}`, { align: 'right' });
                doc.text(`Simulado por: ${user.name}`, { align: 'right' });
                doc.moveDown(2);
            }

            // Section 2: Loan Conditions
            if (simulationData.template === 'premium') {
                doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('2. CONDIÇÕES DO EMPRÉSTIMO');
                doc.moveDown(0.5);
                doc.rect(50, doc.y, 500, 80).stroke('#000');
                const tableY = doc.y;

                // Horizontal line
                doc.moveTo(50, tableY + 40).lineTo(550, tableY + 40).stroke('#000');
                // Vertical line
                doc.moveTo(300, tableY).lineTo(300, tableY + 80).stroke('#000');

                doc.fontSize(8).fillColor('#64748b');
                doc.text('VALOR DO CAPITAL (MT)', 60, tableY + 10);
                doc.text('TAXA DE JUROS (%)', 310, tableY + 10);
                doc.text('PRAZO', 60, tableY + 50);
                doc.text('PERIODICIDADE', 310, tableY + 50);

                doc.fontSize(11).fillColor('#000').font('Helvetica-Bold');
                doc.text(this.formatCurrency(simulationData.amount), 60, tableY + 22);
                doc.text(`${simulationData.interestRate}%`, 310, tableY + 22);
                doc.text(`${simulationData.term} ${periodLabel}`, 60, tableY + 62);
                doc.text((simulationData.periodicity || 'mensal').toUpperCase(), 310, tableY + 62);

                doc.y = tableY + 100;
            } else {
                doc.fillColor('#020617').fontSize(14).text('Resumo Financeiro', { underline: true });
                doc.moveDown(1);
            }

            // Simulation Details Table-like Layout
            if (simulationData.template !== 'premium') {
                doc.fontSize(11);
                const rows = [
                    ['Valor Solicitado:', this.formatCurrency(simulationData.amount)],
                    ['Taxa de Juros:', `${simulationData.interestRate}% ao ${periodLabel.slice(0, -1).toLowerCase()}`],
                    ['Prazo Escolhido:', `${simulationData.term} ${periodLabel}`],
                    ['Valor da Parcela:', this.formatCurrency(simulationData.paymentAmount)],
                    ['Data Final Prevista:', simulationData.formattedEndDate || 'N/A'],
                    ['Total de Juros:', this.formatCurrency(simulationData.totalInterest)],
                    ['Total a Pagar:', this.formatCurrency(simulationData.totalPayable)]
                ];

                let y = doc.y;
                rows.forEach(([label, value]) => {
                    doc.fillColor('#64748b').text(label, 50, y);
                    doc.fillColor('#020617').font('Helvetica-Bold').text(value, 220, y);
                    doc.font('Helvetica');
                    y += 25;
                });
                doc.y = y;
            } else {
                // Premium Summary Section
                doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('3. RESUMO DOS PAGAMENTOS');
                doc.moveDown(0.5);
                const summaryY = doc.y;
                doc.rect(50, summaryY, 500, 100).stroke('#000');

                doc.fontSize(10).font('Helvetica').fillColor('#000');
                doc.text('Total de Juros:', 70, summaryY + 20);
                doc.font('Helvetica-Bold').text(this.formatCurrency(simulationData.totalInterest), 180, summaryY + 20);

                doc.font('Helvetica').text('Data Final:', 70, summaryY + 40);
                doc.font('Helvetica-Bold').text(simulationData.formattedEndDate || 'N/A', 180, summaryY + 40);

                doc.fontSize(12).text('TOTAL A PAGAR:', 70, summaryY + 70);
                doc.fontSize(14).text(this.formatCurrency(simulationData.totalPayable), 180, summaryY + 68);

                // Highlight box for installment
                doc.rect(340, summaryY + 15, 180, 70).fill('#000');
                doc.fillColor('#fff').fontSize(8).font('Helvetica').text('VALOR DA PRESTAÇÃO', 350, summaryY + 25, { width: 160, align: 'center' });
                doc.fontSize(18).font('Helvetica-Bold').text(this.formatCurrency(simulationData.paymentAmount), 350, summaryY + 45, { width: 160, align: 'center' });

                doc.y = summaryY + 120;
            }

            doc.moveDown(2);
            doc.fillColor('#020617').fontSize(11).font('Helvetica-Bold').text('Observações:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text(simulationData.explanation || 'N/A', { align: 'left' });

            if (simulationData.template === 'premium') {
                doc.moveDown(5);
                const footerY = doc.y;
                doc.lineWidth(1).moveTo(60, footerY).lineTo(230, footerY).stroke('#000');
                doc.moveTo(320, footerY).lineTo(490, footerY).stroke('#000');

                doc.fontSize(9).font('Helvetica-Bold').fillColor('#000');
                doc.text('ASSINATURA DO CLIENTE', 60, footerY + 5, { width: 170, align: 'center' });
                doc.text('PELO MICROCRÉDITO (CARIMBO)', 320, footerY + 5, { width: 170, align: 'center' });

                doc.moveDown(3);
                doc.fontSize(8).fillColor('#64748b').text(`Documento emitido em: ${new Date().toLocaleString('pt-MZ')}`, { align: 'center' });
            }

            doc.moveDown(2);
            doc.fontSize(8).fillColor('#94a3b8').text('Esta simulação é apenas informativa e não constitui uma oferta vinculativa de crédito. Todos os pedidos estão sujeitos a análise de risco e aprovação pela instituição.', { align: 'center' });

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
                    const cleanPath = credit.institution.settings.appearance.logoUrl.replace(/^\/api\//, '').replace(/^\//, '');
                    let logoPath = path.join(process.cwd(), cleanPath);
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
