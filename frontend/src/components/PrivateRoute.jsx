import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, canAccess, user } = useAuth();
  const isClientMode = localStorage.getItem('clientMode') === 'true';

  // Si está en modo cliente, permitir acceso solo al menú
  if (isClientMode && window.location.pathname === '/') {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !canAccess(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta sección.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Tu rol actual:</strong> {user?.role || 'Sin rol'}
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                <strong>Roles requeridos:</strong> {allowedRoles.join(', ')}
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Ir al Menú Principal
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('clientMode');
                  window.location.href = '/login';
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cambiar de Usuario
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
