import React, { useEffect, useRef, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  ChefHat,
  Clock,
  Package,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import gsap from 'gsap';
import { useCountAnimation } from '../hooks/useGsapAnimations';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('hoy');
  
  // Referencias para animaciones
  const statsRef = useRef([]);
  const chartsRef = useRef([]);
  const activityRef = useRef(null);
  const welcomeRef = useRef(null);
  
  // Refs para contadores animados
  const ventasCountRef = useCountAnimation(15420, 2);
  const pedidosCountRef = useCountAnimation(87, 1.5);
  const clientesCountRef = useCountAnimation(234, 2);
  const ticketPromedioRef = useCountAnimation(45, 1.5);

  // Datos simulados
  const stats = [
    {
      title: 'Ventas del Día',
      value: 'S/. 15,420',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50'
    },
    {
      title: 'Pedidos',
      value: '87',
      change: '+8.3%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-50'
    },
    {
      title: 'Clientes Atendidos',
      value: '234',
      change: '+15.2%',
      trend: 'up',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-50'
    },
    {
      title: 'Ticket Promedio',
      value: 'S/. 45.50',
      change: '-2.1%',
      trend: 'down',
      icon: Activity,
      color: 'from-orange-500 to-red-600',
      bgColor: 'from-orange-50 to-red-50'
    }
  ];

  const recentOrders = [
    { id: '#001', customer: 'Mesa 5', status: 'preparando', amount: 'S/. 85.00', time: 'Hace 5 min' },
    { id: '#002', customer: 'Delivery', status: 'listo', amount: 'S/. 120.50', time: 'Hace 10 min' },
    { id: '#003', customer: 'Mesa 12', status: 'entregado', amount: 'S/. 45.00', time: 'Hace 15 min' },
    { id: '#004', customer: 'Para llevar', status: 'pendiente', amount: 'S/. 67.80', time: 'Hace 20 min' },
    { id: '#005', customer: 'Mesa 3', status: 'preparando', amount: 'S/. 92.30', time: 'Hace 25 min' }
  ];

  const topProducts = [
    { name: '1/4 Pollo a la Brasa', sales: 45, percentage: 80 },
    { name: 'Pollo Entero', sales: 32, percentage: 65 },
    { name: 'Salchipapa', sales: 28, percentage: 55 },
    { name: 'Gaseosa 1L', sales: 52, percentage: 90 },
    { name: 'Ensalada Mixta', sales: 18, percentage: 35 }
  ];

  useEffect(() => {
    // Animación de bienvenida
    if (welcomeRef.current) {
      gsap.fromTo(welcomeRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Animación de las tarjetas de estadísticas
    if (statsRef.current.length > 0) {
      gsap.fromTo(statsRef.current,
        { 
          opacity: 0,
          y: 50,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.2)'
        }
      );
    }

    // Animación de los gráficos
    if (chartsRef.current.length > 0) {
      gsap.fromTo(chartsRef.current,
        { 
          opacity: 0,
          x: -30
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.15,
          delay: 0.3,
          ease: 'power2.out'
        }
      );
    }

    // Animación de la actividad reciente
    if (activityRef.current) {
      const items = activityRef.current.querySelectorAll('.activity-item');
      gsap.fromTo(items,
        { 
          opacity: 0,
          x: 50
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.05,
          delay: 0.5,
          ease: 'power2.out'
        }
      );
    }
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      preparando: 'bg-blue-100 text-blue-800',
      listo: 'bg-green-100 text-green-800',
      entregado: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: AlertCircle,
      preparando: Clock,
      listo: CheckCircle,
      entregado: Package
    };
    return icons[status] || AlertCircle;
  };

  const handleCardHover = (index) => {
    gsap.to(statsRef.current[index], {
      y: -10,
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleCardLeave = (index) => {
    gsap.to(statsRef.current[index], {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con bienvenida */}
      <div ref={welcomeRef} className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              ¡Bienvenido, {user?.username}! 👋
            </h1>
            <p className="text-orange-100">
              Aquí está el resumen de tu negocio hoy
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-orange-100">Fecha actual</p>
            <p className="text-2xl font-bold">{new Date().toLocaleDateString('es-PE')}</p>
          </div>
        </div>
      </div>

      {/* Selector de período */}
      <div className="flex space-x-2">
        {['hoy', 'semana', 'mes', 'año'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              selectedPeriod === period
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              ref={el => statsRef.current[index] = el}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300"
              onMouseEnter={() => handleCardHover(index)}
              onMouseLeave={() => handleCardLeave(index)}
            >
              <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 text-gray-700`} />
                  </div>
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de ventas */}
        <div 
          ref={el => chartsRef.current[0] = el}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ventas por Hora</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          {/* Gráfico simulado con barras animadas */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {[40, 65, 45, 80, 95, 70, 85, 90, 75, 88, 92, 78].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-orange-500 to-red-600 rounded-t-lg transition-all duration-500 hover:opacity-80"
                style={{
                  height: `${height}%`,
                  animation: `growUp 0.5s ease-out ${i * 0.05}s both`
                }}
              >
                <div className="text-xs text-white text-center pt-2">
                  {i + 10}h
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top productos */}
        <div 
          ref={el => chartsRef.current[1] = el}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top Productos</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{product.name}</span>
                  <span className="text-sm text-gray-500">{product.sales} ventas</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000"
                    style={{
                      width: `${product.percentage}%`,
                      animation: `slideWidth 1s ease-out ${index * 0.1}s both`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Pedidos Recientes</h2>
            <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
              Ver todos →
            </button>
          </div>
        </div>
        
        <div ref={activityRef} className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <tr key={order.id} className="activity-item hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {order.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.time}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes growUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideWidth {
          from {
            width: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
