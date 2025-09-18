import { create } from 'zustand';
import { pedidoService } from '../services/api';
import toast from 'react-hot-toast';

const usePedidosStore = create((set, get) => ({
  pedidos: [],
  pedidosPendientes: [], // Pedidos esperando ser procesados en caja
  loading: false,
  error: null,
  lastUpdate: null,

  // Obtener todos los pedidos
  fetchPedidos: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await pedidoService.getPedidos(params);
      set({ 
        pedidos: response.data.pedidos || [],
        lastUpdate: new Date(),
        loading: false 
      });
      return response.data.pedidos;
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error al obtener pedidos:', error);
      return [];
    }
  },

  // Obtener pedidos pendientes para caja
  fetchPedidosPendientes: async () => {
    try {
      const response = await pedidoService.getPedidos({ 
        estado: 'pendiente' // Pedidos pendientes normales
      });
      
      // Filtrar solo los pedidos que vienen del menú (sin pago procesado)
      const todosPedidos = response.data.pedidos || response.data || [];
      const pendientes = todosPedidos.filter(p => 
        p.observaciones && p.observaciones.includes('[PENDIENTE_PAGO]')
      );
      
      // Notificar si hay nuevos pedidos
      const currentPendientes = get().pedidosPendientes;
      if (pendientes.length > currentPendientes.length) {
        const diff = pendientes.length - currentPendientes.length;
        toast.success(`${diff} nuevo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''} pendiente${diff > 1 ? 's' : ''}`);
        
        // Reproducir sonido de notificación
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }
      
      set({ 
        pedidosPendientes: pendientes,
        lastUpdate: new Date()
      });
      
      return pendientes;
    } catch (error) {
      console.error('Error al obtener pedidos pendientes:', error);
      return [];
    }
  },

  // Crear pedido desde el menú (cliente)
  createPedidoFromMenu: async (pedidoData) => {
    try {
      // Agregar marcador especial en observaciones para identificar pedidos del menú
      const observacionesConMarcador = `[PENDIENTE_PAGO] ${pedidoData.observaciones || ''}`.trim();
      
      const pedidoConEstado = {
        ...pedidoData,
        estado: 'pendiente', // Estado pendiente normal
        observaciones: observacionesConMarcador
      };
      
      const response = await pedidoService.createPedido(pedidoConEstado);
      
      // Actualizar la lista de pedidos pendientes
      set(state => ({
        pedidosPendientes: [...state.pedidosPendientes, response.data.pedido]
      }));
      
      toast.success('Pedido enviado a caja para procesar el pago');
      return response.data;
    } catch (error) {
      toast.error('Error al crear el pedido');
      throw error;
    }
  },

  // Procesar pedido en caja (quitar marcador de pago pendiente)
  procesarPedidoEnCaja: async (pedidoId, metodoPago) => {
    try {
      // Obtener el pedido actual para limpiar las observaciones
      const pedidoActual = get().pedidosPendientes.find(p => p.id === pedidoId);
      const observacionesLimpias = pedidoActual?.observaciones
        ?.replace('[PENDIENTE_PAGO]', '')
        ?.trim() || '';
      
      // Actualizar el pedido con observaciones limpias
      const response = await pedidoService.updateEstado(pedidoId, 'pendiente', 
        `Pago procesado con ${metodoPago}. ${observacionesLimpias}`);
      
      // Remover de pedidos pendientes
      set(state => ({
        pedidosPendientes: state.pedidosPendientes.filter(p => p.id !== pedidoId),
        pedidos: [...state.pedidos, response.data.pedido]
      }));
      
      toast.success('Pago procesado correctamente');
      return response.data;
    } catch (error) {
      toast.error('Error al procesar el pago');
      throw error;
    }
  },

  // Actualizar estado de un pedido
  updatePedidoEstado: async (id, nuevoEstado, observacion = '') => {
    try {
      const response = await pedidoService.updateEstado(id, nuevoEstado, observacion);
      
      set(state => ({
        pedidos: state.pedidos.map(p => 
          p.id === id ? response.data.pedido : p
        )
      }));
      
      toast.success(`Pedido actualizado a ${nuevoEstado}`);
      return response.data;
    } catch (error) {
      toast.error('Error al actualizar el pedido');
      throw error;
    }
  },

  // Limpiar store
  clearStore: () => {
    set({
      pedidos: [],
      pedidosPendientes: [],
      loading: false,
      error: null,
      lastUpdate: null
    });
  }
}));

export default usePedidosStore;
