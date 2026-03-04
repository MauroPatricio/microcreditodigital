import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import Credit from '../models/Credit.js';
import ContractTemplate from '../models/ContractTemplate.js';

class ContractService {
    /**
     * Gera um PDF de simulação profissional/corporativo
     * @param {Object} simulationData 
     * @param {Object} user 
     * @returns {Promise<Buffer>}
     */
    async generateSimulationPDF(simulationData, user) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        return new Promise((resolve, reject) => {
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Colors & Styling
            const primaryColor = '#1E3A8A'; // Azul Institucional
            const secondaryColor = '#16A34A'; // Verde Financeiro
            const textColor = '#1e293b';
            const mutedColor = '#64748b';
            const lightBg = '#f8fafc';

            // --- 1. CABEÇALHO INSTITUCIONAL ---
            const institution = user.institution;

            // Logo
            if (institution.settings?.appearance?.logoUrl) {
                try {
                    const cleanPath = institution.settings.appearance.logoUrl.replace(/^\/api\//, '').replace(/^\//, '');
                    let logoPath = path.join(process.cwd(), cleanPath);
                    if (!fs.existsSync(logoPath)) logoPath = path.join(process.cwd(), 'uploads', path.basename(cleanPath));

                    if (fs.existsSync(logoPath)) {
                        doc.image(logoPath, 50, 40, { width: 70 });
                    }
                } catch (e) {
                    console.error("Erro ao carregar logo na Simulação:", e);
                }
            }

            // Institution Details (Left after logo)
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(14).text(institution.name.toUpperCase(), 130, 45);
            doc.fillColor(textColor).font('Helvetica').fontSize(8);
            doc.text(`NUIT: ${institution.nuit || '---'}`, 130, 60);
            doc.text(this.formatAddress(institution.address), 130, 70);
            doc.text(`Contacto: ${institution.phone || '---'} | Email: ${institution.email || '---'}`, 130, 80);
            doc.text(`${institution.website || ''}`, 130, 90);

            // Title & Ref (Right) - Increased Y spacing and width for title
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(16).text('SIMULAÇÃO DE', 350, 45, { width: 200, align: 'right' });
            doc.text('CRÉDITO', 350, 62, { width: 200, align: 'right' });

            doc.fillColor(mutedColor).font('Helvetica').fontSize(9);
            doc.text(`Ref: ${simulationData.simulationNumber || 'SIM-' + Date.now().toString().slice(-6)}`, 350, 82, { width: 200, align: 'right' });
            doc.text(`Data: ${new Date(simulationData.createdAt || Date.now()).toLocaleDateString('pt-MZ')}`, 350, 95, { width: 200, align: 'right' });

            doc.lineWidth(1).moveTo(50, 110).lineTo(545, 110).stroke(primaryColor);
            doc.moveDown(2);

            // --- 2. DADOS DO PROPONENTE ---
            let currentY = 130;
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('1. DADOS DO PROPONENTE', 50, currentY);
            currentY += 15;

            doc.rect(50, currentY, 495, 60).fill(lightBg).stroke('#e2e8f0');
            doc.fillColor(textColor).font('Helvetica-Bold').fontSize(8);

            const clientY = currentY + 10;
            doc.text('NOME COMPLETO:', 60, clientY);
            doc.font('Helvetica').text(simulationData.clientName?.toUpperCase() || '---', 160, clientY);

            doc.font('Helvetica-Bold').text('IDENTIFICAÇÃO:', 60, clientY + 15);
            doc.font('Helvetica').text(simulationData.identityDocument || '---', 160, clientY + 15);

            doc.font('Helvetica-Bold').text('CONTACTO:', 60, clientY + 30);
            doc.font('Helvetica').text(simulationData.phone || '---', 160, clientY + 30);

            doc.font('Helvetica-Bold').text('AGENTE RESPONSÁVEL:', 300, clientY);
            doc.font('Helvetica').text(user.name.toUpperCase(), 400, clientY);

            currentY += 80;

            // --- 3. DETALHES DA OPERAÇÃO ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('2. DETALHES DA OPERAÇÃO FINANCEIRA', 50, currentY);
            currentY += 15;

            // Operation Table
            const periods = { daily: 'Dias', weekly: 'Semanas', biweekly: 'Quinzenas', monthly: 'Meses' };
            const periodLabel = periods[simulationData.periodicity] || 'Meses';

            const opData = [
                ['Valor Solicitado', this.formatCurrency(simulationData.amount), 'Tipo de Juros', 'Composto (Price)'],
                ['Prazo', `${simulationData.term} ${periodLabel}`, 'Data Início', new Date(simulationData.startDate || Date.now()).toLocaleDateString('pt-MZ')],
                ['Taxa de Juros', `${simulationData.interestRate}%`, 'Data Final', simulationData.formattedEndDate || '---'],
                ['Nº de Parcelas', simulationData.term, 'Garantia', simulationData.hasCollateral ? 'Sim' : 'Não']
            ];

            doc.rect(50, currentY, 495, 85).stroke('#e2e8f0');
            let rowY = currentY;
            opData.forEach((row, i) => {
                if (i % 2 === 0) doc.rect(50, rowY, 495, 21.25).fill('#f1f5f9');
                doc.fillColor(mutedColor).font('Helvetica-Bold').fontSize(8).text(row[0], 60, rowY + 7);
                doc.fillColor(textColor).font('Helvetica').text(row[1], 150, rowY + 7);
                doc.fillColor(mutedColor).font('Helvetica-Bold').text(row[2], 300, rowY + 7);
                doc.fillColor(textColor).font('Helvetica').text(row[3], 400, rowY + 7);
                rowY += 21.25;
            });

            currentY += 110;

            // --- 4. RESUMO FINANCEIRO ---
            doc.rect(50, currentY, 495, 60).fill(primaryColor);
            doc.fillColor('#ffffff');

            doc.font('Helvetica').fontSize(8).text('VALOR TOTAL A PAGAR', 65, currentY + 15);
            doc.font('Helvetica-Bold').fontSize(18).text(this.formatCurrency(simulationData.summary?.totalPayable || simulationData.totalPayable), 65, currentY + 28);

            doc.font('Helvetica').fontSize(8).text('VALOR DA PRESTAÇÃO', 320, currentY + 15);
            doc.font('Helvetica-Bold').fontSize(18).text(this.formatCurrency(simulationData.summary?.paymentAmount || simulationData.paymentAmount), 320, currentY + 28);

            currentY += 80;

            // --- 5. TABELA DE AMORTIZAÇÃO ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('3. CRONOGRAMA ESTIMADO DE REEMBOLSO', 50, currentY);
            currentY += 15;

            // Table Header
            doc.rect(50, currentY, 495, 20).fill(primaryColor);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7);
            doc.text('PARCELA', 55, currentY + 7);
            doc.text('VENCIMENTO', 110, currentY + 7);
            doc.text('CAPITAL', 190, currentY + 7, { width: 80, align: 'right' });
            doc.text('JUROS', 280, currentY + 7, { width: 80, align: 'right' });
            doc.text('TOTAL', 370, currentY + 7, { width: 80, align: 'right' });
            doc.text('SALDO DEVEDOR', 460, currentY + 7, { width: 80, align: 'right' });

            currentY += 20;
            doc.fillColor(textColor).font('Helvetica').fontSize(7);

            const schedule = simulationData.schedule || [];
            schedule.forEach((item, index) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }

                if (index % 2 !== 0) doc.rect(50, currentY, 495, 15).fill('#f8fafc');

                doc.fillColor(textColor).text(item.number.toString(), 55, currentY + 4);
                doc.text(new Date(item.dueDate).toLocaleDateString('pt-MZ'), 110, currentY + 4);
                doc.text(this.formatCurrency(item.principal), 190, currentY + 4, { width: 80, align: 'right' });
                doc.text(this.formatCurrency(item.interest), 280, currentY + 4, { width: 80, align: 'right' });
                doc.text(this.formatCurrency(item.amount), 370, currentY + 4, { width: 80, align: 'right' });
                doc.text(this.formatCurrency(item.balance), 460, currentY + 4, { width: 80, align: 'right' });

                currentY += 15;
            });

