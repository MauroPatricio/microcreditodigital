import nodemailer from 'nodemailer';
import PlatformConfig from '../models/PlatformConfig.js';
import Institution from '../models/Institution.js';

export const normalizeEmailList = (input) => {
    const rawList = Array.isArray(input)
        ? input
        : typeof input === 'string'
            ? input.split(/[,;\s]+/)
            : [];
    const seen = new Set();
    const cleaned = [];
    for (const item of rawList) {
        const email = String(item || '').trim().toLowerCase();
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !seen.has(email)) {
            seen.add(email);
            cleaned.push(email);
        }
    }
    return cleaned;
};

class EmailService {
    constructor() {
        this.defaultUser = process.env.EMAIL_USER || 'nhiquelaservicos@gmail.com';
        this.defaultPass = process.env.EMAIL_PASSWORD || 'kuzw tvds iikq elkx';
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_PORT == 465,
            auth: {
                user: this.defaultUser,
                pass: this.defaultPass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    buildTransporter(smtpCfg = {}) {
        const host = smtpCfg.smtpHost || process.env.EMAIL_HOST || 'smtp.gmail.com';
        const port = Number(smtpCfg.smtpPort || process.env.EMAIL_PORT || 587);
        const secure = smtpCfg.smtpSecure !== undefined ? Boolean(smtpCfg.smtpSecure) : port === 465;
        const user = smtpCfg.smtpUser || this.defaultUser;
        const pass = smtpCfg.smtpPassword || this.defaultPass;
        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
        });
    }

    async resolveSenderConfig({ institutionId = null, overrideConfig = null } = {}) {
        if (overrideConfig && (overrideConfig.smtpUser || overrideConfig.fromEmail || overrideConfig.senderEmail)) {
            const fromEmail = overrideConfig.fromEmail || overrideConfig.senderEmail || overrideConfig.smtpUser || this.defaultUser;
            const fromName = overrideConfig.fromName || overrideConfig.senderName || 'Microcrédito Digital';
            return {
                transporter: (overrideConfig.smtpUser && overrideConfig.smtpPassword)
                    ? this.buildTransporter(overrideConfig)
                    : this.transporter,
                from: `"${fromName}" <${fromEmail}>`,
            };
        }

        try {
            if (institutionId) {
                const inst = await Institution.findById(institutionId);
                const instEmailCfg = inst?.settings?.notificationSettings?.emailConfig;
                if (instEmailCfg && instEmailCfg.smtpUser && instEmailCfg.smtpPassword) {
                    const fromName = instEmailCfg.senderName || inst.name || 'Microcrédito Digital';
                    const fromEmail = instEmailCfg.senderEmail || instEmailCfg.smtpUser;
                    return {
                        transporter: this.buildTransporter(instEmailCfg),
                        from: `"${fromName}" <${fromEmail}>`,
                    };
                }
            }

            const platformCfg = await PlatformConfig.findOne({ key: 'nhiquela_platform' });
            const pEmail = platformCfg?.emailSettings;
            if (pEmail && pEmail.smtpUser && pEmail.smtpPassword) {
                const fromName = pEmail.fromName || 'Nhiquela Microcrédito Digital';
                const fromEmail = pEmail.fromEmail || pEmail.smtpUser;
                return {
                    transporter: this.buildTransporter(pEmail),
                    from: `"${fromName}" <${fromEmail}>`,
                };
            }
        } catch (err) {
            // fallback para transporter padrão
        }

        return {
            transporter: this.transporter,
            from: `"Microcrédito Digital" <${this.defaultUser}>`,
        };
    }

