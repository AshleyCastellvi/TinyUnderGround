import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directories exist
const uploadsDir = join(__dirname, '..', 'uploads');
const audioDir = join(uploadsDir, 'audio');
const imagesDir = join(uploadsDir, 'images');

[uploadsDir, audioDir, imagesDir].forEach(dir => {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration for audio files
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, audioDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'track-' + uniqueSuffix + extname(file.originalname));
    }
});

// Storage configuration for images (covers, avatars)
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img-' + uniqueSuffix + extname(file.originalname));
    }
});

// File filter for audio
const audioFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de audio (MP3, WAV, FLAC, OGG)'), false);
    }
};

// File filter for images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'), false);
    }
};

// Upload middlewares
export const uploadAudio = multer({
    storage: audioStorage,
    fileFilter: audioFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

export const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Combined upload for track (audio + cover)
export const uploadTrack = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === 'audio') {
                cb(null, audioDir);
            } else if (file.fieldname === 'cover') {
                cb(null, imagesDir);
            }
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const prefix = file.fieldname === 'audio' ? 'track-' : 'cover-';
            cb(null, prefix + uniqueSuffix + extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
            audioFilter(req, file, cb);
        } else if (file.fieldname === 'cover') {
            imageFilter(req, file, cb);
        } else {
            cb(new Error('Campo de archivo no válido'), false);
        }
    },
    limits: { fileSize: 100 * 1024 * 1024 }
});
