import db from '../config/database.js';

// Get all collaboration requests
export const getCollaborations = (req, res) => {
    try {
        const { limit = 20, offset = 0, genre, status = 'open' } = req.query;

        let query = `
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM collaborations c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = ?
    `;
        const params = [status];

        if (genre) {
            query += ' AND c.genre = ?';
            params.push(genre);
        }

        query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const collabs = db.prepare(query).all(...params);

        res.json(collabs);
    } catch (error) {
        console.error('GetCollaborations error:', error);
        res.status(500).json({ error: 'Error al obtener colaboraciones' });
    }
};

// Create collaboration request
export const createCollaboration = (req, res) => {
    try {
        const { title, description, genre } = req.body;
        const userId = req.user.id;

        if (!title) {
            return res.status(400).json({ error: 'El título es requerido' });
        }

        const result = db.prepare(`
      INSERT INTO collaborations (user_id, title, description, genre)
      VALUES (?, ?, ?, ?)
    `).run(userId, title, description, genre);

        const collab = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM collaborations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({ message: 'Colaboración creada', collaboration: collab });
    } catch (error) {
        console.error('CreateCollaboration error:', error);
        res.status(500).json({ error: 'Error al crear colaboración' });
    }
};

// Get single collaboration
export const getCollaborationById = (req, res) => {
    try {
        const { id } = req.params;

        const collab = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url, u.bio
      FROM collaborations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

        if (!collab) {
            return res.status(404).json({ error: 'Colaboración no encontrada' });
        }

        res.json(collab);
    } catch (error) {
        console.error('GetCollaborationById error:', error);
        res.status(500).json({ error: 'Error al obtener colaboración' });
    }
};

// Update collaboration
export const updateCollaboration = (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, genre, status } = req.body;
        const userId = req.user.id;

        const collab = db.prepare('SELECT * FROM collaborations WHERE id = ?').get(id);
        if (!collab) {
            return res.status(404).json({ error: 'Colaboración no encontrada' });
        }
        if (collab.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta colaboración' });
        }

        db.prepare(`
      UPDATE collaborations 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          genre = COALESCE(?, genre),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(title, description, genre, status, id);

        const updated = db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM collaborations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

        res.json({ message: 'Colaboración actualizada', collaboration: updated });
    } catch (error) {
        console.error('UpdateCollaboration error:', error);
        res.status(500).json({ error: 'Error al actualizar colaboración' });
    }
};

// Delete collaboration
export const deleteCollaboration = (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const collab = db.prepare('SELECT * FROM collaborations WHERE id = ?').get(id);
        if (!collab) {
            return res.status(404).json({ error: 'Colaboración no encontrada' });
        }
        if (collab.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta colaboración' });
        }

        db.prepare('DELETE FROM collaborations WHERE id = ?').run(id);

        res.json({ message: 'Colaboración eliminada' });
    } catch (error) {
        console.error('DeleteCollaboration error:', error);
        res.status(500).json({ error: 'Error al eliminar colaboración' });
    }
};

// Get messages between users
export const getMessages = (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const messages = db.prepare(`
      SELECT m.*, 
             sender.username as sender_username, 
             sender.display_name as sender_display_name,
             sender.avatar_url as sender_avatar_url,
             receiver.username as receiver_username,
             receiver.display_name as receiver_display_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(currentUserId, userId, userId, currentUserId, limit, offset);

        // Mark messages as read
        db.prepare(`
      UPDATE messages SET read = 1 
      WHERE sender_id = ? AND receiver_id = ? AND read = 0
    `).run(userId, currentUserId);

        res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
        console.error('GetMessages error:', error);
        res.status(500).json({ error: 'Error al obtener mensajes' });
    }
};

// Send message
export const sendMessage = (req, res) => {
    try {
        const { receiver_id, content } = req.body;
        const senderId = req.user.id;

        if (!receiver_id || !content) {
            return res.status(400).json({ error: 'Receptor y contenido son requeridos' });
        }

        if (receiver_id === senderId) {
            return res.status(400).json({ error: 'No puedes enviarte mensajes a ti mismo' });
        }

        // Check receiver exists
        const receiver = db.prepare('SELECT id, username FROM users WHERE id = ?').get(receiver_id);
        if (!receiver) {
            return res.status(404).json({ error: 'Usuario receptor no encontrado' });
        }

        const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `).run(senderId, receiver_id, content);

        // Create notification
        db.prepare(`
      INSERT INTO notifications (user_id, type, message, reference_id)
      VALUES (?, 'message', ?, ?)
    `).run(receiver_id, `${req.user.username} te envió un mensaje`, senderId);

        const message = db.prepare(`
      SELECT m.*, 
             sender.username as sender_username, 
             sender.display_name as sender_display_name,
             sender.avatar_url as sender_avatar_url
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({ message: 'Mensaje enviado', data: message });
    } catch (error) {
        console.error('SendMessage error:', error);
        res.status(500).json({ error: 'Error al enviar mensaje' });
    }
};

// Get conversations list
export const getConversations = (req, res) => {
    try {
        const userId = req.user.id;

        const conversations = db.prepare(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as user_id,
        u.username, u.display_name, u.avatar_url,
        (SELECT content FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages 
         WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND read = 0) as unread_count
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END = u.id
      )
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY last_message_time DESC
    `).all(userId, userId, userId, userId, userId, userId, userId, userId, userId);

        res.json(conversations);
    } catch (error) {
        console.error('GetConversations error:', error);
        res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
};

// Get notifications
export const getNotifications = (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, unread_only = false } = req.query;

        let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;

        if (unread_only === 'true') {
            query += ' AND read = 0';
        }

        query += ' ORDER BY created_at DESC LIMIT ?';

        const notifications = db.prepare(query).all(userId, limit);

        res.json(notifications);
    } catch (error) {
        console.error('GetNotifications error:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
};

// Mark notifications as read
export const markNotificationsRead = (req, res) => {
    try {
        const userId = req.user.id;
        const { ids } = req.body; // Optional: specific IDs to mark

        if (ids && Array.isArray(ids)) {
            const placeholders = ids.map(() => '?').join(',');
            db.prepare(`UPDATE notifications SET read = 1 WHERE id IN (${placeholders}) AND user_id = ?`).run(...ids, userId);
        } else {
            db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
        }

        res.json({ message: 'Notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('MarkNotificationsRead error:', error);
        res.status(500).json({ error: 'Error al marcar notificaciones' });
    }
};

// Get community stats
export const getCommunityStats = (req, res) => {
    try {
        const stats = {
            totalArtists: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
            totalTracks: db.prepare('SELECT COUNT(*) as count FROM tracks').get().count,
            totalPlays: db.prepare('SELECT SUM(plays) as total FROM tracks').get().total || 0,
            totalCollaborations: db.prepare('SELECT COUNT(*) as count FROM collaborations').get().count,
            activeCollabs: db.prepare("SELECT COUNT(*) as count FROM collaborations WHERE status = 'open'").get().count
        };

        res.json(stats);
    } catch (error) {
        console.error('GetCommunityStats error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};
