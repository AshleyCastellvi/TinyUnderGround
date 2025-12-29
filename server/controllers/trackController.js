import db from '../config/database.js';
import { createReadStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create track
export const createTrack = (req, res) => {
    try {
        const { title, description, genre, tags } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ error: 'El título es requerido' });
        }

        if (!req.files || !req.files.audio || !req.files.audio[0]) {
            return res.status(400).json({ error: 'El archivo de audio es requerido' });
        }

        const audioFile = req.files.audio[0];
        const coverFile = req.files.cover ? req.files.cover[0] : null;

        const audio_url = `/uploads/audio/${audioFile.filename}`;
        const cover_url = coverFile ? `/uploads/images/${coverFile.filename}` : null;

        const result = db.prepare(`
      INSERT INTO tracks (user_id, title, description, genre, tags, audio_url, cover_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, title, description, genre, tags, audio_url, cover_url);

        const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ message: 'Track subido exitosamente', track });
    } catch (error) {
        console.error('CreateTrack error:', error);
        res.status(500).json({ error: 'Error al subir track' });
    }
};

// Get all tracks (with pagination)
export const getTracks = (req, res) => {
    try {
        const { limit = 20, offset = 0, genre, search } = req.query;

        let query = `
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
    `;

        const params = [];

        if (genre) {
            query += ' WHERE t.genre = ?';
            params.push(genre);
        }

        if (search) {
            query += genre ? ' AND' : ' WHERE';
            query += ' (t.title LIKE ? OR t.description LIKE ? OR t.tags LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const tracks = db.prepare(query).all(...params);

        // Check if current user liked each track
        if (req.user) {
            tracks.forEach(track => {
                const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
                track.isLiked = !!liked;
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('GetTracks error:', error);
        res.status(500).json({ error: 'Error al obtener tracks' });
    }
};

// Get single track
export const getTrackById = (req, res) => {
    try {
        const { id } = req.params;

        const track = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(id);

        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }

        // Check if current user liked
        if (req.user) {
            const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, id);
            track.isLiked = !!liked;
        }

        // Increment plays
        db.prepare('UPDATE tracks SET plays = plays + 1 WHERE id = ?').run(id);

        res.json(track);
    } catch (error) {
        console.error('GetTrackById error:', error);
        res.status(500).json({ error: 'Error al obtener track' });
    }
};

// Update track
export const updateTrack = (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, genre, tags } = req.body;
        const userId = req.user.id;

        // Check ownership
        const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }
        if (track.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para editar este track' });
        }

        db.prepare(`
      UPDATE tracks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          genre = COALESCE(?, genre),
          tags = COALESCE(?, tags)
      WHERE id = ?
    `).run(title, description, genre, tags, id);

        const updatedTrack = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id);

        res.json({ message: 'Track actualizado', track: updatedTrack });
    } catch (error) {
        console.error('UpdateTrack error:', error);
        res.status(500).json({ error: 'Error al actualizar track' });
    }
};

// Delete track
export const deleteTrack = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const track = db.prepare('SELECT * FROM tracks WHERE id = ?').get(id);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }
        if (track.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este track' });
        }

        db.prepare('DELETE FROM tracks WHERE id = ?').run(id);

        res.json({ message: 'Track eliminado' });
    } catch (error) {
        console.error('DeleteTrack error:', error);
        res.status(500).json({ error: 'Error al eliminar track' });
    }
};

// Like track
export const likeTrack = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already liked
        const existing = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(userId, id);
        if (existing) {
            return res.status(400).json({ error: 'Ya diste like a este track' });
        }

        db.prepare('INSERT INTO likes (user_id, track_id) VALUES (?, ?)').run(userId, id);

        // Get track owner and create notification
        const track = db.prepare('SELECT user_id, title FROM tracks WHERE id = ?').get(id);
        if (track && track.user_id !== userId) {
            db.prepare(`
        INSERT INTO notifications (user_id, type, message, reference_id)
        VALUES (?, 'like', ?, ?)
      `).run(track.user_id, `${req.user.username} le dio like a "${track.title}"`, id);
        }

        const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE track_id = ?').get(id).count;

        res.json({ message: 'Like añadido', likes_count: likesCount });
    } catch (error) {
        console.error('LikeTrack error:', error);
        res.status(500).json({ error: 'Error al dar like' });
    }
};

// Unlike track
export const unlikeTrack = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = db.prepare('DELETE FROM likes WHERE user_id = ? AND track_id = ?').run(userId, id);

        if (result.changes === 0) {
            return res.status(400).json({ error: 'No habías dado like a este track' });
        }

        const likesCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE track_id = ?').get(id).count;

        res.json({ message: 'Like eliminado', likes_count: likesCount });
    } catch (error) {
        console.error('UnlikeTrack error:', error);
        res.status(500).json({ error: 'Error al quitar like' });
    }
};

// Get comments
export const getComments = (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const comments = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.track_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

        res.json(comments);
    } catch (error) {
        console.error('GetComments error:', error);
        res.status(500).json({ error: 'Error al obtener comentarios' });
    }
};

// Add comment
export const addComment = (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío' });
        }

        const result = db.prepare(`
      INSERT INTO comments (user_id, track_id, content)
      VALUES (?, ?, ?)
    `).run(userId, id, content.trim());

        // Get track owner and create notification
        const track = db.prepare('SELECT user_id, title FROM tracks WHERE id = ?').get(id);
        if (track && track.user_id !== userId) {
            db.prepare(`
        INSERT INTO notifications (user_id, type, message, reference_id)
        VALUES (?, 'comment', ?, ?)
      `).run(track.user_id, `${req.user.username} comentó en "${track.title}"`, id);
        }

        const comment = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({ message: 'Comentario añadido', comment });
    } catch (error) {
        console.error('AddComment error:', error);
        res.status(500).json({ error: 'Error al añadir comentario' });
    }
};

// Stream audio
export const streamAudio = (req, res) => {
    try {
        const { id } = req.params;

        const track = db.prepare('SELECT audio_url FROM tracks WHERE id = ?').get(id);
        if (!track) {
            return res.status(404).json({ error: 'Track no encontrado' });
        }

        const audioPath = join(__dirname, '..', track.audio_url);

        try {
            const stat = statSync(audioPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunkSize = (end - start) + 1;
                const file = createReadStream(audioPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunkSize,
                    'Content-Type': 'audio/mpeg',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                };
                res.writeHead(200, head);
                createReadStream(audioPath).pipe(res);
            }
        } catch (err) {
            return res.status(404).json({ error: 'Archivo de audio no encontrado' });
        }
    } catch (error) {
        console.error('StreamAudio error:', error);
        res.status(500).json({ error: 'Error al reproducir audio' });
    }
};

// Get trending tracks
export const getTrendingTracks = (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count,
             (t.plays * 0.3 + (SELECT COUNT(*) FROM likes WHERE track_id = t.id) * 0.5 + 
              (SELECT COUNT(*) FROM comments WHERE track_id = t.id) * 0.2) as score
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.created_at > datetime('now', '-7 days')
      ORDER BY score DESC, t.created_at DESC
      LIMIT ?
    `).all(limit);

        // Check if current user liked each track
        if (req.user) {
            tracks.forEach(track => {
                const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
                track.isLiked = !!liked;
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('GetTrendingTracks error:', error);
        res.status(500).json({ error: 'Error al obtener trending' });
    }
};
