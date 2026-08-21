import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Garantir que a pasta de uploads/receipts existe
const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

// Configuração de armazenamento do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, receiptsDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único: receipt-TIMESTAMP-RANDOM.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'receipt-' + uniqueSuffix + ext);
    }
});

// Filtro para aceitar imagens e PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo inválido. Apenas imagens e PDFs são permitidos.'), false);
    }
};

const uploadPaymentReceipt = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB
    }
});

export default uploadPaymentReceipt;
