import { motion } from 'framer-motion';
import { Search, Users, MessageSquare, Music, TrendingUp, Loader, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityAPI, usersAPI } from '../services/api';
import './Community.css';

export default function Community() {
    const [collabs, setCollabs] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeGenre, setActiveGenre] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCollab, setNewCollab] = useState({ title: '', description: '', genre: '' });
    const { isAuthenticated } = useAuth();

    const genres = ['all', 'Rap', 'Trap', 'Hip-Hop', 'Boom Bap', 'Freestyle'];

    useEffect(() => {
        loadData();
    }, [activeGenre]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load collaborations
            const params = activeGenre !== 'all' ? { genre: activeGenre } : {};
            const collabsData = await communityAPI.getCollabs(params);
            setCollabs(collabsData);

            // Load top artists
            const artistsData = await usersAPI.getTop(5);
            setTopArtists(artistsData);

            // Load community stats
            const statsData = await communityAPI.getStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading community data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCollab = async (e) => {
        e.preventDefault();
        if (!newCollab.title.trim()) return;

        try {
            const created = await communityAPI.createCollab(newCollab);
            setCollabs([created.collaboration, ...collabs]);
            setShowCreateModal(false);
            setNewCollab({ title: '', description: '', genre: '' });
        } catch (error) {
            console.error('Error creating collaboration:', error);
        }
    };

    const filteredCollabs = collabs.filter(collab =>
        collab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="community-page loading-state">
                <Loader className="spinner" size={48} />
                <p>Cargando comunidad...</p>
            </div>
        );
    }

    return (
        <div className="community-page">
            <div className="community-container">
                {/* Header */}
                <motion.div
                    className="community-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="header-content">
                        <h1>Comunidad</h1>
                        <p>Conecta con otros artistas y encuentra colaboraciones</p>
                    </div>
                    {isAuthenticated && (
                        <motion.button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={20} />
                            Crear Request
                        </motion.button>
                    )}
                </motion.div>

                <div className="community-content">
                    {/* Main Content */}
                    <div className="community-main">
                        {/* Search & Filters */}
                        <motion.div
                            className="search-section card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="search-bar">
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar colaboraciones..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="filter-chips">
                                {genres.map(genre => (
                                    <button
                                        key={genre}
                                        className={`chip ${activeGenre === genre ? 'active' : ''}`}
                                        onClick={() => setActiveGenre(genre)}
                                    >
                                        {genre === 'all' ? 'Todos' : genre}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        {/* Collaboration Requests */}
                        <div className="collabs-list">
                            {filteredCollabs.length === 0 ? (
                                <div className="empty-state card">
                                    <Users size={48} />
                                    <p>No hay colaboraciones disponibles. ¡Crea la primera!</p>
                                </div>
                            ) : (
                                filteredCollabs.map((collab, index) => (
                                    <motion.div
                                        key={collab.id}
                                        className="collab-card card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="collab-header">
                                            <div className="collab-artist">
                                                <div className="artist-avatar">
                                                    {collab.avatar_url ? (
                                                        <img src={`http://localhost:3001${collab.avatar_url}`} alt={collab.display_name} />
                                                    ) : (
                                                        (collab.display_name || collab.username)?.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <h3>{collab.display_name || collab.username}</h3>
                                                    <p className="collab-time">
                                                        {new Date(collab.created_at).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                            {collab.genre && (
                                                <span className="genre-badge">{collab.genre}</span>
                                            )}
                                        </div>
                                        <div className="collab-content">
                                            <h4>{collab.title}</h4>
                                            {collab.description && <p>{collab.description}</p>}
                                        </div>
                                        <div className="collab-actions">
                                            <Link to={`/profile/${collab.user_id}`}>
                                                <button className="btn btn-ghost">Ver Perfil</button>
                                            </Link>
                                            {isAuthenticated && (
                                                <button className="btn btn-primary">Contactar</button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="community-sidebar">
                        {/* Top Artists */}
                        {topArtists.length > 0 && (
                            <motion.div
                                className="sidebar-card card-glass"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className="sidebar-header">
                                    <TrendingUp size={20} />
                                    <h3>Top Artistas</h3>
                                </div>
                                <div className="top-artists">
                                    {topArtists.map((artist, index) => (
                                        <Link key={artist.id} to={`/profile/${artist.id}`} className="top-artist">
                                            <span className="rank">{index + 1}</span>
                                            <div className="artist-avatar">
                                                {artist.avatar_url ? (
                                                    <img src={`http://localhost:3001${artist.avatar_url}`} alt={artist.display_name} />
                                                ) : (
                                                    (artist.display_name || artist.username)?.charAt(0)
                                                )}
                                            </div>
                                            <div className="artist-info">
                                                <h4>{artist.display_name || artist.username}</h4>
                                                <p>{artist.followers_count || 0} seguidores</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Community Stats */}
                        {stats && (
                            <motion.div
                                className="sidebar-card card-glass"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3>Estadísticas</h3>
                                <div className="community-stats">
                                    <div className="stat-item">
                                        <Users size={20} />
                                        <div>
                                            <span className="stat-value">{stats.totalArtists}</span>
                                            <span className="stat-label">Artistas</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <Music size={20} />
                                        <div>
                                            <span className="stat-value">{stats.totalTracks}</span>
                                            <span className="stat-label">Tracks</span>
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <MessageSquare size={20} />
                                        <div>
                                            <span className="stat-value">{stats.activeCollabs}</span>
                                            <span className="stat-label">Collabs Activas</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </aside>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <motion.div
                    className="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowCreateModal(false)}
                >
                    <motion.div
                        className="create-modal card-glass"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                            <X size={24} />
                        </button>
                        <h2>Crear Request de Colaboración</h2>
                        <form onSubmit={handleCreateCollab}>
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    placeholder="Busco productor para track de trap"
                                    value={newCollab.title}
                                    onChange={(e) => setNewCollab({ ...newCollab, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe qué tipo de colaboración buscas..."
                                    value={newCollab.description}
                                    onChange={(e) => setNewCollab({ ...newCollab, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Género</label>
                                <select
                                    value={newCollab.genre}
                                    onChange={(e) => setNewCollab({ ...newCollab, genre: e.target.value })}
                                >
                                    <option value="">Selecciona un género</option>
                                    {genres.filter(g => g !== 'all').map(genre => (
                                        <option key={genre} value={genre}>{genre}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">
                                Publicar Request
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
