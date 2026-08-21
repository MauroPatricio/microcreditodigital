import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Garantir que a pasta de uploads/collateral existe
const collateralDir = path.join(process.cwd(), 'uploads', 'collateral');
if (!fs.existsSync(collateralDir)) {
    fs.mkdirSync(collateralDir, { recursive: true });
}

// Configuração de armazenamento do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, collateralDir);
    },
    filename: function (req, file, cb) {
        // Gerar nome único: collateral-TIMESTAMP-RANDOM.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'collateral-' + uniqueSuffix + ext);
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

const uploadCollateral = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limite de 10MB para fotos detalhadas
    }
});

export default uploadCollateral;