            currentY += 20;

            // --- 6. CONDIÇÕES GERAIS ---
            if (currentY > 650) { doc.addPage(); currentY = 50; }

            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('4. CONDIÇÕES GERAIS E AVISOS', 50, currentY);
            currentY += 15;
            doc.fillColor(mutedColor).font('Helvetica').fontSize(7);
            const condicoes = [
                "• Esta simulação tem caráter puramente informativo e não representa um compromisso contratual de aprovação.",
                "• A taxa de mora em caso de atraso é de 5% sobre o valor da parcela acumulada.",
                "• Custos administrativos de processamento de dossier podem ser aplicados no acto do desembolso.",
                "• A validade desta simulação é de 5 dias úteis a contar da data de emissão."
            ];
            condicoes.forEach(c => {
                doc.text(c, 60, currentY, { width: 480 });
                currentY += 12;
            });

            currentY += 20;

            // --- 7. NÍVEL DE CONFIANÇA ---
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('5. ANÁLISE PRELIMINAR DE CRÉDITO', 50, currentY);
            currentY += 15;

            const conf = simulationData.confidenceLevel || { level: 3, label: 'Moderado', percentage: 50 };

            // Map colors as requested
            const levelColors = {
                1: '#DC2626', // Muito Arriscado
                2: '#F97316', // Arriscado
                3: '#EAB308', // Moderado
                4: '#2563EB', // Confiável
                5: '#16A34A'  // Seguro
            };
            const confColor = levelColors[conf.level] || '#EAB308';

