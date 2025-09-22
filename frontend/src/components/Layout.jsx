import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  ShoppingCart, 
  CreditCard, 
  ChefHat, 
  Users, 
  LogOut, 
  User,
  Menu as MenuIcon
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/',
      label: 'Menú',
      icon: Home,
      roles: ['admin', 'caja', 'mozo']
    },
    {
      path: '/caja',
      label: 'Caja',
      icon: CreditCard,
      roles: ['admin', 'caja']
    },
    {
      path: '/cocina',
      label: 'Cocina',
      icon: ChefHat,
      roles: ['admin', 'cocina']
    },
    {
      path: '/mozo',
      label: 'Mozo',
      icon: Users,
      roles: ['admin', 'mozo']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      caja: 'bg-blue-100 text-blue-800',
      cocina: 'bg-green-100 text-green-800',
      mozo: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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

  // Vista simplificada para clientes (solo en el menú)
  const isClientMode = localStorage.getItem('clientMode') === 'true';
  const isClientView = location.pathname === '/' && (isClientMode || !user || user.role === 'cliente');

  if (isClientView) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF8DC 0%, #FFEFD5 50%, #FFE4B5 100%)' }}>
        {/* Header simplificado para clientes */}
        <header className="header-polleria">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="text-4xl animate-flame">🔥</div>
                <div>
                  <h1 className="brand-title text-3xl text-yellow-400">
                    Los Pollos Hermanos
                  </h1>
                  <p className="text-sm text-orange-200">🍗 ¡El mejor pollo a la brasa! 🍗</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="badge-fuego">
                  📱 Menú Digital
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('clientMode');
                    navigate('/login');
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer simple */}
        <footer className="mt-12 py-6 grill-effect border-t-4" style={{ borderColor: 'var(--color-dorado)' }}>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--color-marron)' }}>🔥 Los Pollos Hermanos 🔥</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-fuego)' }}>© 2024 - El auténtico sabor a la brasa</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-marron)' }}>📍 Av. Principal 123 | 📞 (01) 555-0100 | 🕐 10:00 AM - 10:00 PM</p>
          </div>
        </footer>
      </div>
    );
  }

  // Vista completa para empleados
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFF8DC 0%, #FFEFD5 50%, #FFE4B5 100%)' }}>
      {/* Header */}
      <header className="header-polleria">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="ml-4 brand-title text-2xl text-yellow-400">
                🔥 Los Pollos Hermanos 🔥
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-200">
                  {user?.username}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-yellow-200 hover:text-white transition-colors bg-red-700 hover:bg-red-800 px-3 py-1 rounded-lg">
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 shadow-lg transition-transform duration-300 ease-in-out lg:shadow-none`} style={{ background: 'linear-gradient(to bottom, #FFF8DC, #FFE4B5)', borderRight: '3px solid var(--color-dorado)' }}>
          <nav className="h-full overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'badge-fuego transform scale-105'
                          : 'hover:bg-orange-100'
                      }`}
                      style={{ color: isActive ? 'white' : 'var(--color-marron)' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
