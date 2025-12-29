import { motion } from 'framer-motion';
import { Music, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <motion.nav
        className="navbar glass"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="navbar-logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Music className="logo-icon" />
              <span className="logo-text gradient-text">TUG</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-links">
            <Link to="/" className="nav-link">Inicio</Link>
            <Link to="/feed" className="nav-link">Feed</Link>
            <Link to="/community" className="nav-link">Comunidad</Link>
            {isAuthenticated && (
              <Link to="/upload" className="nav-link">Subir</Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <motion.div
                    className="user-avatar-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} />
                    ) : (
                      <User size={20} />
                    )}
                    <span>{user?.display_name || user?.username}</span>
                  </motion.div>
                </Link>
                <motion.button
                  className="btn btn-ghost"
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={18} />
                  Salir
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  className="btn btn-ghost"
                  onClick={() => openAuthModal('login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn size={18} />
                  Iniciar Sesión
                </motion.button>
                <motion.button
                  className="btn btn-primary"
                  onClick={() => openAuthModal('register')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Registrarse
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="mobile-menu-btn"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            className="mobile-menu glass"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Link to="/" className="mobile-link" onClick={toggleMenu}>Inicio</Link>
            <Link to="/feed" className="mobile-link" onClick={toggleMenu}>Feed</Link>
            <Link to="/community" className="mobile-link" onClick={toggleMenu}>Comunidad</Link>
            {isAuthenticated && (
              <Link to="/upload" className="mobile-link" onClick={toggleMenu}>Subir</Link>
            )}
            <div className="mobile-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={toggleMenu}>
                    <button className="btn btn-ghost">
                      <User size={18} />
                      Mi Perfil
                    </button>
                  </Link>
                  <button className="btn btn-primary" onClick={() => { handleLogout(); toggleMenu(); }}>
                    <LogOut size={18} />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={() => { openAuthModal('login'); toggleMenu(); }}>
                    <LogIn size={18} />
                    Iniciar Sesión
                  </button>
                  <button className="btn btn-primary" onClick={() => { openAuthModal('register'); toggleMenu(); }}>
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
