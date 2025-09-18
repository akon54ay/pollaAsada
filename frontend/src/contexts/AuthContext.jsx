import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para cargar usuario desde localStorage
  const loadUserFromStorage = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return parsedUser;
      } catch (error) {
        console.error('Error al parsear datos de usuario:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  };

  useEffect(() => {
    loadUserFromStorage();
    setLoading(false);

    // Escuchar cambios en localStorage desde otras pestañas
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        loadUserFromStorage();
      }
      // Si se elimina el token, cerrar sesión en esta pestaña
      if (e.key === 'token' && !e.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    // Escuchar eventos de storage (cambios desde otras pestañas)
    window.addEventListener('storage', handleStorageChange);

    // También escuchar cambios personalizados para la misma pestaña
    window.addEventListener('auth-state-changed', loadUserFromStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-changed', loadUserFromStorage);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      // Disparar evento para sincronizar otras pestañas de la misma ventana
      window.dispatchEvent(new Event('auth-state-changed'));
      
      toast.success('Inicio de sesión exitoso');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.response?.data?.message || 'Error al iniciar sesión' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      toast.success('Registro exitoso. Por favor inicia sesión.');
      return { success: true };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: error.response?.data?.message || 'Error al registrar usuario' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Sesión cerrada');
  };

  const updateProfile = async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.response?.data?.message || 'Error al actualizar perfil' };
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const canAccess = (allowedRoles) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin tiene acceso a todo
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    canAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
