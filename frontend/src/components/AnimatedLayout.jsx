import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  ShoppingCart, 
  CreditCard, 
  ChefHat, 
  Users, 
  LogOut, 
  User,
  Menu as MenuIcon,
  BarChart3,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import gsap from 'gsap';
import { useAnimation } from '../contexts/AnimationContext';

const AnimatedLayout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  
  // Referencias para animaciones
  const headerRef = useRef(null);
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);
  const menuItemsRef = useRef([]);
  const { animateIn, createTimeline } = useAnimation();

  useEffect(() => {
    // Animación de entrada del header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Animación de entrada del sidebar
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current,
        { x: -300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
    }

    // Animación stagger de los items del menú
    if (menuItemsRef.current.length > 0) {
      gsap.fromTo(menuItemsRef.current,
        { x: -50, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1, 
          delay: 0.5,
          ease: 'power2.out' 
        }
      );
    }

    // Animación del contenido principal
    if (mainRef.current) {
      gsap.fromTo(mainRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  // Animación al cambiar de ruta
  useEffect(() => {
    if (mainRef.current) {
      const tl = createTimeline();
      tl.to(mainRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in'
      })
      .set(mainRef.current, { y: -20 })
      .to(mainRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }, [location.pathname]);

  const handleLogout = () => {
    // Animación de salida antes de logout
    const tl = gsap.timeline();
    tl.to([headerRef.current, sidebarRef.current, mainRef.current], {
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.in',
      onComplete: () => {
        logout();
        navigate('/login');
      }
    });
  };

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
      roles: ['admin', 'caja', 'mozo', 'cocina'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      path: '/menu',
      label: 'Menú',
      icon: ShoppingCart,
      roles: ['admin', 'caja', 'mozo'],
      color: 'from-orange-500 to-orange-600'
    },
    {
      path: '/caja',
      label: 'Caja',
      icon: CreditCard,
      roles: ['admin', 'caja'],
      color: 'from-green-500 to-green-600'
    },
    {
      path: '/cocina',
      label: 'Cocina',
      icon: ChefHat,
      roles: ['admin', 'cocina'],
      color: 'from-red-500 to-red-600'
    },
    {
      path: '/mozo',
      label: 'Mozo',
      icon: Users,
      roles: ['admin', 'mozo'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      path: '/reportes',
      label: 'Reportes',
      icon: BarChart3,
      roles: ['admin'],
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-gradient-to-r from-purple-500 to-purple-700',
      caja: 'bg-gradient-to-r from-blue-500 to-blue-700',
      cocina: 'bg-gradient-to-r from-green-500 to-green-700',
      mozo: 'bg-gradient-to-r from-yellow-500 to-yellow-700'
    };
    return colors[role] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      caja: 'Cajero',
      cocina: 'Cocinero',
      mozo: 'Mozo'
    };
    return labels[role] || role;
  };

  const handleMenuItemClick = (index) => {
    // Animación de click en el item del menú
    gsap.to(menuItemsRef.current[index], {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header mejorado con animaciones */}
      <header ref={headerRef} className="bg-white shadow-lg border-b border-gray-200 relative overflow-hidden">
        {/* Gradiente animado de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 animate-gradient"></div>
        
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-all hover:scale-110"
                onMouseEnter={(e) => gsap.to(e.currentTarget, { rotation: 180, duration: 0.3 })}
                onMouseLeave={(e) => gsap.to(e.currentTarget, { rotation: 0, duration: 0.3 })}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <div className="ml-4 flex items-center space-x-2">
                <span className="text-2xl animate-bounce">🍗</span>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  Pollería Sistema
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Buscador animado */}
              <div className="hidden md:flex items-center">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all w-0 focus:w-64 group-hover:w-64 bg-gray-50"
                  />
                </div>
              </div>

              {/* Notificaciones con badge animado */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Usuario y rol con animación */}
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group">
                <div className="relative">
                  <User className="h-5 w-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-green-500 rounded-full border border-white"></div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-700">{user?.username}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full text-white ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-white bg-gray-100 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar mejorado con animaciones */}
        <aside 
          ref={sidebarRef}
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-all duration-500 ease-in-out lg:shadow-lg border-r border-gray-200`}
        >
          <nav className="h-full overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li 
                    key={item.path}
                    ref={el => menuItemsRef.current[index] = el}
                  >
                    <Link
                      to={item.path}
                      onClick={() => handleMenuItemClick(index)}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          gsap.to(e.currentTarget.querySelector('.menu-icon'), {
                            rotation: 360,
                            duration: 0.5
                          });
                        }
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget.querySelector('.menu-icon'), {
                          rotation: 0,
                          duration: 0.5
                        });
                      }}
                    >
                      <Icon className={`menu-icon h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto h-2 w-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Sección adicional en el sidebar */}
            <div className="mt-8 p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white">
              <h3 className="font-semibold mb-2">Tip del día</h3>
              <p className="text-sm opacity-90">
                Usa atajos de teclado para navegar más rápido. Presiona Ctrl+K para buscar.
              </p>
            </div>
          </nav>
        </aside>

        {/* Overlay mejorado para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Contenido principal con animación */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Estilos para animaciones personalizadas */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AnimatedLayout;
