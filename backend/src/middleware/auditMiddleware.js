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
                    let entityId = req.params.id;
                    let userId = req.user?._id;
                    let institutionId = req.user?.institution?._id || req.user?.institution;

                    let jsonData = null;
                    if (typeof data === 'string') {
                        try {
                            jsonData = JSON.parse(data);
                            // Extrair entityId se não estiver nos params
                            if (!entityId) {
                                entityId = jsonData.data?._id || jsonData.data?.id || jsonData._id;
                            }
                            // Se não temos user/institution (ex: login/register), tentar extrair do corpo da resposta
                            if (!userId && jsonData.data?.user) {
                                userId = jsonData.data.user._id || jsonData.data.user.id;
                                institutionId = jsonData.data.user.institution?._id || jsonData.data.user.institution?.id || jsonData.data.user.institution;
                            }
                        } catch (e) { }
                    }

                    // Gravar log de auditoria de forma assíncrona
                    AuditLog.create({
                        institution: institutionId,
                        user: userId,
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
