import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    // Intentar cargar el carrito desde localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error('Error al cargar el carrito guardado:', error);
      }
    }
    return {
      items: [],
      total: 0,
      mesa: '',
      clienteNombre: '',
      tipoPedido: 'local',
      observaciones: ''
    };
  });

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Agregar item al carrito
  const addItem = (item) => {
    const existingItem = state.items.find(i => i.menu_id === item.id);
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.cantidad + 1);
    } else {
      const newItem = {
        menu_id: item.id,
        nombre: item.nombre,
        precio: parseFloat(item.precio),
        cantidad: 1
      };
      
      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
        total: prev.total + parseFloat(item.precio)
      }));
    }
  };

  // Actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setState(prev => {
      const items = prev.items.map(item => {
        if (item.menu_id === itemId) {
          const diff = newQuantity - item.cantidad;
          return { ...item, cantidad: newQuantity };
        }
        return item;
      });

      const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

      return {
        ...prev,
        items,
        total
      };
    });
  };

  // Remover item del carrito
  const removeItem = (itemId) => {
    setState(prev => {
      const itemToRemove = prev.items.find(i => i.menu_id === itemId);
      if (!itemToRemove) return prev;

      const items = prev.items.filter(i => i.menu_id !== itemId);
      const total = prev.total - (itemToRemove.precio * itemToRemove.cantidad);

      return {
        ...prev,
        items,
        total: Math.max(0, total)
      };
    });
  };

  // Limpiar carrito
  const clearCart = () => {
    setState({
      items: [],
      total: 0,
      mesa: '',
      clienteNombre: '',
      tipoPedido: 'local',
      observaciones: ''
    });
    toast.success('Carrito limpiado');
  };

  // Obtener total
  const getTotal = () => {
    return state.total;
  };

  // Obtener cantidad total de items
  const getTotalItems = () => {
    return state.items.reduce((sum, item) => sum + item.cantidad, 0);
  };

  // Actualizar datos del pedido
  const updateOrderData = (data) => {
    setState(prev => ({
      ...prev,
      ...data
    }));
  };

  // Obtener datos completos del pedido
  const getPedidoData = () => {
    return {
      detalles: state.items.map(item => ({
        menu_id: item.menu_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      })),
      mesa: state.mesa,
      cliente_nombre: state.clienteNombre || 'Cliente',
      tipo_pedido: state.tipoPedido,
      observaciones: state.observaciones,
      total: state.total
    };
  };

  const value = {
    items: state.items,
    total: state.total,
    mesa: state.mesa,
    clienteNombre: state.clienteNombre,
    tipoPedido: state.tipoPedido,
    observaciones: state.observaciones,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getTotalItems,
    updateOrderData,
    getPedidoData
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de CartProvider');
  }
  return context;
};
