import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { username, email, password, display_name } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email y password son requeridos' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username debe tener al menos 3 caracteres' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
        }

        // Check if user exists
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
        if (existingUser) {
            return res.status(400).json({ error: 'Username o email ya registrado' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = db.prepare(`
      INSERT INTO users (username, email, password, display_name)
      VALUES (?, ?, ?, ?)
    `).run(username, email, hashedPassword, display_name || username);

        const user = db.prepare('SELECT id, username, email, display_name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user,
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son requeridos' });
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        delete user.password;

        res.json({
            message: 'Login exitoso',
            user,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

// Get current user
export const getMe = (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, username, email, display_name, bio, avatar_url, location, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Get stats
        const stats = {
            followers: db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id).count,
            following: db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id).count,
            tracks: db.prepare('SELECT COUNT(*) as count FROM tracks WHERE user_id = ?').get(user.id).count,
            totalPlays: db.prepare('SELECT SUM(plays) as total FROM tracks WHERE user_id = ?').get(user.id).total || 0
        };

        res.json({ ...user, stats });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};

// Update current user profile
export const updateMe = (req, res) => {
    try {
        const { display_name, bio, location } = req.body;

        db.prepare(`
      UPDATE users 
      SET display_name = COALESCE(?, display_name),
          bio = COALESCE(?, bio),
          location = COALESCE(?, location)
      WHERE id = ?
    `).run(display_name, bio, location, req.user.id);

        const user = db.prepare(`
      SELECT id, username, email, display_name, bio, avatar_url, location, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

        res.json({ message: 'Perfil actualizado', user });
    } catch (error) {
        console.error('UpdateMe error:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

// Update avatar
export const updateAvatar = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ninguna imagen' });
        }

        const avatar_url = `/uploads/images/${req.file.filename}`;

        db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatar_url, req.user.id);

        res.json({ message: 'Avatar actualizado', avatar_url });
    } catch (error) {
        console.error('UpdateAvatar error:', error);
        res.status(500).json({ error: 'Error al actualizar avatar' });
    }
};
