import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AnimatedLayout from './components/AnimatedLayout'
import Login from './pages/Login'
import MenuAnimated from './pages/MenuAnimated'
import Dashboard from './pages/Dashboard'
import Caja from './pages/Caja'
import Cocina from './pages/Cocina'
import { LenisProvider } from './hooks/useLenis'
import { AnimationProvider } from './contexts/AnimationContext'

const Pedidos = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold">Pedidos</h1>
  </div>
)

const Mozo = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold">Panel de Mozo</h1>
  </div>
)

const Reportes = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold">Reportes</h1>
  </div>
)

const Usuarios = () => (
  <div className="container mx-auto p-6">
    <h1 className="text-3xl font-bold">Usuarios</h1>
  </div>
)

function App() {
  useEffect(() => {
    // Prevenir zoom en dispositivos móviles
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault()
    })
    
    // Deshabilitar el menú contextual en producción
    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    }
  }, [])

  return (
    <Router>
      <AuthProvider>
        <AnimationProvider>
          <LenisProvider>
            <div className="app">
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#333',
                    color: '#fff',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas */}
                <Route element={<PrivateRoute />}>
                  <Route path="/" element={<AnimatedLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="menu" element={<MenuAnimated />} />
                    <Route path="pedidos" element={<Pedidos />} />
                    <Route path="caja" element={<Caja />} />
                    <Route path="cocina" element={<Cocina />} />
                    <Route path="mozo" element={<Mozo />} />
                    <Route path="reportes" element={<Reportes />} />
                    <Route path="usuarios" element={<Usuarios />} />
                  </Route>
                </Route>
              </Routes>
            </div>
          </LenisProvider>
        </AnimationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
