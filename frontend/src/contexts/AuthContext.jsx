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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          const user = JSON.parse(storedUser);
          setUser(user);
          setIsAuthenticated(true);
          // Verificar token con el backend
          try {
            await authService.validateToken();
          } catch (error) {
            // Si el token no es válido, limpiar todo
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      setUser(response.data.user);
      setIsAuthenticated(true);
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
