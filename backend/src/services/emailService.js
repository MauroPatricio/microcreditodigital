import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: process.env.EMAIL_USER || 'nhiquelaservicos@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'kuzw tvds iikq elkx',
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Microcrédito Digital" <${process.env.EMAIL_USER || 'nhiquelaservicos@gmail.com'}>`,
                to,
                subject,
                html,
            });
            console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
            // Non-blocking failure
            return { success: false, error: error.message };
        }
    }

    async sendCreditRequestClient(client, credit) {
        if (!client.email) return;
        const html = `
            <h2>Olá, ${client.name}</h2>
            <p>Recebemos a sua solicitação de crédito no valor de <strong>${credit.amount} MT</strong>.</p>
            <p>A sua solicitação encontra-se em análise. Entraremos em contacto em breve.</p>
            <br/>
            <p>Com os melhores cumprimentos,<br/>A Equipa do Microcrédito Digital</p>
        `;
        return this.sendEmail(client.email, 'Confirmação de Solicitação de Crédito', html);
    }

    async sendCreditRequestOwner(ownerEmail, client, credit) {
        if (!ownerEmail) return;
        const html = `
            <h2>Nova Solicitação de Crédito</h2>
            <p>O cliente <strong>${client.name}</strong> solicitou um crédito de <strong>${credit.amount} MT</strong>.</p>
            <p><strong>Detalhes:</strong></p>
            <ul>
                <li>Prazo: ${credit.term} meses</li>
                <li>Telefone: ${client.phone}</li>
                <li>Email: ${client.email || 'Não informado'}</li>
            </ul>
            <p>Aceda ao portal de administração para analisar esta solicitação.</p>
        `;
        return this.sendEmail(ownerEmail, 'Nova Solicitação de Crédito - ' + client.name, html);
    }
}

export default new EmailService();
