import db from '../config/database.js';

// Get user by ID
export const getUserById = (req, res) => {
    try {
        const { id } = req.params;

        const user = db.prepare(`
      SELECT id, username, display_name, bio, avatar_url, location, created_at 
      FROM users WHERE id = ?
    `).get(id);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Get stats
        const stats = {
            followers: db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(id).count,
            following: db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(id).count,
            tracks: db.prepare('SELECT COUNT(*) as count FROM tracks WHERE user_id = ?').get(id).count,
            totalPlays: db.prepare('SELECT SUM(plays) as total FROM tracks WHERE user_id = ?').get(id).total || 0,
            collaborations: db.prepare('SELECT COUNT(*) as count FROM collaborations WHERE user_id = ?').get(id).count
        };

        // Check if current user is following
        let isFollowing = false;
        if (req.user) {
            const follow = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, id);
            isFollowing = !!follow;
        }

        res.json({ ...user, stats, isFollowing });
    } catch (error) {
        console.error('GetUserById error:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
};

// Get user's tracks
export const getUserTracks = (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

        // Check if current user liked each track
        if (req.user) {
            tracks.forEach(track => {
                const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
                track.isLiked = !!liked;
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('GetUserTracks error:', error);
        res.status(500).json({ error: 'Error al obtener tracks' });
    }
};

// Follow user
export const followUser = (req, res) => {
    try {
        const { id } = req.params;
        const followerId = req.user.id;

        if (parseInt(id) === followerId) {
            return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
        }

        // Check if already following
        const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, id);
        if (existing) {
            return res.status(400).json({ error: 'Ya sigues a este usuario' });
        }

        db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, id);

        // Create notification
        db.prepare(`
      INSERT INTO notifications (user_id, type, message, reference_id)
      VALUES (?, 'follow', ?, ?)
    `).run(id, `${req.user.username} ha empezado a seguirte`, followerId);

        res.json({ message: 'Ahora sigues a este usuario' });
    } catch (error) {
        console.error('FollowUser error:', error);
        res.status(500).json({ error: 'Error al seguir usuario' });
    }
};

// Unfollow user
export const unfollowUser = (req, res) => {
    try {
        const { id } = req.params;
        const followerId = req.user.id;

        const result = db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, id);

        if (result.changes === 0) {
            return res.status(400).json({ error: 'No sigues a este usuario' });
        }

        res.json({ message: 'Has dejado de seguir a este usuario' });
    } catch (error) {
        console.error('UnfollowUser error:', error);
        res.status(500).json({ error: 'Error al dejar de seguir' });
    }
};

// Get followers
export const getFollowers = (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

        res.json(followers);
    } catch (error) {
        console.error('GetFollowers error:', error);
        res.status(500).json({ error: 'Error al obtener seguidores' });
    }
};

// Get following
export const getFollowing = (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(id, limit, offset);

        res.json(following);
    } catch (error) {
        console.error('GetFollowing error:', error);
        res.status(500).json({ error: 'Error al obtener seguidos' });
    }
};

// Search users
export const searchUsers = (req, res) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Búsqueda debe tener al menos 2 caracteres' });
        }

        const users = db.prepare(`
      SELECT id, username, display_name, avatar_url, bio,
             (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers_count
      FROM users
      WHERE username LIKE ? OR display_name LIKE ?
      ORDER BY followers_count DESC
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, limit);

        res.json(users);
    } catch (error) {
        console.error('SearchUsers error:', error);
        res.status(500).json({ error: 'Error en búsqueda' });
    }
};

// Get top artists
export const getTopArtists = (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const artists = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
             (SELECT SUM(plays) FROM tracks WHERE user_id = u.id) as total_plays
      FROM users u
      WHERE EXISTS (SELECT 1 FROM tracks WHERE user_id = u.id)
      ORDER BY followers_count DESC, total_plays DESC
      LIMIT ?
    `).all(limit);

        res.json(artists);
    } catch (error) {
        console.error('GetTopArtists error:', error);
        res.status(500).json({ error: 'Error al obtener top artistas' });
    }
};
