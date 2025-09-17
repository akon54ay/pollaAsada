import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, LogIn, ChefHat, DollarSign, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFadeIn, useSlideIn, useHoverAnimation, useStaggerAnimation } from '../hooks/useGsapAnimations';
import { useAnimation } from '../contexts/AnimationContext';
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
  const logoRef = useFadeIn(0.2);
  const titleRef = useSlideIn('up', 0.3);
  const formRef = useFadeIn(0.5);
  const quickAccessRef = useStaggerAnimation('.quick-login-btn', 0.1);
  const { animateIn, shakeAnimation, pulseAnimation } = useAnimation();

  // Animaciones adicionales con GSAP
  const containerRef = useRef(null);
  const floatingIconsRef = useRef([]);

  useEffect(() => {
    // Animación de entrada del contenedor
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { 
          scale: 0.8, 
          opacity: 0,
          rotationY: 90
        },
        { 
          scale: 1, 
          opacity: 1,
          rotationY: 0,
          duration: 1,
          ease: 'power3.out'
        }
      );
    }

    // Animación de iconos flotantes
    floatingIconsRef.current.forEach((icon, index) => {
      if (icon) {
        gsap.to(icon, {
          y: '+=20',
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          delay: index * 0.2
        });
      }
    });

    // Animación de partículas de fondo
    createBackgroundParticles();
  }, []);

  const createBackgroundParticles = () => {
    const particlesContainer = document.getElementById('particles-container');
    if (!particlesContainer) return;

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 6 + 2}px;
        height: ${Math.random() * 6 + 2}px;
        background: rgba(251, 146, 60, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        pointer-events: none;
      `;
      particlesContainer.appendChild(particle);

      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 100
      });

      gsap.to(particle, {
        y: -100,
        x: `+=${Math.random() * 200 - 100}`,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        ease: 'none',
        delay: Math.random() * 5
      });
    }
  };

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Por favor completa todos los campos');
      if (containerRef.current) {
        shakeAnimation(containerRef.current);
      }
      return;
    }

    setLoading(true);
    
    // Animación de loading
    const loadingTimeline = gsap.timeline();
    loadingTimeline.to(containerRef.current, {
      scale: 0.95,
      duration: 0.2,
      ease: 'power2.in'
    });

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Animación de éxito
      loadingTimeline.to(containerRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: 'back.out(1.7)'
      }).to(containerRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
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
    } else {
      // Animación de error
      loadingTimeline.to(containerRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
    
    setLoading(false);
  };

  const handleQuickLogin = async (username, password, buttonRef) => {
    setLoading(true);
    
    // Animar el botón clickeado
    if (buttonRef) {
      gsap.to(buttonRef, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
    
    const result = await login(username, password);
    
    if (result.success) {
      // Animación de transición exitosa
      gsap.to(containerRef.current, {
        scale: 0,
        rotation: 360,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.in',
        onComplete: () => {
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
    setLoading(false);
  };

  const quickAccessButtons = [
    { role: 'admin', icon: ShieldCheck, color: 'purple', username: 'admin', password: 'admin123' },
    { role: 'caja', icon: DollarSign, color: 'blue', username: 'caja', password: 'caja123' },
    { role: 'cocina', icon: ChefHat, color: 'green', username: 'cocina', password: 'cocina123' },
    { role: 'mozo', icon: Users, color: 'yellow', username: 'mozo', password: 'mozo123' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Contenedor de partículas */}
      <div id="particles-container" className="absolute inset-0 overflow-hidden"></div>
      
      {/* Iconos flotantes de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div ref={el => floatingIconsRef.current[0] = el} className="absolute top-1/4 left-1/4 text-white/10">
          <ChefHat size={100} />
        </div>
        <div ref={el => floatingIconsRef.current[1] = el} className="absolute top-3/4 right-1/4 text-white/10">
          <DollarSign size={80} />
        </div>
        <div ref={el => floatingIconsRef.current[2] = el} className="absolute bottom-1/4 left-1/3 text-white/10">
          <Users size={90} />
        </div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div ref={containerRef} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 transform-gpu">
          {/* Logo y título con animación */}
          <div className="text-center mb-8">
            <div ref={logoRef} className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4 shadow-lg transform hover:scale-110 transition-transform cursor-pointer">
              <span className="text-5xl animate-pulse">🍗</span>
            </div>
            <h1 ref={titleRef} className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Pollería Sistema
            </h1>
            <p className="text-gray-600 mt-2 animate-fade-in">Inicia sesión para continuar</p>
          </div>

          {/* Formulario con animación */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-orange-500 transition-colors">
                Usuario o Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
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

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-orange-500 transition-colors">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Accesos rápidos con animación stagger */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Acceso rápido (desarrollo)</p>
            <div ref={quickAccessRef} className="grid grid-cols-2 gap-3">
              {quickAccessButtons.map((btn, index) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={btn.role}
                    onClick={(e) => handleQuickLogin(btn.username, btn.password, e.currentTarget)}
                    disabled={loading}
                    className={`quick-login-btn group px-4 py-3 bg-gradient-to-r from-${btn.color}-400 to-${btn.color}-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50`}
                  >
                    <Icon className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium capitalize">{btn.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Efecto de brillo animado */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-purple-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
      </div>
    </div>
  );
};

export default Login;
