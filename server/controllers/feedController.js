import db from '../config/database.js';

// Get feed (from followed users)
export const getFeed = (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const userId = req.user.id;

        const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      ) OR t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, userId, limit, offset);

        // Check if current user liked each track
        tracks.forEach(track => {
            const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(userId, track.id);
            track.isLiked = !!liked;
        });

        res.json(tracks);
    } catch (error) {
        console.error('GetFeed error:', error);
        res.status(500).json({ error: 'Error al obtener feed' });
    }
};

// Get recent tracks (public)
export const getRecentTracks = (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

        // Check if current user liked each track
        if (req.user) {
            tracks.forEach(track => {
                const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
                track.isLiked = !!liked;
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('GetRecentTracks error:', error);
        res.status(500).json({ error: 'Error al obtener tracks recientes' });
    }
};

// Get popular tracks
export const getPopularTracks = (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const tracks = db.prepare(`
      SELECT t.*, u.username, u.display_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE track_id = t.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE track_id = t.id) as comments_count
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      ORDER BY likes_count DESC, t.plays DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

        // Check if current user liked each track
        if (req.user) {
            tracks.forEach(track => {
                const liked = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND track_id = ?').get(req.user.id, track.id);
                track.isLiked = !!liked;
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('GetPopularTracks error:', error);
        res.status(500).json({ error: 'Error al obtener tracks populares' });
    }
};

// Get suggestions
export const getSuggestions = (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const userId = req.user ? req.user.id : null;

        // Get suggested artists (not following)
        let suggestedArtists;
        if (userId) {
            suggestedArtists = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url,
               (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
        FROM users u
        WHERE u.id != ?
          AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
          AND EXISTS (SELECT 1 FROM tracks WHERE user_id = u.id)
        ORDER BY followers_count DESC
        LIMIT ?
      `).all(userId, userId, limit);
        } else {
            suggestedArtists = db.prepare(`
        SELECT u.id, u.username, u.display_name, u.avatar_url,
               (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
        FROM users u
        WHERE EXISTS (SELECT 1 FROM tracks WHERE user_id = u.id)
        ORDER BY followers_count DESC
        LIMIT ?
      `).all(limit);
        }

        // Get trending tracks
        const trendingTracks = db.prepare(`
      SELECT t.id, t.title, u.username, u.display_name, t.plays
      FROM tracks t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.plays DESC
      LIMIT ?
    `).all(limit);

        res.json({
            suggestedArtists,
            trendingTracks
        });
    } catch (error) {
        console.error('GetSuggestions error:', error);
        res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
};
