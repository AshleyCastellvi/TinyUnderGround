import { motion } from 'framer-motion';
import { MapPin, Calendar, Music, Users, Heart, Settings, MessageCircle, Loader, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../services/api';
import './Profile.css';

export default function Profile() {
    const { id } = useParams();
    const { user: currentUser, isAuthenticated, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tracks');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ display_name: '', bio: '', location: '' });

    // Determine if viewing own profile
    const isOwnProfile = !id || (currentUser && parseInt(id) === currentUser.id);
    const profileId = isOwnProfile ? currentUser?.id : id;

    useEffect(() => {
        if (profileId) {
            loadProfile();
        } else if (isOwnProfile && !currentUser) {
            setLoading(false);
        }
    }, [profileId, currentUser]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            let profileData;
            if (isOwnProfile && currentUser) {
                profileData = await authAPI.getMe();
            } else {
                profileData = await usersAPI.getById(profileId);
            }
            setProfile(profileData);
            setEditData({
                display_name: profileData.display_name || '',
                bio: profileData.bio || '',
                location: profileData.location || ''
            });

            // Load user tracks
            const tracksData = await usersAPI.getTracks(profileId);
            setTracks(tracksData);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!isAuthenticated) return;
        try {
            if (profile.isFollowing) {
                await usersAPI.unfollow(profileId);
                setProfile({
                    ...profile,
                    isFollowing: false,
                    stats: { ...profile.stats, followers: profile.stats.followers - 1 }
                });
            } else {
                await usersAPI.follow(profileId);
                setProfile({
                    ...profile,
                    isFollowing: true,
                    stats: { ...profile.stats, followers: profile.stats.followers + 1 }
                });
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const updated = await authAPI.updateMe(editData);
            setProfile({ ...profile, ...updated.user });
            updateUser(updated.user);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) {
        return (
            <div className="profile-page loading-state">
                <Loader className="spinner" size={48} />
                <p>Cargando perfil...</p>
            </div>
        );
    }

    if (!profile && isOwnProfile && !currentUser) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="auth-required">
                        <h2>Inicia sesión para ver tu perfil</h2>
                        <p>Necesitas una cuenta para acceder a tu perfil.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-container">
                    <div className="not-found">
                        <h2>Usuario no encontrado</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Profile Header */}
                <motion.div
                    className="profile-header card-glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="profile-cover"></div>
                    <div className="profile-info">
                        <div className="profile-avatar">
                            {profile.avatar_url ? (
                                <img src={`http://localhost:3001${profile.avatar_url}`} alt={profile.display_name} />
                            ) : (
                                <span>{(profile.display_name || profile.username)?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="profile-details">
                            {isEditing ? (
                                <div className="edit-form">
                                    <input
                                        type="text"
                                        placeholder="Nombre artístico"
                                        value={editData.display_name}
                                        onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Bio"
                                        value={editData.bio}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        rows="2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Ubicación"
                                        value={editData.location}
                                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                    />
                                    <div className="edit-actions">
                                        <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
                                        <button className="btn btn-primary" onClick={handleSaveProfile}>Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1>{profile.display_name || profile.username}</h1>
                                    <p className="username">@{profile.username}</p>
                                    {profile.bio && <p className="bio">{profile.bio}</p>}
                                    <div className="profile-meta">
                                        {profile.location && (
                                            <span><MapPin size={16} /> {profile.location}</span>
                                        )}
                                        <span><Calendar size={16} /> {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <motion.button
                                    className="btn btn-ghost"
                                    onClick={() => setIsEditing(!isEditing)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Edit2 size={18} />
                                    Editar Perfil
                                </motion.button>
                            ) : (
                                <>
                                    <motion.button
                                        className="btn btn-ghost"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <MessageCircle size={18} />
                                        Mensaje
                                    </motion.button>
                                    <motion.button
                                        className={`btn ${profile.isFollowing ? 'btn-ghost' : 'btn-primary'}`}
                                        onClick={handleFollow}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Users size={18} />
                                        {profile.isFollowing ? 'Siguiendo' : 'Seguir'}
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-stats">
                        <div className="stat">
                            <span className="stat-value gradient-text">{profile.stats?.followers || 0}</span>
                            <span className="stat-label">Seguidores</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value gradient-text">{profile.stats?.following || 0}</span>
                            <span className="stat-label">Siguiendo</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value gradient-text">{profile.stats?.tracks || 0}</span>
                            <span className="stat-label">Tracks</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value gradient-text">{profile.stats?.totalPlays || 0}</span>
                            <span className="stat-label">Plays</span>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'tracks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracks')}
                    >
                        <Music size={18} />
                        Tracks
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('likes')}
                    >
                        <Heart size={18} />
                        Likes
                    </button>
                </div>

                {/* Content */}
                <motion.div
                    className="profile-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {activeTab === 'tracks' && (
                        tracks.length > 0 ? (
                            <div className="tracks-grid">
                                {tracks.map((track, index) => (
                                    <motion.div
                                        key={track.id}
                                        className="track-item card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="track-cover">
                                            {track.cover_url ? (
                                                <img src={`http://localhost:3001${track.cover_url}`} alt={track.title} />
                                            ) : (
                                                <div className="cover-placeholder">
                                                    <Music size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="track-details">
                                            <h3>{track.title}</h3>
                                            {track.genre && <span className="genre-tag">{track.genre}</span>}
                                            <div className="track-stats">
                                                <span><Heart size={14} /> {track.likes_count || 0}</span>
                                                <span><Music size={14} /> {track.plays || 0}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Music size={48} />
                                <p>{isOwnProfile ? '¡Sube tu primer track!' : 'Este artista aún no ha subido tracks'}</p>
                            </div>
                        )
                    )}

                    {activeTab === 'likes' && (
                        <div className="empty-state">
                            <Heart size={48} />
                            <p>Los tracks con like aparecerán aquí</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
