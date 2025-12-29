import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        display_name: '',
    });

    const { login, register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
            } else {
                await register({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    display_name: formData.display_name || formData.username,
                });
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="auth-modal card-glass"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>

                    <div className="auth-header">
                        <h2>{mode === 'login' ? 'Bienvenido de vuelta' : 'Únete a TUG'}</h2>
                        <p>
                            {mode === 'login'
                                ? 'Inicia sesión para continuar'
                                : 'Crea tu cuenta y empieza a compartir tu música'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && (
                            <motion.div
                                className="auth-error"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {mode === 'register' && (
                            <>
                                <div className="form-group">
                                    <label>Nombre de usuario</label>
                                    <div className="input-wrapper">
                                        <User size={20} />
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="tu_nombre_artistico"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Nombre artístico</label>
                                    <div className="input-wrapper">
                                        <User size={20} />
                                        <input
                                            type="text"
                                            name="display_name"
                                            placeholder="MC Flow"
                                            value={formData.display_name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Email</label>
                            <div className="input-wrapper">
                                <Mail size={20} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <Lock size={20} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </motion.button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                            <button onClick={toggleMode}>
                                {mode === 'login' ? 'Regístrate' : 'Inicia Sesión'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
