import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveAuth, getStoredUser, clearAuth, isAuthenticated } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = getStoredUser();
        if (storedUser && isAuthenticated()) {
            setUser(storedUser);
            // Optionally verify token with server
            authAPI.getMe()
                .then(userData => setUser(userData))
                .catch(() => {
                    clearAuth();
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            saveAuth(response.token, response.user);
            setUser(response.user);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.register(userData);
            saveAuth(response.token, response.user);
            setUser(response.user);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        clearAuth();
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
        saveAuth(localStorage.getItem('tug_token'), { ...user, ...userData });
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
}
