import { motion } from 'framer-motion';
import { Music, Users, Sparkles, TrendingUp, Upload, MessageCircle, ArrowRight, Play } from 'lucide-react';
import './Landing.css';

export default function Landing() {
    const features = [
        {
            icon: <Upload size={32} />,
            title: 'Sube Tu Música',
            description: 'Comparte tus tracks en alta calidad. Sin límites, sin compromisos.'
        },
        {
            icon: <Users size={32} />,
            title: 'Colabora',
            description: 'Conecta con otros artistas y crea colaboraciones épicas.'
        },
        {
            icon: <TrendingUp size={32} />,
            title: 'Crece',
            description: 'Construye tu audiencia y lleva tu carrera al siguiente nivel.'
        },
        {
            icon: <MessageCircle size={32} />,
            title: 'Comunidad',
            description: 'Recibe feedback de fans y otros raperos del movimiento.'
        }
    ];

    const stats = [
        { value: '10K+', label: 'Artistas' },
        { value: '50K+', label: 'Tracks' },
        { value: '100K+', label: 'Colaboraciones' }
    ];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Sparkles size={16} />
                        <span>La red social del rap español</span>
                    </motion.div>

                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Tu voz merece ser
                        <br />
                        <span className="gradient-text">escuchada</span>
                    </motion.h1>

                    <motion.p
                        className="hero-description"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        Únete a la comunidad de raperos españoles más vibrante.
                        Comparte tu música, colabora con artistas y crece en el movimiento.
                    </motion.p>

                    <motion.div
                        className="hero-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button className="btn btn-primary btn-lg">
                            <Play size={20} />
                            Empezar Ahora
                        </button>
                        <button className="btn btn-outline btn-lg">
                            Explorar Música
                            <ArrowRight size={20} />
                        </button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="hero-stats"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-value gradient-text-accent">{stat.value}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Hero Visual */}
                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    <div className="visual-card card-glass glow animate-float">
                        <Music size={64} className="visual-icon" />
                    </div>
                    <div className="visual-gradient"></div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features" id="explorar">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>Todo lo que necesitas para brillar</h2>
                    <p>Herramientas diseñadas para artistas emergentes y profesionales</p>
                </motion.div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="feature-card card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="feature-icon gradient-primary">
                                {feature.icon}
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <motion.div
                    className="cta-content card-glass"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2>¿Listo para unirte al movimiento?</h2>
                    <p>Miles de artistas ya están construyendo su futuro en TUG</p>
                    <div className="cta-actions">
                        <button className="btn btn-primary btn-lg">
                            Crear Cuenta Gratis
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
