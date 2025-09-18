import React, { useState, useEffect } from 'react';
import { cajaService, pedidoService } from '../services/api';
import useCartStore from '../stores/useCartStore';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Caja = () => {
  const [activeTab, setActiveTab] = useState('nuevo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [resumenCaja, setResumenCaja] = useState(null);
  const [ticketModal, setTicketModal] = useState(null);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');

  // Manejador de errores
  const handleError = (error) => {
    console.error('Error en Caja:', error);
    setError(error.message || 'Ha ocurrido un error');
    toast.error(error.message || 'Ha ocurrido un error');
    setLoading(false);
  };
  
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

  useEffect(() => {
    const fetchData = async () => {
      await fetchPedidosRecientes();
      await fetchResumenCaja();
    };

    // Cargar datos iniciales
    fetchData();
    
    // Actualizar cada 5 segundos para mantener los pedidos actualizados
    const interval = setInterval(fetchData, 5000);
    
    // Eventos para actualizar datos
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    
    const handleFocus = () => {
      fetchData();
    };

    // Custom event para actualización manual
    const handlePedidoCreado = () => {
      fetchData();
    };
    
    // Agregar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pedidoCreado', handlePedidoCreado);
    
    // Limpiar
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pedidoCreado', handlePedidoCreado);
    };
  }, []);

  const fetchPedidosRecientes = async () => {
    try {
      console.log('Consultando pedidos pendientes...');
      const response = await pedidoService.getPedidos({ 
        estado: ['pendiente', 'nuevo'],
        limit: 20,
        sort: '-createdAt'
      });
      
      if (response && response.data) {
        console.log('Pedidos recibidos:', response.data);
        const pedidosFormateados = response.data
          .filter(pedido => pedido && pedido.items && pedido.items.length > 0)
          .map(pedido => ({
            ...pedido,
            total: parseFloat(pedido.total || 0),
            createdAt: new Date(pedido.createdAt || new Date()),
            numero_pedido: pedido.numero_pedido || Date.now().toString().slice(-6)
          }))
          .sort((a, b) => b.createdAt - a.createdAt);

        console.log('Pedidos formateados:', pedidosFormateados);
        setPedidosRecientes(pedidosFormateados);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      toast.error('Error al cargar los pedidos recientes');
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
    try {
      // Validaciones iniciales
      if (!cartItems || cartItems.length === 0) {
        toast.error('El carrito está vacío');
        return;
      }

      if (!cartItems.every(item => item && item.menu_id && item.cantidad > 0)) {
        toast.error('Hay productos inválidos en el carrito');
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

      const total = getTotal();
      if (!total || total <= 0) {
        toast.error('El total del pedido es inválido');
        return;
      }

      if (metodoPago === 'efectivo' && parseFloat(montoRecibido) < total) {
        toast.error('El monto recibido es insuficiente');
        return;
      }

      setLoading(true);
      setError(null);

      // Construir el objeto de pedido
      const pedidoData = {
        mesa,
        cliente_nombre: clienteNombre,
        tipo_pedido: tipoPedido,
        observaciones,
        metodo_pago: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : undefined,
        total,
        items: cartItems.map(item => ({
          menu_id: item.menu_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          observaciones: item.observaciones || ''
        }))
      };

      // Enviar el pedido al servidor
      const response = await cajaService.crearPedidoConPago(pedidoData);
      
      // Procesar respuesta exitosa
      if (response && response.data) {
        toast.success('¡Pedido procesado exitosamente!');
        setTicketModal(response.data);
        
        // Limpiar el carrito y resetear el estado
        clearCart();
        setMontoRecibido('');
        setMetodoPago('efectivo');
        
        // Actualizar datos en segundo plano
        await Promise.all([
          fetchPedidosRecientes(),
          fetchResumenCaja()
        ]);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    if (!ticketModal?.ticket) {
      toast.error('No hay ticket para imprimir');
      return;
    }
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Por favor habilita las ventanas emergentes para imprimir el ticket');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${ticketModal.pago.numero_ticket}</title>
            <style>
              body { 
                font-family: monospace; 
                padding: 20px; 
                margin: 0;
                width: 80mm; /* Ancho estándar para tickets POS */
              }
              pre { 
                white-space: pre-wrap;
                margin: 0;
                font-size: 12px;
                line-height: 1.2;
              }
              @media print {
                body { 
                  width: 100%;
                }
                pre {
                  white-space: pre-wrap;
                  word-break: break-word;
                }
              }
            </style>
          </head>
          <body>
            <pre>${ticketModal.ticket}</pre>
            <script>
              try {
                window.print();
                setTimeout(() => window.close(), 500);
              } catch(e) {
                console.error('Error al imprimir:', e);
              }
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error al abrir ventana de impresión:', error);
      toast.error('Error al intentar imprimir el ticket');
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

  const buildPedidoData = () => {
    return {
      mesa: mesa,
      cliente_nombre: clienteNombre,
      tipo_pedido: tipoPedido,
      observaciones: observaciones,
      metodo_pago: metodoPago,
      monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : undefined,
      total: getTotal(),
      items: cartItems.map(item => ({
        menu_id: item.menu_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        observaciones: item.observaciones
      }))
    };
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('nuevo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'nuevo'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nuevo Pedido
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
      {activeTab === 'nuevo' ? (
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
