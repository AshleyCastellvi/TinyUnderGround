import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import trackRoutes from './routes/tracks.js';
import feedRoutes from './routes/feed.js';
import communityRoutes from './routes/community.js';

// Import database to initialize it
import './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/community', communityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'TUG API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande' });
        }
        return res.status(400).json({ error: 'Error al subir archivo' });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🎤 TUG - Tiny UnderGround API                   ║
  ║                                                   ║
  ║   Server running on http://localhost:${PORT}       ║
  ║                                                   ║
  ║   Endpoints:                                      ║
  ║   • /api/auth       - Authentication              ║
  ║   • /api/users      - User profiles               ║
  ║   • /api/tracks     - Music tracks                ║
  ║   • /api/feed       - Feed & suggestions          ║
  ║   • /api/community  - Collabs & messages          ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
