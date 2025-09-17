import React, { useState, useEffect } from 'react';
import { mozoService } from '../services/api';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  MapPin,
  Package,
  RefreshCw,
  TrendingUp,
  Coffee,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const Mozo = () => {
  const [activeTab, setActiveTab] = useState('listos');
  const [pedidosListos, setPedidosListos] = useState([]);
  const [mesasActivas, setMesasActivas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [pedidosMesa, setPedidosMesa] = useState([]);

  useEffect(() => {
    fetchData();
    // Actualizar cada 20 segundos
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [pedidosRes, mesasRes, statsRes] = await Promise.all([
        mozoService.getPedidosListos(),
        mozoService.getMesasActivas(),
        mozoService.getEstadisticas()
      ]);
      
      setPedidosListos(pedidosRes.data);
      setMesasActivas(mesasRes.data);
      setEstadisticas(statsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarEntregado = async (pedidoId) => {
    setProcesando(pedidoId);
    try {
      await mozoService.marcarComoEntregado(pedidoId);
      toast.success('Pedido entregado exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al marcar como entregado');
    } finally {
      setProcesando(null);
    }
  };

  const handleVerPedidosMesa = async (mesa) => {
    try {
      setSelectedMesa(mesa);
      const response = await mozoService.getPedidosPorMesa(mesa);
      setPedidosMesa(response.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar pedidos de la mesa');
    }
  };

  const getTiempoEsperando = (fechaListo) => {
    const minutos = differenceInMinutes(new Date(), new Date(fechaListo));
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const getColorTiempo = (minutos) => {
    if (minutos < 5) return 'text-green-600';
    if (minutos < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'preparando': 'bg-blue-100 text-blue-800',
      'listo': 'bg-green-100 text-green-800',
      'entregado': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Panel del Mozo</h1>
            <p className="text-gray-600 mt-1">Gestión de entregas y mesas</p>
          </div>
          <button
            onClick={fetchData}
            className="btn-outline flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Listos para Entrega</p>
                  <p className="text-3xl font-bold text-green-900">
                    {estadisticas.pedidos_listos_para_entrega}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Entregados Hoy</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {estadisticas.pedidos_entregados_hoy}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Mesas Activas</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {estadisticas.mesas_activas}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            
            <div className="card bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Tiempo Promedio</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {estadisticas.tiempo_promedio_entrega_minutos} min
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('listos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listos'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pedidos Listos
          </button>
          <button
            onClick={() => setActiveTab('mesas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mesas'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mesas Activas
          </button>
        </nav>
      </div>

      {/* Contenido según tab */}
      {activeTab === 'listos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pedidosListos.length === 0 ? (
            <div className="col-span-full">
              <div className="card text-center py-12">
                <Coffee className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay pedidos listos para entregar</p>
                <p className="text-sm text-gray-400 mt-2">
                  Los pedidos aparecerán aquí cuando estén listos
                </p>
              </div>
            </div>
          ) : (
            pedidosListos.map(pedido => {
              const tiempoEsperando = pedido.tiempo_esperando_entrega;
              const isProcesando = procesando === pedido.id;
              
              return (
                <div key={pedido.id} className="card hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">#{pedido.numero_pedido}</span>
                        {tiempoEsperando > 10 && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      {pedido.cliente_nombre && (
                        <p className="text-sm text-gray-600">{pedido.cliente_nombre}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getColorTiempo(tiempoEsperando)}`}>
                        <Clock className="h-4 w-4 inline mr-1" />
                        {getTiempoEsperando(pedido.fecha_listo)}
                      </p>
                    </div>
                  </div>

                  {/* Información de entrega */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {pedido.tipo_pedido === 'local' ? 'Para Mesa' : 
                         pedido.tipo_pedido === 'llevar' ? 'Para Llevar' : 'Delivery'}
                      </span>
                      {pedido.mesa && (
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-semibold">
                          Mesa {pedido.mesa}
                        </span>
                      )}
                    </div>
                    
                    {pedido.pago && (
                      <div className="text-xs text-gray-500">
                        Ticket: {pedido.pago.numero_ticket}
                      </div>
                    )}
                  </div>

                  {/* Detalles del pedido */}
                  <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                    {pedido.detalles.map((detalle, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          <span className="font-medium">{detalle.cantidad}x</span> {detalle.menu.nombre}
                        </span>
                      </div>
                    ))}
                  </div>

                  {pedido.observaciones && (
                    <div className="bg-yellow-50 rounded p-2 mb-3">
                      <p className="text-xs text-yellow-800">
                        <strong>Nota:</strong> {pedido.observaciones}
                      </p>
                    </div>
                  )}

                  {/* Botón de acción */}
                  <button
                    onClick={() => handleMarcarEntregado(pedido.id)}
                    disabled={isProcesando}
                    className="w-full btn-primary py-2 flex items-center justify-center space-x-2"
                  >
                    {isProcesando ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Marcar como Entregado</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Tab de mesas activas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesasActivas.length === 0 ? (
            <div className="col-span-full">
              <div className="card text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay mesas activas</p>
              </div>
            </div>
          ) : (
            mesasActivas.map(mesa => (
              <div key={mesa.mesa} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold">Mesa {mesa.mesa}</h3>
                    <p className="text-sm text-gray-600">
                      {mesa.pedidos_activos} pedido{mesa.pedidos_activos !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tiempo ocupada:</span>
                    <span className="font-medium">{mesa.tiempo_ocupacion_minutos} min</span>
                  </div>
                  
                  {mesa.total_pendiente_pago > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pendiente pago:</span>
                      <span className="font-medium text-red-600">
                        S/. {mesa.total_pendiente_pago.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {mesa.estados.map((estado, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-1 text-xs rounded-full ${getEstadoBadge(estado)}`}
                    >
                      {estado}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleVerPedidosMesa(mesa.mesa)}
                  className="w-full btn-outline py-2 text-sm"
                >
                  Ver Pedidos
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de pedidos por mesa */}
      {selectedMesa && pedidosMesa.length > 0 && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setSelectedMesa(null);
              setPedidosMesa([]);
            }}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-3xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Pedidos Mesa {selectedMesa}</h3>
                  <button
                    onClick={() => {
                      setSelectedMesa(null);
                      setPedidosMesa([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pedidosMesa.map(pedido => (
                    <div key={pedido.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-bold">#{pedido.numero_pedido}</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getEstadoBadge(pedido.estado)}`}>
                            {pedido.estado}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(pedido.createdAt), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {pedido.detalles.map((detalle, idx) => (
                          <div key={idx} className="text-sm text-gray-600">
                            {detalle.cantidad}x {detalle.menu.nombre}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 pt-2 border-t flex justify-between">
                        <span className="text-sm font-medium">Total:</span>
                        <span className="font-bold">S/. {parseFloat(pedido.total).toFixed(2)}</span>
                      </div>
                      
                      {pedido.pago ? (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ Pagado - {pedido.pago.metodo_pago}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-red-600">
                          ⚠ Pendiente de pago
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedMesa(null);
                      setPedidosMesa([]);
                    }}
                    className="btn-primary"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Mozo;
