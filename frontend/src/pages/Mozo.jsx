import React, { useState, useEffect, useRef } from 'react';
import { 
  Utensils, 
  Clock, 
  DollarSign, 
  Users, 
  Bell,
  CheckCircle,
  XCircle,
  Coffee,
  ClipboardList,
  Printer,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pedidoService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import gsap from 'gsap';

const Mozo = () => {
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [nuevaMesa, setNuevaMesa] = useState({ numero: '', capacidad: 4 });

  // Referencias para animaciones
  const mesasGridRef = useRef(null);
  const pedidosListRef = useRef(null);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pedidosResponse, mesasResponse] = await Promise.all([
        pedidoService.getPedidos({ estado: ['pendiente', 'en_proceso'] }),
        pedidoService.getMesas()
      ]);
      
      setPedidos(pedidosResponse.data);
      setMesas(mesasResponse.data);

      // Animar entrada de elementos
      if (mesasGridRef.current) {
        gsap.fromTo(
          mesasGridRef.current.children,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleMesaClick = (mesa) => {
    setSelectedMesa(selectedMesa?.id === mesa.id ? null : mesa);
  };

  const handleEstadoChange = async (pedidoId, nuevoEstado) => {
    try {
      await pedidoService.updateEstado(pedidoId, nuevoEstado);
      toast.success('Estado actualizado correctamente');
      cargarDatos();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handlePrintTicket = (pedido) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket #${pedido.numero}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .ticket { width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { margin: 5px 0; }
            .total { margin-top: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h2>POLLERÍA</h2>
              <p>Mesa: ${pedido.mesa}</p>
              <p>Pedido #${pedido.numero}</p>
              <p>${format(new Date(pedido.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
            <div class="items">
              ${pedido.items.map(item => `
                <div class="item">
                  ${item.cantidad}x ${item.nombre}
                  <span style="float:right">S/. ${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <p><strong>Total: S/. ${pedido.total.toFixed(2)}</strong></p>
            </div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
  };

  const getPedidosDeMesa = (mesaId) => {
    return pedidos.filter(pedido => pedido.mesa_id === mesaId);
  };

  const getMesaStatus = (mesa) => {
    const pedidosMesa = getPedidosDeMesa(mesa.id);
    if (pedidosMesa.length === 0) return 'libre';
    if (pedidosMesa.some(p => p.estado === 'pendiente')) return 'pendiente';
    return 'ocupada';
  };

  const getMesaStatusColor = (status) => {
    const colors = {
      'libre': 'bg-green-100 text-green-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'ocupada': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleAddMesa = async () => {
    try {
      if (!nuevaMesa.numero) {
        toast.error('Por favor ingresa un número de mesa');
        return;
      }
      await pedidoService.createMesa(nuevaMesa);
      toast.success('Mesa creada exitosamente');
      setNuevaMesa({ numero: '', capacidad: 4 });
      cargarDatos();
    } catch (error) {
      toast.error('Error al crear la mesa');
    }
  };

  const handleDeleteMesa = async (mesaId) => {
    if (window.confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        await pedidoService.deleteMesa(mesaId);
        toast.success('Mesa eliminada exitosamente');
        cargarDatos();
      } catch (error) {
        toast.error('Error al eliminar la mesa');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mesas Activas</p>
              <p className="text-2xl font-bold">{mesas.length}</p>
            </div>
            <Utensils className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pedidos Pendientes</p>
              <p className="text-2xl font-bold">
                {pedidos.filter(p => p.estado === 'pendiente').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas del Día</p>
              <p className="text-2xl font-bold">S/. {
                pedidos
                  .filter(p => p.estado === 'completado')
                  .reduce((total, p) => total + p.total, 0)
                  .toFixed(2)
              }</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={cargarDatos}
            className="w-full h-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Mesas</h2>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
          >
            {editMode ? 'Terminar Edición' : 'Editar Mesas'}
          </button>
        </div>

        {editMode && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa
                </label>
                <input
                  type="text"
                  value={nuevaMesa.numero}
                  onChange={(e) => setNuevaMesa({ ...nuevaMesa, numero: e.target.value })}
                  className="border rounded-lg px-3 py-2"
                  placeholder="Ej: 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="number"
                  value={nuevaMesa.capacidad}
                  onChange={(e) => setNuevaMesa({ ...nuevaMesa, capacidad: parseInt(e.target.value) })}
                  className="border rounded-lg px-3 py-2"
                  min="1"
                />
              </div>
              <button
                onClick={handleAddMesa}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div ref={mesasGridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mesas.map(mesa => {
            const status = getMesaStatus(mesa);
            const statusColor = getMesaStatusColor(status);
            
            return (
              <div
                key={mesa.id}
                onClick={() => !editMode && handleMesaClick(mesa)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                  ${selectedMesa?.id === mesa.id ? 'border-orange-500 shadow-lg' : 'border-gray-200'}
                  ${editMode ? 'cursor-default' : 'hover:border-orange-500 hover:shadow-md'}
                `}
              >
                <div className="text-center">
                  <p className="text-lg font-bold">Mesa {mesa.numero}</p>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs ${statusColor}`}>
                    {status}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <Users className="h-4 w-4 inline mr-1" />
                    {mesa.capacidad}
                  </p>
                </div>

                {editMode && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleDeleteMesa(mesa.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de pedidos de la mesa seleccionada */}
      {selectedMesa && (
        <div ref={pedidosListRef} className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            Pedidos de Mesa {selectedMesa.numero}
          </h3>
          
          <div className="space-y-4">
            {getPedidosDeMesa(selectedMesa.id).map(pedido => (
              <div
                key={pedido.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold">Pedido #{pedido.numero}</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(pedido.createdAt), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePrintTicket(pedido)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <Printer className="h-5 w-5" />
                    </button>
                    {pedido.estado === 'pendiente' && (
                      <button
                        onClick={() => handleEstadoChange(pedido.id, 'completado')}
                        className="p-2 text-green-500 hover:bg-green-100 rounded-lg"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {pedido.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{item.cantidad}x {item.nombre}</span>
                      <span>S/. {(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>S/. {pedido.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mozo;