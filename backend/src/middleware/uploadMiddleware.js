import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Garantir que a pasta de uploads/logos existe
const logosDir = path.join(process.cwd(), 'uploads', 'logos');
if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
}

// Configuração de armazenamento do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, logosDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único: logo-TIMESTAMP-RANDOM.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo inválido. Apenas imagens são permitidas.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    }
});

export default upload;
