import whatsappService from './whatsappService.js';

const templates = {
    LOAN_APPROVED: (name, amount) => `🎉 *Parabéns, ${name}!* 🎉\nSeu empréstimo de *${amount} MT* foi aprovado com sucesso! O valor será desembolsado em breve.\n\n_Microcrédito Digital_`,
    LOAN_REJECTED: (name) => `Olá ${name}. Infelizmente seu pedido de empréstimo não foi aprovado neste momento. Tente novamente em 30 dias.\n\n_Microcrédito Digital_`,
    PAYMENT_DUE: (name, amount, date) => `⚠️ *Aviso de Vencimento*\nOlá ${name}, lembramos que sua parcela de *${amount} MT* vence amanhã (${date}). Evite multas!\n\n_Microcrédito Digital_`,
    PAYMENT_RECEIVED: (name, amount) => `✅ *Pagamento Recebido*\nObrigado ${name}! Recebemos seu pagamento de *${amount} MT*.\n\n_Microcrédito Digital_`,
    WELCOME: (name) => `👋 *Bem-vindo(a) ao Microcrédito Digital!* \nOlá ${name}, seu cadastro foi realizado com sucesso. Agora você pode solicitar empréstimos de forma rápida e segura.`
};

const sendNotification = async (type, to, ...args) => {
    const templateFn = templates[type];
    if (!templateFn) {
        console.error(`Notification template '${type}' not found.`);
        return;
    }

    const message = templateFn(...args);

    try {
        await whatsappService.sendMessage(to, message);
        console.log(`Notification sent to ${to}: ${type}`);
    } catch (error) {
        console.error(`Failed to send notification to ${to}:`, error);
        // Fallback to SMS or Email could be implemented here
    }
};

export default {
    sendNotification,
    templates
};
