import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, LogIn, ChefHat, DollarSign, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import gsap from 'gsap';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // Referencias para animaciones
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const formRef = useRef(null);
  const quickAccessRef = useRef(null);

  useEffect(() => {
    // Animación de entrada
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { scale: 0.8, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Animación del logo
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { rotation: -180, scale: 0 },
        { rotation: 0, scale: 1, duration: 1, delay: 0.3, ease: 'back.out(1.7)' }
      );
    }

    // Animación del formulario
    if (formRef.current) {
      gsap.fromTo(formRef.current.children,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
      );
    }

    // Animación de los botones de acceso rápido
    if (quickAccessRef.current) {
      gsap.fromTo(quickAccessRef.current.children,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1, delay: 0.8, ease: 'back.out(1.2)' }
      );
    }
  }, []);

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Por favor completa todos los campos');
      // Animación de shake para error
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          x: [0, -10, 10, -10, 10, 0],
          duration: 0.5,
          ease: 'power2.inOut'
        });
      }
      return;
    }

    setLoading(true);
    
    // Animación de loading
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 0.98,
        duration: 0.2,
        ease: 'power2.in'
      });
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Animación de éxito
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          scale: 0,
          opacity: 0,
          rotation: 180,
          duration: 0.6,
          ease: 'power3.in',
          onComplete: () => {
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
        });
      }
    } else {
      // Restaurar escala en caso de error
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
    setLoading(false);
  };

  const handleQuickLogin = async (username, password, event) => {
    const buttonElement = event.currentTarget;
    
    // Animar el botón clickeado
    gsap.to(buttonElement, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
    
    setLoading(true);
    const result = await login(username, password);
    
    if (result.success) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-md w-full relative">
        <div ref={containerRef} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative z-10">
          {/* Logo y título con animación */}
          <div className="text-center mb-8">
            <div ref={logoRef} className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <span className="text-5xl">🍗</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">Pollería Sistema</h1>
            <p className="text-gray-600 mt-2">Inicia sesión para continuar</p>
          </div>

          {/* Formulario con animación */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur"
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
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
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

          {/* Accesos rápidos para desarrollo */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Acceso rápido (desarrollo)</p>
            <div ref={quickAccessRef} className="grid grid-cols-2 gap-3">
              <button
                onClick={(e) => handleQuickLogin('admin', 'admin123', e)}
                disabled={loading}
                className="group px-3 py-2 text-xs bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Admin
              </button>
              <button
                onClick={(e) => handleQuickLogin('caja', 'caja123', e)}
                disabled={loading}
                className="group px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Cajero
              </button>
              <button
                onClick={(e) => handleQuickLogin('cocina', 'cocina123', e)}
                disabled={loading}
                className="group px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Cocinero
              </button>
              <button
                onClick={(e) => handleQuickLogin('mozo', 'mozo123', e)}
                disabled={loading}
                className="group px-3 py-2 text-xs bg-gradient-to-r from-yellow-500 to-yellow-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Mozo
              </button>
            </div>
          </div>
        </div>
        {/* Efecto de brillo animado */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse"></div>
      </div>
    </div>
  );
};

export default Login;
