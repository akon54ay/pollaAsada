import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // Si ya está autenticado, redirigir
  // COMENTADO TEMPORALMENTE PARA DEBUGGEAR
  // if (isAuthenticated) {
  //   return <Navigate to="/" replace />;
  // }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Redirigir según el rol
      switch (result.user.role) {
        case 'caja':
          navigate('/caja');
          break;
        case 'cocina':
          navigate('/cocina');
          break;
        case 'mozo':
          navigate('/mozo');
          break;
        default:
          navigate('/');
      }
    }
    setLoading(false);
  };

  const handleQuickLogin = async (username, password, customRoute = null) => {
    setLoading(true);
    const result = await login(username, password);
    
    if (result.success) {
      if (customRoute) {
        navigate(customRoute);
      } else {
        switch (result.user.role) {
          case 'caja':
            navigate('/caja');
            break;
          case 'cocina':
            navigate('/cocina');
            break;
          case 'mozo':
            navigate('/mozo');
            break;
          default:
            navigate('/');
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
              <span className="text-4xl">🍗</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Pollería Sistema</h1>
            <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario o Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Ingresa tu usuario"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Botón de emergencia para limpiar localStorage */}
          <div className="mt-4">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                toast.success('Storage limpiado. Puedes iniciar sesión ahora.');
                window.location.reload();
              }}
              className="w-full px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border border-red-300"
            >
              🔧 Limpiar Storage (Fix de Emergencia)
            </button>
          </div>

          {/* Accesos rápidos para desarrollo */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Acceso rápido (desarrollo)</p>
            
            {/* Acceso Cliente Destacado */}
            <div className="mb-3">
              <button
                onClick={() => {
                  // Acceso directo sin autenticación para cliente
                  localStorage.setItem('clientMode', 'true');
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/';  // Usar window.location para forzar recarga
                }}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <span>🍗</span>
                <span>Acceso Cliente - Ver Menú</span>
              </button>
            </div>
            
            {/* Accesos principales */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => handleQuickLogin('admin', 'admin123')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickLogin('caja', 'caja123')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Cajero
              </button>
              <button
                onClick={() => handleQuickLogin('cocina', 'cocina123')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                Cocinero
              </button>
              <button
                onClick={() => handleQuickLogin('mozo', 'mozo123')}
                disabled={loading}
                className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                Mozo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
