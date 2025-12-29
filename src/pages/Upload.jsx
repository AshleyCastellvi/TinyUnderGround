import { motion } from 'framer-motion';
import { Upload as UploadIcon, Image, X, Plus, Loader, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tracksAPI } from '../services/api';
import './Upload.css';

export default function Upload() {
    const [dragActive, setDragActive] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        genre: '',
        tags: ''
    });

    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="upload-page">
                <div className="upload-container">
                    <div className="auth-required">
                        <h2>Inicia sesión para subir música</h2>
                        <p>Necesitas una cuenta para compartir tu música con la comunidad.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('audio/')) {
                setAudioFile(file);
                setError('');
            } else {
                setError('Por favor, selecciona un archivo de audio válido');
            }
        }
    };

    const handleAudioChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setError('');
        }
    };

    const handleCoverChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!audioFile) {
            setError('Por favor, selecciona un archivo de audio');
            return;
        }

        if (!formData.title.trim()) {
            setError('El título es requerido');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await tracksAPI.create(formData, audioFile, coverFile);
            setSuccess(true);
            setTimeout(() => {
                navigate('/feed');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Error al subir el track');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="upload-page">
                <div className="upload-container">
                    <motion.div
                        className="success-message"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className="success-icon">
                            <Check size={48} />
                        </div>
                        <h2>¡Track subido exitosamente!</h2>
                        <p>Redirigiendo al feed...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="upload-page">
            <div className="upload-container">
                <motion.div
                    className="upload-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1>Sube Tu Música</h1>
                    <p>Comparte tu arte con la comunidad</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="upload-content">
                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Audio Upload */}
                    <motion.div
                        className="upload-section card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2>Archivo de Audio *</h2>
                        <div
                            className={`dropzone ${dragActive ? 'active' : ''} ${audioFile ? 'has-file' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {audioFile ? (
                                <div className="file-info">
                                    <UploadIcon size={48} className="file-icon" />
                                    <h3>{audioFile.name}</h3>
                                    <p>{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => setAudioFile(null)}
                                    >
                                        Cambiar Archivo
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <UploadIcon size={64} className="upload-icon" />
                                    <h3>Arrastra tu archivo aquí</h3>
                                    <p>o haz click para seleccionar</p>
                                    <p className="file-types">MP3, WAV, FLAC, OGG (Max 100MB)</p>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={handleAudioChange}
                                        className="file-input"
                                    />
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Track Details */}
                    <motion.div
                        className="upload-section card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2>Detalles del Track</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Título *</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Nombre de tu track"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Género</label>
                                <select
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Selecciona un género</option>
                                    <option value="Rap">Rap</option>
                                    <option value="Trap">Trap</option>
                                    <option value="Hip-Hop">Hip-Hop</option>
                                    <option value="Freestyle">Freestyle</option>
                                    <option value="Boom Bap">Boom Bap</option>
                                    <option value="Drill">Drill</option>
                                    <option value="R&B">R&B</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Descripción</label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    placeholder="Cuéntanos sobre tu track..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Tags</label>
                                <input
                                    type="text"
                                    name="tags"
                                    placeholder="rap, español, underground, freestyle (separados por coma)"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Cover Image */}
                    <motion.div
                        className="upload-section card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2>Portada (Opcional)</h2>
                        <div className="cover-upload">
                            {coverPreview ? (
                                <div className="cover-preview">
                                    <img src={coverPreview} alt="Cover" />
                                    <button
                                        type="button"
                                        className="remove-cover"
                                        onClick={() => { setCoverFile(null); setCoverPreview(null); }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <label className="cover-placeholder">
                                    <Image size={48} />
                                    <span>Subir Portada</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="file-input"
                                    />
                                </label>
                            )}
                        </div>
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                        className="upload-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader className="spinner" size={20} />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <UploadIcon size={20} />
                                    Publicar Track
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
}