            doc.rect(50, currentY, 495, 45).stroke('#e2e8f0');
            doc.fillColor(textColor).font('Helvetica').fontSize(8).text('Nível de Confiança:', 65, currentY + 18);
            doc.fillColor(confColor).font('Helvetica-Bold').fontSize(11).text(`${conf.label?.toUpperCase() || 'MODERADO'}`, 160, currentY + 16);

            // Draw visual bars (1 to 5)
            const barStartX = 350;
            const barY = currentY + 15;
            for (let i = 1; i <= 5; i++) {
                doc.rect(barStartX + (i - 1) * 25, barY, 20, 15);
                if (i <= conf.level) {
                    doc.fillAndStroke(confColor, '#ffffff');
                } else {
                    doc.fillAndStroke('#e2e8f0', '#ffffff');
                }
            }

            doc.fillColor(mutedColor).font('Helvetica-Oblique').fontSize(7).text('Esta análise é baseada no comportamento histórico e dados fornecidos.', 65, currentY + 32);

            currentY += 70;

            // --- 8. ASSINATURAS ---
            if (currentY > 750) { doc.addPage(); currentY = 50; }

            doc.lineWidth(0.5).moveTo(70, currentY + 40).lineTo(230, currentY + 40).stroke('#000');
            doc.moveTo(320, currentY + 40).lineTo(480, currentY + 40).stroke('#000');

            doc.fillColor(textColor).font('Helvetica').fontSize(8);
            doc.text('ASSINATURA DO CLIENTE', 70, currentY + 45, { width: 160, align: 'center' });
            doc.text('PELO MICROCRÉDITO (CARIMBO)', 320, currentY + 45, { width: 160, align: 'center' });

            doc.end();
        });
    }

    /**
     * Gera um PDF de contrato baseado num template dinâmico
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

            if (credit.institution.settings?.appearance?.logoUrl) {
                try {
                    const cleanPath = credit.institution.settings.appearance.logoUrl.replace(/^\/api\//, '').replace(/^\//, '');
                    let logoPath = path.join(process.cwd(), cleanPath);
                    if (!fs.existsSync(logoPath)) logoPath = path.join(process.cwd(), 'uploads', path.basename(cleanPath));
                    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 80 });
                } catch (e) { console.error("Erro ao carregar logo no PDF:", e); }
            }

            doc.fontSize(18).text(template?.title || 'CONTRATO DE MÚTUO', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Contrato Nº: ${credit._id.toString().toUpperCase()}`, { align: 'right' });
            doc.text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(10).text(content, { align: 'justify' });

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
        return `Pelo presente instrumento particular de contrato de mútuo, de um lado ${credit.institution.name} (MUTUANTE) e de outro lado ${credit.client.name} (MUTUÁRIO)...`;
    }

    formatAddress(address) {
        if (!address) return 'Endereço não definido';
        if (typeof address === 'string') return address;
        // Assume object from MongoDB
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.province) parts.push(address.province);
        if (address.country) parts.push(address.country);
        return parts.join(', ') || 'Endereço não definido';
    }

    formatCurrency(value) {
        return `${new Intl.NumberFormat('pt-MZ').format(value || 0)} MT`;
    }

    /**
     * Faz o upload local de um buffer de PDF
     * @param {Buffer} buffer 
     * @param {string} fileName 
     * @returns {Promise<string>}
     */
    async uploadToLocal(buffer, fileName) {
        const uploadPath = path.join(process.cwd(), 'uploads', 'contracts');

        // Garantir que a pasta existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        const filePath = path.join(uploadPath, fileName);
        await fs.promises.writeFile(filePath, buffer);

        // Retorna a URL relativa para acesso via API
        return `/uploads/contracts/${fileName}`;
    }

    /**
     * Simula o envio de um contrato para assinatura digital
     * @param {string} contractId 
     * @param {string} email 
     * @returns {Promise<Object>}
     */
    async sendForSignature(contractId, email) {
        // Mock de integração com serviço tipo DocuSign / HelloSign
        return {
            signatureId: `sig_${Math.random().toString(36).substring(7)}`,
            signatureUrl: `https://sign.microcredito.co.mz/sign/${contractId}`
        };
    }
}

export default new ContractService();
