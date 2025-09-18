import React, { useState, useEffect } from 'react';
import { cocinaService } from '../services/api';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Timer,
  TrendingUp,
  Package,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const Cocina = () => {
  const [pedidos, setPedidos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [productosMasPedidos, setProductosMasPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastPedidosCount, setLastPedidosCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-actualización cada 10 segundos
  useAutoRefresh(() => {
    if (autoRefresh) {
      fetchData();
    }
  }, 10000, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, statsRes, productosRes] = await Promise.all([
        cocinaService.getPedidosPendientes(),
        cocinaService.getEstadisticas(),
        cocinaService.getProductosMasPedidos()
      ]);
      
      // Verificar si hay nuevos pedidos
      const nuevosPedidos = pedidosRes.data || [];
      if (nuevosPedidos.length > lastPedidosCount) {
        const diff = nuevosPedidos.length - lastPedidosCount;
        toast.success(
          `🔔 ${diff} nuevo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''} en cocina`,
          { duration: 5000 }
        );
        // Reproducir sonido de notificación
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }
      setLastPedidosCount(nuevosPedidos.length);
      
      setPedidos(nuevosPedidos);
      setEstadisticas(statsRes.data);
      setProductosMasPedidos(productosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleIniciarPreparacion = async (pedidoId) => {
    setProcesando(pedidoId);
    try {
      await cocinaService.iniciarPreparacion(pedidoId);
      toast.success('Preparación iniciada');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al iniciar preparación');
    } finally {
      setProcesando(null);
    }
  };

  const handleMarcarListo = async (pedidoId) => {
    setProcesando(pedidoId);
    try {
      await cocinaService.marcarComoListo(pedidoId);
      toast.success('Pedido marcado como listo');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al marcar como listo');
    } finally {
      setProcesando(null);
    }
  };

  const getTiempoEspera = (fechaCreacion) => {
    const minutos = differenceInMinutes(new Date(), new Date(fechaCreacion));
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const getColorTiempo = (minutos) => {
    if (minutos < 15) return 'text-green-600';
    if (minutos < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cocina</h1>
            <p className="text-gray-600 mt-1">Panel de comandas y preparación</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={autoRefresh ? 'Auto-actualización activa' : 'Auto-actualización pausada'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
              <span className="text-sm">{autoRefresh ? 'Auto 10s' : 'Manual'}</span>
            </button>
            <button
              onClick={fetchData}
              className="btn-outline flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar Ahora</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-900">{estadisticas.pendientes}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">En Preparación</p>
                  <p className="text-3xl font-bold text-blue-900">{estadisticas.en_preparacion}</p>
                </div>
                <ChefHat className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Listos Hoy</p>
                  <p className="text-3xl font-bold text-green-900">{estadisticas.listos_hoy}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Tiempo Promedio</p>
                  <p className="text-3xl font-bold text-purple-900">{estadisticas.tiempo_promedio_preparacion} min</p>
                </div>
                <Timer className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de pedidos */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Pedidos en Cola
            </h2>
            
            {pedidos.length === 0 ? (
              <div className="text-center py-12">
                <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay pedidos pendientes</p>
                <p className="text-sm text-gray-400 mt-2">Los nuevos pedidos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidos.map(pedido => {
                  const tiempoEspera = pedido.tiempo_espera_minutos;
                  const isProcesando = procesando === pedido.id;
                  
                  return (
                    <div 
                      key={pedido.id} 
                      className={`border rounded-lg p-4 ${
                        pedido.estado === 'preparando' 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Header del pedido */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">#{pedido.numero_pedido}</span>
                            {pedido.mesa && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                Mesa {pedido.mesa}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              pedido.estado === 'preparando'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {pedido.estado === 'preparando' ? 'En Preparación' : 'Pendiente'}
                            </span>
                          </div>
                          {pedido.cliente_nombre && (
                            <p className="text-sm text-gray-600 mt-1">Cliente: {pedido.cliente_nombre}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-sm font-medium ${getColorTiempo(tiempoEspera)}`}>
                            <Clock className="h-4 w-4 inline mr-1" />
                            {getTiempoEspera(pedido.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(pedido.createdAt), 'HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>

                      {/* Detalles del pedido */}
                      <div className="border-t pt-3 mb-3">
                        <div className="space-y-2">
                          {pedido.detalles.map((detalle, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div className="flex-1">
                                <span className="font-medium">{detalle.cantidad}x</span>{' '}
                                <span>{detalle.menu.nombre}</span>
                                {detalle.observaciones && (
                                  <p className="text-xs text-gray-500 italic ml-6">
                                    Nota: {detalle.observaciones}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {detalle.menu.tiempo_preparacion} min
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {pedido.observaciones && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded">
                            <p className="text-sm text-yellow-800">
                              <strong>Observaciones:</strong> {pedido.observaciones}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex space-x-2">
                        {pedido.estado === 'pendiente' ? (
                          <>
                            <button
                              onClick={() => handleIniciarPreparacion(pedido.id)}
                              disabled={isProcesando}
                              className="flex-1 btn-secondary py-2 flex items-center justify-center space-x-2"
                            >
                              {isProcesando ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <ChefHat className="h-4 w-4" />
                                  <span>Iniciar Preparación</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleMarcarListo(pedido.id)}
                              disabled={isProcesando}
                              className="flex-1 btn-primary py-2 flex items-center justify-center space-x-2"
                            >
                              {isProcesando ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Marcar Listo</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleMarcarListo(pedido.id)}
                            disabled={isProcesando}
                            className="w-full btn-primary py-2 flex items-center justify-center space-x-2"
                          >
                            {isProcesando ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Marcar como Listo</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Productos más pedidos */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Productos del Día
            </h2>
            
            {productosMasPedidos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
            ) : (
              <div className="space-y-3">
                {productosMasPedidos.slice(0, 10).map((producto, idx) => (
                  <div key={producto.menu_id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg font-bold ${
                        idx === 0 ? 'text-yellow-500' :
                        idx === 1 ? 'text-gray-400' :
                        idx === 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{producto.menu.nombre}</p>
                        <p className="text-xs text-gray-500">{producto.menu.categoria}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
                      {producto.total_cantidad}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leyenda de tiempos */}
          <div className="card mt-4">
            <h3 className="font-semibold mb-3">Indicadores de Tiempo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Menos de 15 minutos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Entre 15-30 minutos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Más de 30 minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cocina;
