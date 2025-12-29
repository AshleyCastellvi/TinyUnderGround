import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Pause, MoreVertical, TrendingUp, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { feedAPI, tracksAPI, usersAPI } from '../services/api';
import './Feed.css';

export default function Feed() {
    const [playingTrack, setPlayingTrack] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [trending, setTrending] = useState([]);
    const [suggestedArtists, setSuggestedArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('recent');
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadData();
    }, [filter, isAuthenticated]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load tracks based on filter
            let tracksData;
            if (filter === 'recent') {
                tracksData = await feedAPI.getRecent({ limit: 20 });
            } else if (filter === 'popular') {
                tracksData = await feedAPI.getPopular({ limit: 20 });
            } else if (filter === 'following' && isAuthenticated) {
                tracksData = await feedAPI.getFeed({ limit: 20 });
            } else {
                tracksData = await feedAPI.getRecent({ limit: 20 });
            }
            setTracks(tracksData);

            // Load suggestions
            const suggestions = await feedAPI.getSuggestions();
            setTrending(suggestions.trendingTracks || []);
            setSuggestedArtists(suggestions.suggestedArtists || []);
        } catch (error) {
            console.error('Error loading feed:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlay = (trackId) => {
        setPlayingTrack(playingTrack === trackId ? null : trackId);
    };

    const handleLike = async (trackId, isLiked) => {
        if (!isAuthenticated) return;
        try {
            if (isLiked) {
                await tracksAPI.unlike(trackId);
            } else {
                await tracksAPI.like(trackId);
            }
            // Update track in state
            setTracks(tracks.map(t =>
                t.id === trackId
                    ? { ...t, isLiked: !isLiked, likes_count: isLiked ? t.likes_count - 1 : t.likes_count + 1 }
                    : t
            ));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleFollow = async (userId) => {
        if (!isAuthenticated) return;
        try {
            await usersAPI.follow(userId);
            setSuggestedArtists(suggestedArtists.filter(a => a.id !== userId));
        } catch (error) {
            console.error('Error following user:', error);
        }
    };

    if (loading) {
        return (
            <div className="feed loading-state">
                <Loader className="spinner" size={48} />
                <p>Cargando feed...</p>
            </div>
        );
    }

    return (
        <div className="feed">
            <div className="feed-container">
                {/* Main Feed */}
                <div className="feed-main">
                    <motion.div
                        className="feed-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h2>Tu Feed</h2>
                        <div className="feed-filters">
                            <button
                                className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
                                onClick={() => setFilter('recent')}
                            >
                                Recientes
                            </button>
                            <button
                                className={`filter-btn ${filter === 'popular' ? 'active' : ''}`}
                                onClick={() => setFilter('popular')}
                            >
                                Populares
                            </button>
                            {isAuthenticated && (
                                <button
                                    className={`filter-btn ${filter === 'following' ? 'active' : ''}`}
                                    onClick={() => setFilter('following')}
                                >
                                    Siguiendo
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {tracks.length === 0 ? (
                        <div className="empty-state">
                            <p>No hay tracks disponibles. ¡Sé el primero en subir música!</p>
                        </div>
                    ) : (
                        <div className="tracks-list">
                            {tracks.map((track, index) => (
                                <motion.div
                                    key={track.id}
                                    className="track-card card"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="track-header">
                                        <div className="artist-info">
                                            <div className="artist-avatar">
                                                {track.avatar_url ? (
                                                    <img src={track.avatar_url} alt={track.display_name} />
                                                ) : (
                                                    track.display_name?.charAt(0) || track.username?.charAt(0) || 'A'
                                                )}
                                            </div>
                                            <div>
                                                <h3>{track.display_name || track.username}</h3>
                                                <p className="track-time">
                                                    {new Date(track.created_at).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="track-menu">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    <div className="track-content">
                                        <div className="track-cover-wrapper">
                                            {track.cover_url ? (
                                                <img
                                                    src={`http://localhost:3001${track.cover_url}`}
                                                    alt={track.title}
                                                    className="track-cover"
                                                />
                                            ) : (
                                                <div className="track-cover-placeholder">
                                                    <Play size={32} />
                                                </div>
                                            )}
                                            <motion.button
                                                className="play-btn"
                                                onClick={() => togglePlay(track.id)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                {playingTrack === track.id ? <Pause size={24} /> : <Play size={24} />}
                                            </motion.button>
                                        </div>
                                        <div className="track-info">
                                            <h4>{track.title}</h4>
                                            {track.genre && <span className="track-genre">{track.genre}</span>}
                                            <div className="track-waveform">
                                                {[...Array(40)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="waveform-bar"
                                                        style={{ height: `${20 + Math.random() * 80}%` }}
                                                    />
                                                ))}
                                            </div>
                                            {playingTrack === track.id && (
                                                <audio
                                                    src={tracksAPI.getStreamUrl(track.id)}
                                                    autoPlay
                                                    onEnded={() => setPlayingTrack(null)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="track-actions">
                                        <motion.button
                                            className={`action-btn ${track.isLiked ? 'liked' : ''}`}
                                            onClick={() => handleLike(track.id, track.isLiked)}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Heart size={20} fill={track.isLiked ? 'currentColor' : 'none'} />
                                            <span>{track.likes_count || 0}</span>
                                        </motion.button>
                                        <motion.button
                                            className="action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <MessageCircle size={20} />
                                            <span>{track.comments_count || 0}</span>
                                        </motion.button>
                                        <motion.button
                                            className="action-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Share2 size={20} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="feed-sidebar">
                    {trending.length > 0 && (
                        <motion.div
                            className="sidebar-card card-glass"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="sidebar-header">
                                <TrendingUp size={20} />
                                <h3>Trending Ahora</h3>
                            </div>
                            <div className="trending-list">
                                {trending.map((item, index) => (
                                    <div key={index} className="trending-item">
                                        <div className="trending-rank gradient-text">{index + 1}</div>
                                        <div className="trending-info">
                                            <h4>{item.title}</h4>
                                            <p>{item.display_name || item.username}</p>
                                        </div>
                                        <div className="trending-plays">{item.plays || 0}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {suggestedArtists.length > 0 && (
                        <motion.div
                            className="sidebar-card card-glass"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3>Artistas Sugeridos</h3>
                            <div className="suggested-artists">
                                {suggestedArtists.map((artist) => (
                                    <div key={artist.id} className="suggested-artist">
                                        <div className="artist-avatar">
                                            {artist.avatar_url ? (
                                                <img src={artist.avatar_url} alt={artist.display_name} />
                                            ) : (
                                                artist.display_name?.charAt(0) || artist.username?.charAt(0)
                                            )}
                                        </div>
                                        <div className="artist-name">{artist.display_name || artist.username}</div>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleFollow(artist.id)}
                                        >
                                            Seguir
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </aside>
            </div>
        </div>
    );
}
