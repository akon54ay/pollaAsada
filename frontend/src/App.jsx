import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Páginas
import Login from './pages/Login';
import Menu from './pages/Menu';
import Caja from './pages/Caja';
import Cocina from './pages/Cocina';
import Mozo from './pages/Mozo';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4ade80',
                  secondary: 'black',
                },
              },
            }}
          />
          
          <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute allowedRoles={['admin', 'caja', 'mozo']}>
                <Layout>
                  <Menu />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/caja"
            element={
              <PrivateRoute allowedRoles={['admin', 'caja']}>
                <Layout>
                  <Caja />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/cocina"
            element={
              <PrivateRoute allowedRoles={['admin', 'cocina']}>
                <Layout>
                  <Cocina />
                </Layout>
              </PrivateRoute>
            }
          />
          
          <Route
            path="/mozo"
            element={
              <PrivateRoute allowedRoles={['admin', 'mozo']}>
                <Layout>
                  <Mozo />
                </Layout>
              </PrivateRoute>
            }
          />
          
          {/* Redirigir cualquier ruta no encontrada al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