    async sendEmail(to, subject, html, options = {}) {
        try {
            const recipients = normalizeEmailList(to);
            if (recipients.length === 0) {
                return { success: false, error: 'Nenhum email válido informado' };
            }
            if (process.env.NODE_ENV === 'test' && !options.forceInTest) {
                return { success: true, messageId: `test-msg-${Date.now()}`, to: recipients };
            }
            const { transporter, from } = await this.resolveSenderConfig({
                institutionId: options.institutionId || null,
                overrideConfig: options.overrideConfig || null,
            });
            const info = await transporter.sendMail({
                from: options.from || from,
                to: recipients.join(', '),
                subject,
                html,
            });
            console.log(`[EmailService] Email sent to ${recipients.join(', ')}: ${info.messageId}`);
            return { success: true, messageId: info.messageId, to: recipients };
        } catch (error) {
            console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendPaymentReceivedAlert({ institution, payment, client, recipients = [] }) {
        const instEmailCfg = institution?.settings?.notificationSettings?.emailConfig || {};
        if (institution?.settings?.notificationSettings?.channels?.email === false) return { skipped: true };
        if (instEmailCfg.notifyOnPaymentReceived === false) return { skipped: true };

        const targetList = normalizeEmailList([
            ...(Array.isArray(recipients) ? recipients : []),
            ...(Array.isArray(instEmailCfg.alertRecipients) ? instEmailCfg.alertRecipients : []),
        ]);
        if (targetList.length === 0 && institution?.email) {
            targetList.push(...normalizeEmailList(institution.email));
        }
        if (targetList.length === 0) return { skipped: true };

        const html = `
            <h2>Novo Pagamento Recebido</h2>
            <p>A instituição <strong>${institution?.name || 'Microcrédito'}</strong> recebeu um novo pagamento de empréstimo.</p>
            <ul>
                <li><strong>Cliente:</strong> ${client?.name || 'Cliente'}</li>
                <li><strong>Valor:</strong> ${Number(payment.amount || 0).toLocaleString()} MT</li>
                <li><strong>Método:</strong> ${payment.paymentMethod || 'N/A'}</li>
                <li><strong>Referência:</strong> ${payment.transactionId || payment._id}</li>
            </ul>
            <p>Aceda à página <strong>Cobranças</strong> para rever e confirmar o pagamento.</p>
        `;
        return this.sendEmail(targetList, `Novo Pagamento Recebido (${Number(payment.amount || 0).toLocaleString()} MT)`, html, {
            institutionId: institution?._id,
        });
    }

    async sendPaymentConfirmedReceipt({ institution, payment, client, confirmed = true, reason = '' }) {
        const instEmailCfg = institution?.settings?.notificationSettings?.emailConfig || {};
        if (institution?.settings?.notificationSettings?.channels?.email === false) return { skipped: true };
        if (instEmailCfg.notifyOnPaymentConfirmed === false) return { skipped: true };

        const targets = normalizeEmailList([
            client?.email,
            ...(confirmed ? [] : (instEmailCfg.alertRecipients || [])),
        ]);
        if (targets.length === 0) return { skipped: true };

        const html = confirmed
            ? `
                <h2>Pagamento Confirmado</h2>
                <p>Olá, <strong>${client?.name || 'Cliente'}</strong>,</p>
                <p>O seu pagamento de <strong>${Number(payment.amount || 0).toLocaleString()} MT</strong> (${payment.transactionId}) na instituição <strong>${institution?.name || 'Microcrédito Digital'}</strong> foi confirmado com sucesso.</p>
            `
            : `
                <h2>Pagamento Rejeitado</h2>
                <p>Olá, <strong>${client?.name || 'Cliente'}</strong>,</p>
                <p>O pagamento de <strong>${Number(payment.amount || 0).toLocaleString()} MT</strong> (${payment.transactionId}) não foi confirmado.</p>
                <p><strong>Motivo:</strong> ${reason || 'Comprovativo inválido'}</p>
            `;
        return this.sendEmail(
            targets,
            confirmed ? `Pagamento Confirmado - ${Number(payment.amount || 0).toLocaleString()} MT` : 'Pagamento Rejeitado - Acção Necessária',
            html,
            { institutionId: institution?._id }
        );
    }

    async sendSubscriptionPaymentAlert({ institution, requestDoc, platformConfig, extraRecipients = [] }) {
        const emailCfg = platformConfig?.emailSettings || {};
        if (emailCfg.notifyOnSubscriptionPayment === false) return { skipped: true };

        const recipients = normalizeEmailList([
            ...(Array.isArray(emailCfg.notificationEmails) ? emailCfg.notificationEmails : []),
            ...(Array.isArray(extraRecipients) ? extraRecipients : []),
            platformConfig?.supportEmail,
        ]);
        if (recipients.length === 0) return { skipped: true };

        const html = `
            <h2>Novo Pagamento de Subscrição Recebido</h2>
            <p>A instituição <strong>${institution?.name || 'Instituição'}</strong> submeteu um comprovativo de pagamento para aprovação.</p>
            <ul>
                <li><strong>Pacote:</strong> ${requestDoc?.packageName || requestDoc?.planRequested}</li>
                <li><strong>Valor Pago:</strong> ${Number(requestDoc?.amountPaid || 0).toLocaleString()} MT</li>
                <li><strong>Método:</strong> ${requestDoc?.paymentMethod || 'Transferência'}</li>
                <li><strong>Referência:</strong> ${requestDoc?.referenceCode || 'N/A'}</li>
            </ul>
            <p>Aceda à central do Super Admin para validar e aprovar a subscrição.</p>
        `;
        return this.sendEmail(
            recipients,
            `[Subscrição] Pagamento de ${institution?.name || 'Instituição'} (${Number(requestDoc?.amountPaid || 0).toLocaleString()} MT)`,
            html
        );
    }

    async sendSubscriptionDecisionEmail({ institution, requestDoc, approved = true, reason = '' }) {
        const instAlertEmails = institution?.settings?.notificationSettings?.emailConfig?.alertRecipients || [];
        const targets = normalizeEmailList([institution?.email, ...instAlertEmails]);
        if (targets.length === 0) return { skipped: true };

        const html = approved
            ? `
                <h2>Subscrição Aprovada!</h2>
                <p>O pagamento da instituição <strong>${institution?.name}</strong> para o pacote <strong>${requestDoc?.packageName || requestDoc?.planRequested}</strong> foi aprovado pela Nhiquela.</p>
                <p>O acesso às funcionalidades do pacote encontra-se activo.</p>
            `
            : `
                <h2>Comprovativo de Subscrição Rejeitado</h2>
                <p>O pedido da instituição <strong>${institution?.name}</strong> para o pacote <strong>${requestDoc?.packageName || requestDoc?.planRequested}</strong> foi rejeitado.</p>
                <p><strong>Motivo:</strong> ${reason || 'Não especificado'}</p>
                <p>Pode submeter um novo comprovativo em <strong>Minha Subscrição</strong>.</p>
            `;
        return this.sendEmail(
            targets,
            approved ? `Subscrição Activada - ${requestDoc?.packageName || 'Nhiquela'}` : 'Subscrição Rejeitada - Novo Envio Necessário',
            html
        );
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
