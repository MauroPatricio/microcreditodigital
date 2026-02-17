import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ler package.json
const packageJsonParams = JSON.parse(
    readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
);

// Obter status do sistema
export const getSystemStatus = async (req, res) => {
    try {
        // Calcular uptime formatado
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeString = `${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`;

        // Verificar estado da conexão com MongoDB
        const dbStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

        res.json({
            success: true,
            data: {
                status: 'online',
                uptime: uptimeString,
                uptimeSeconds: Math.floor(uptimeSeconds),
                database: {
                    status: dbState,
                    host: mongoose.connection.host,
                    name: mongoose.connection.name
                },
                version: packageJsonParams.version,
                environment: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 4000,
                timestamp: new Date().toISOString(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter status do sistema',
            error: error.message
        });
    }
};
