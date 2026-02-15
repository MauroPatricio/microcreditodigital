import AuditLog from '../models/AuditLog.js';

/**
 * Middleware para auditar ações em rotas
 * @param {string} entityType - Tipo de entidade (Credit, Payment, User, etc)
 * @param {string} action - Ação realizada (create, update, delete, approve, etc)
 * @param {string} severity - Nível de gravidade (low, medium, high, critical)
 */
export const auditAction = (entityType, action, severity = 'medium') => {
    return async (req, res, next) => {
        // Guardar o método original res.send para interceptar a resposta
        const originalSend = res.send;

        res.send = function (data) {
            // Só logamos se a resposta for sucesso (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    // Tentar extrair o ID da entidade se não estiver nos params
                    let entityId = req.params.id;
                    if (!entityId && typeof data === 'string') {
                        try {
                            const jsonData = JSON.parse(data);
                            entityId = jsonData.data?._id || jsonData.data?.id || jsonData._id;
                        } catch (e) { }
                    }

                    // Gravar log de auditoria de forma assíncrona (não bloqueante)
                    AuditLog.create({
                        institution: req.user?.institution?._id || req.user?.institution,
                        user: req.user?._id,
                        action,
                        entityType,
                        entityId,
                        severity,
                        metadata: {
                            ipAddress: req.ip || req.connection.remoteAddress,
                            userAgent: req.get('user-agent'),
                            path: req.originalUrl,
                            method: req.method
                        },
                        timestamp: new Date()
                    }).catch(err => console.error('Erro ao gravar AuditLog:', err));

                } catch (error) {
                    console.error('Erro no processamento do AuditLog:', error);
                }
            }

            // Chamar o método original res.send
            return originalSend.apply(res, arguments);
        };

        next();
    };
};
