import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

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
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable for SPA
}));
app.use(cors({
    origin: true, // Allow all origins in production
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
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

// Serve Frontend in Production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
    // Serve static files from the React app
    app.use(express.static(distPath));

    // Handle React routing, return all requests to React app
    app.get('*', (req, res) => {
        // Don't serve index.html for API routes or uploads
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return res.status(404).json({ error: 'Endpoint no encontrado' });
        }
        res.sendFile(join(distPath, 'index.html'));
    });

    console.log('📦 Serving frontend from /dist');
} else {
    // 404 handler for API only mode
    app.use((req, res) => {
        if (!req.path.startsWith('/api')) {
            return res.status(404).json({
                error: 'Frontend not built. Run npm run build first.',
                hint: 'This is API-only mode for development'
            });
        }
        res.status(404).json({ error: 'Endpoint no encontrado' });
    });
}

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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🎤 TUG - Tiny UnderGround                       ║
  ║                                                   ║
  ║   Server running on http://localhost:${PORT}       ║
  ║                                                   ║
  ║   Mode: ${existsSync(distPath) ? 'Production (Frontend + API)' : 'Development (API only)'}      ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
