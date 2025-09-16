import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      mesa: '',
      clienteNombre: '',
      tipoPedido: 'local',
      observaciones: '',
      
      // Agregar item al carrito
      addItem: (menuItem) => {
        set((state) => {
          const existingItem = state.items.find(item => item.menu_id === menuItem.id);
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.menu_id === menuItem.id
                  ? { ...item, cantidad: item.cantidad + 1 }
                  : item
              )
            };
          }
          
          return {
            items: [...state.items, {
              menu_id: menuItem.id,
              nombre: menuItem.nombre,
              precio: menuItem.precio,
              cantidad: 1,
              observaciones: ''
            }]
          };
        });
      },
      
      // Actualizar cantidad de un item
      updateQuantity: (menuId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(menuId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.menu_id === menuId
              ? { ...item, cantidad }
              : item
          )
        }));
      },
      
      // Actualizar observaciones de un item
      updateObservaciones: (menuId, observaciones) => {
        set((state) => ({
          items: state.items.map(item =>
            item.menu_id === menuId
              ? { ...item, observaciones }
              : item
          )
        }));
      },
      
      // Remover item del carrito
      removeItem: (menuId) => {
        set((state) => ({
          items: state.items.filter(item => item.menu_id !== menuId)
        }));
      },
      
      // Limpiar carrito
      clearCart: () => {
        set({
          items: [],
          mesa: '',
          clienteNombre: '',
          tipoPedido: 'local',
          observaciones: ''
        });
      },
      
      // Actualizar datos del pedido
      updateOrderData: (data) => {
        set((state) => ({
          ...state,
          ...data
        }));
      },
      
      // Obtener total del carrito
      getTotal: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          return total + (item.precio * item.cantidad);
        }, 0);
      },
      
      // Obtener cantidad total de items
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => {
          return total + item.cantidad;
        }, 0);
      },
      
      // Preparar datos para enviar al backend
      getPedidoData: () => {
        const state = get();
        return {
          mesa: state.mesa,
          cliente_nombre: state.clienteNombre,
          tipo_pedido: state.tipoPedido,
          observaciones: state.observaciones,
          detalles: state.items.map(item => ({
            menu_id: item.menu_id,
            cantidad: item.cantidad,
            observaciones: item.observaciones
          }))
        };
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        items: state.items,
        mesa: state.mesa,
        clienteNombre: state.clienteNombre,
        tipoPedido: state.tipoPedido
      })
    }
  )
);

export default useCartStore;
