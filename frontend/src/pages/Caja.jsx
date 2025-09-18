import React, { useState, useEffect } from 'react';
import { cajaService, pedidoService } from '../services/api';
import useCartStore from '../stores/useCartStore';
import usePedidosStore from '../stores/usePedidosStore';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  RefreshCw,
  Bell,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Caja = () => {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [loading, setLoading] = useState(false);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [pedidosPendientesPago, setPedidosPendientesPago] = useState([]);
  const [resumenCaja, setResumenCaja] = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const {
    items: cartItems,
    mesa,
    clienteNombre,
    tipoPedido,
    observaciones,
    updateOrderData,
    getTotal,
    getPedidoData,
    clearCart
  } = useCartStore();
  
  const { fetchPedidosPendientes, pedidosPendientes, procesarPedidoEnCaja } = usePedidosStore();

  useEffect(() => {
    fetchPedidosRecientes();
    fetchPedidosPendientesPago();
    fetchResumenCaja();
  }, []);

  // Auto-actualización cada 5 segundos
  useAutoRefresh(() => {
    if (autoRefresh) {
      fetchPedidosRecientes();
      fetchPedidosPendientesPago();
      fetchResumenCaja();
    }
  }, 5000, [activeTab]);

  const fetchPedidosRecientes = async () => {
    try {
      const response = await pedidoService.getPedidos({ estado: 'pendiente' });
      setPedidosRecientes(response.data.slice(0, 10)); // Últimos 10 pedidos
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    }
  };

  const fetchPedidosPendientesPago = async () => {
    try {
      // Usar la función del store que filtra correctamente
      const pendientes = await fetchPedidosPendientes();
      
      // Notificar si hay nuevos pedidos
      if (pendientes.length > pedidosPendientesPago.length) {
        const diff = pendientes.length - pedidosPendientesPago.length;
        toast.success(
          `🔔 ${diff} nuevo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''} del menú esperando pago`,
          { duration: 5000 }
        );
      }
      
      setPedidosPendientesPago(pendientes);
    } catch (error) {
      console.error('Error al cargar pedidos pendientes:', error);
    }
  };

  const fetchResumenCaja = async () => {
    try {
      const response = await cajaService.getResumenCaja();
      setResumenCaja(response.data.resumen);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  const handleProcesarPedido = async () => {
    // Validaciones
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (tipoPedido === 'local' && !mesa) {
      toast.error('Por favor indica el número de mesa');
      return;
    }

    if (metodoPago === 'efectivo' && !montoRecibido) {
      toast.error('Por favor indica el monto recibido');
      return;
    }

    if (metodoPago === 'efectivo' && parseFloat(montoRecibido) < getTotal()) {
      toast.error('El monto recibido es insuficiente');
      return;
    }

    setLoading(true);
    try {
      const pedidoData = {
        ...getPedidoData(),
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : undefined
      };

      console.log('Enviando pedido:', pedidoData);
      const response = await cajaService.crearPedidoConPago(pedidoData);
      
      toast.success('Pedido procesado exitosamente');
      setTicketModal(response.data);
      clearCart();
      setMontoRecibido('');
      fetchPedidosRecientes();
      fetchResumenCaja();
    } catch (error) {
      console.error('Error al procesar pedido:', error);
      const errorMessage = error.response?.data?.message || 'Error al procesar el pedido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProcesarPedidoPendiente = async (pedido) => {
    // Mostrar modal para seleccionar método de pago
    const metodosPago = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
    const metodoPagoSeleccionado = await new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-bold mb-4">Seleccionar Método de Pago</h3>
          <p class="text-sm text-gray-600 mb-4">Pedido #${pedido.numero_pedido} - Total: S/. ${pedido.total}</p>
          <div class="grid grid-cols-2 gap-2">
            ${metodosPago.map(m => `
              <button data-metodo="${m}" class="metodo-btn p-3 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50">
                <span class="text-2xl">${getMetodoPagoIcon(m)}</span>
                <p class="text-sm capitalize">${m}</p>
              </button>
            `).join('')}
          </div>
          <button data-metodo="cancelar" class="mt-4 w-full btn-outline">Cancelar</button>
        </div>
      `;
      document.body.appendChild(modal);
      
      modal.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-metodo]');
        if (btn) {
          const metodo = btn.dataset.metodo;
          document.body.removeChild(modal);
          resolve(metodo === 'cancelar' ? null : metodo);
        }
      });
    });

    if (!metodoPagoSeleccionado) return;

    try {
      setLoading(true);
      
      // Primero, actualizar las observaciones del pedido para quitar el marcador
      const observacionesLimpias = pedido.observaciones
        ?.replace('[PENDIENTE_PAGO]', '')
        ?.trim() || '';
      
      // Intentar procesar el pago
      try {
        const responsePago = await cajaService.registrarPago({
          pedido_id: pedido.id,
          metodo_pago: metodoPagoSeleccionado,
          monto_total: pedido.total,
          monto_recibido: pedido.total
        });
        
        // Si el pago fue exitoso, solo actualizar las observaciones (quitar el marcador)
        // NO cambiar el estado porque ya está en "pendiente"
        await pedidoService.updateObservaciones(pedido.id, observacionesLimpias);
        
        toast.success('✅ Pago procesado y pedido enviado a cocina');
        
        // Mostrar ticket si es necesario
        if (responsePago.data?.ticket) {
          setTicketModal({
            pago: responsePago.data.pago,
            ticket: responsePago.data.ticket
          });
        }
      } catch (paymentError) {
        // Si el error es porque ya está pagado
        if (paymentError.response?.data?.message?.includes('ya ha sido pagado')) {
          // Solo actualizar las observaciones sin cambiar el estado
          try {
            // Solo quitar el marcador de las observaciones
            await pedidoService.updateObservaciones(pedido.id, observacionesLimpias);
            toast.info('Pedido ya procesado, actualizando información');
          } catch (updateError) {
            console.error('Error al actualizar observaciones:', updateError);
            // Si también falla la actualización de observaciones, solo informar
            toast.warning('El pedido ya fue pagado anteriormente');
          }
        } else {
          // Si es otro tipo de error, mostrarlo pero no lanzar excepción
          console.error('Error al procesar pago:', paymentError);
          const errorMsg = paymentError.response?.data?.message || 'Error al procesar el pago';
          toast.error(errorMsg);
        }
      }
      
      // Actualizar listas
      fetchPedidosPendientesPago();
      fetchPedidosRecientes();
      fetchResumenCaja();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarPedidoPendiente = async (pedidoId) => {
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return;
    
    try {
      await pedidoService.updateEstado(pedidoId, 'cancelado', 'Cancelado desde caja');
      toast.success('Pedido cancelado');
      fetchPedidosPendientesPago();
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error('Error al cancelar el pedido');
    }
  };

  const handlePrintTicket = () => {
    if (ticketModal?.ticket) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${ticketModal.pago.numero_ticket}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${ticketModal.ticket}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    }
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

  const getMetodoPagoIcon = (metodo) => {
    const icons = {
      'efectivo': '💵',
      'tarjeta': '💳',
      'yape': '📱',
      'plin': '📲',
      'transferencia': '🏦'
    };
    return icons[metodo] || '💰';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Caja</h1>
        <p className="text-gray-600 mt-1">Gestión de pedidos y pagos</p>
      </div>

      {/* Resumen del día */}
      {resumenCaja && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Ventas del Día</p>
                <p className="text-2xl font-bold text-blue-900">{resumenCaja.total_ventas}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Recaudado</p>
                <p className="text-2xl font-bold text-green-900">
                  S/. {parseFloat(resumenCaja.monto_total).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Ticket Promedio</p>
                <p className="text-2xl font-bold text-purple-900">
                  S/. {resumenCaja.total_ventas > 0 
                    ? (resumenCaja.monto_total / resumenCaja.total_ventas).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="card">
            <button
              onClick={() => {
                fetchPedidosRecientes();
                fetchResumenCaja();
                toast.success('Datos actualizados');
              }}
              className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      )}

      {/* Indicador de auto-actualización */}
      <div className="flex justify-end mb-4">
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
          <span className="text-sm">Actualización {autoRefresh ? 'automática' : 'manual'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'pendientes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>Pedidos del Menú</span>
            {pedidosPendientesPago.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pedidosPendientesPago.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'nuevo'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nuevo Pedido Manual
          </button>
          <button
            onClick={() => setActiveTab('recientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recientes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pedidos Recientes
          </button>
        </nav>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'pendientes' ? (
        <div className="space-y-4">
          {pedidosPendientesPago.length === 0 ? (
            <div className="card text-center py-12">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay pedidos pendientes del menú
              </h3>
              <p className="text-gray-500">
                Los pedidos que los clientes envíen desde el menú aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Pedidos Pendientes de Pago ({pedidosPendientesPago.length})
                </h2>
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Procesar pago para enviar a cocina</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pedidosPendientesPago.map(pedido => (
                  <div key={pedido.id} className="card border-2 border-amber-300 bg-amber-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm text-gray-500">Pedido #{pedido.numero_pedido}</p>
                        <p className="font-bold text-lg">{pedido.cliente_nombre || 'Sin nombre'}</p>
                        {pedido.mesa && (
                          <p className="text-sm text-gray-600">Mesa: {pedido.mesa}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {pedido.tipo_pedido === 'local' ? '🍽️ Para Mesa' : 
                           pedido.tipo_pedido === 'llevar' ? '🥡 Para Llevar' : 
                           '🛵 Delivery'}
                        </p>
                        {pedido.observaciones && !pedido.observaciones.includes('[PENDIENTE_PAGO]') && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {pedido.observaciones.replace('[PENDIENTE_PAGO]', '').trim()}
                          </p>
                        )}
                      </div>
                      <span className="text-2xl font-bold text-amber-600">
                        S/. {parseFloat(pedido.total).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Items del pedido */}
                    <div className="border-t pt-3 mb-3">
                      <p className="text-sm font-medium mb-2">Items:</p>
                      <div className="space-y-1 text-sm">
                        {pedido.detalles?.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.cantidad}x {item.menu_nombre}</span>
                            <span>S/. {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleProcesarPedidoPendiente(pedido)}
                        className="flex-1 btn-primary text-sm flex items-center justify-center space-x-1"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Procesar Pago</span>
                      </button>
                      <button
                        onClick={() => handleCancelarPedidoPendiente(pedido.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeTab === 'nuevo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de pedido */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Datos del Pedido</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pedido
                </label>
                <select
                  value={tipoPedido}
                  onChange={(e) => updateOrderData({ tipoPedido: e.target.value })}
                  className="input-field"
                >
                  <option value="local">Para Mesa (Local)</option>
                  <option value="llevar">Para Llevar</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {tipoPedido === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Mesa *
                  </label>
                  <input
                    type="text"
                    value={mesa}
                    onChange={(e) => updateOrderData({ mesa: e.target.value })}
                    className="input-field"
                    placeholder="Ej: 5"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => updateOrderData({ clienteNombre: e.target.value })}
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => updateOrderData({ observaciones: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['efectivo', 'tarjeta', 'yape', 'plin'].map(metodo => (
                    <button
                      key={metodo}
                      onClick={() => setMetodoPago(metodo)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        metodoPago === metodo
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{getMetodoPagoIcon(metodo)}</span>
                      <p className="text-sm capitalize mt-1">{metodo}</p>
                    </button>
                  ))}
                </div>
              </div>

              {metodoPago === 'efectivo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Recibido *
                  </label>
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="input-field"
                    placeholder="0.00"
                    step="0.01"
                    min={getTotal()}
                  />
                  {montoRecibido && parseFloat(montoRecibido) >= getTotal() && (
                    <p className="text-sm text-green-600 mt-1">
                      Vuelto: S/. {(parseFloat(montoRecibido) - getTotal()).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resumen del pedido */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay productos en el carrito</p>
                <p className="text-sm text-gray-400 mt-2">
                  Ve al menú para agregar productos
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.menu_id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          <p className="text-sm text-gray-600">
                            {item.cantidad} x S/. {parseFloat(item.precio).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          S/. {(item.precio * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-primary-600">
                      S/. {getTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleProcesarPedido}
                    disabled={loading || cartItems.length === 0}
                    className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Procesar Pedido y Pago</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Tab de pedidos recientes */
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Pedidos Pendientes</h2>
          
          {pedidosRecientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay pedidos pendientes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente/Mesa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidosRecientes.map(pedido => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pedido.numero_pedido}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pedido.tipo_pedido}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pedido.cliente_nombre || 'Sin nombre'}
                        </div>
                        {pedido.mesa && (
                          <div className="text-sm text-gray-500">
                            Mesa {pedido.mesa}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          S/. {parseFloat(pedido.total).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(pedido.createdAt), 'HH:mm', { locale: es })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Ticket */}
      {ticketModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">Ticket Generado</h3>
                  <button
                    onClick={() => setTicketModal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-4 mb-4 font-mono text-sm whitespace-pre-wrap">
                  {ticketModal.ticket}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handlePrintTicket}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() => setTicketModal(null)}
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

export default Caja;
