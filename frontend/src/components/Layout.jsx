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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-xl font-bold text-gray-900">
                🍗 Pollería Sistema
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.username}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
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
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:shadow-none border-r border-gray-200`}>
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
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
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
