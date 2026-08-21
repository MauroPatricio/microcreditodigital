import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    type: {
        type: String,
        enum: [
            'payment_reminder',
            'payment_submitted',
            'payment_confirmed',
            'payment_rejected',
            'credit_approved',
            'credit_rejected',
            'credit_disbursed',
            'overdue_notice',
            'late_fee_applied',
            'document_update',
            'general'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    channel: {
        type: String,
        enum: ['push', 'sms', 'email', 'in_app'],
        default: 'in_app'
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Índice para busca rápida por usuário e status de leitura
notificationSchema.index({ user: 1, isRead: 1 });

// Disparar Push Notification automaticamente após salvar a notificação
notificationSchema.post('save', async function (doc, next) {
    try {
        // Obter o utilizador e o seu token de push
        const User = mongoose.model('User');
        const user = await User.findById(doc.user).select('pushToken');
        
        if (user && user.pushToken) {
            // Import dinâmico para evitar problemas de dependência circular
            const { default: pushService } = await import('../services/pushNotification.js');
            
            const result = await pushService.sendToDevice(user.pushToken, {
                title: doc.title,
                message: doc.message,
                metadata: doc.metadata
            });

            if (result.success) {
                // Opcional: Atualizar a notificação para indicar que foi enviada (sem acionar save repetido)
                await mongoose.model('Notification').updateOne({ _id: doc._id }, { sent: true, sentAt: new Date() });
            }
        }
    } catch (error) {
        console.error('Erro no hook post save de Notification:', error.message);
    }
    next();
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
