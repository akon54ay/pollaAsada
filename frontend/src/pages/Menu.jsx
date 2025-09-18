import React, { useState, useEffect } from 'react';
import { menuService } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import usePedidosStore from '../stores/usePedidosStore';
import LoadingSpinner from '../components/LoadingSpinner';
import MesaSelector from '../components/MesaSelector';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Clock, 
  RefreshCw,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [cartOpen, setCartOpen] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { user } = useAuth();
  const { createPedidoFromMenu } = usePedidosStore();
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity,
    getTotal,
    getTotalItems,
    clearCart,
    getPedidoData,
    mesa,
    clienteNombre,
    tipoPedido,
    updateOrderData
  } = useCart();

  const categories = [
    { value: 'todos', label: 'Todos', emoji: '🍽️' },
    { value: 'entrada', label: 'Entradas', emoji: '🥗' },
    { value: 'plato_principal', label: 'Platos Principales', emoji: '🍗' },
    { value: 'bebida', label: 'Bebidas', emoji: '🥤' },
    { value: 'postre', label: 'Postres', emoji: '🍰' },
    { value: 'adicional', label: 'Adicionales', emoji: '🍟' }
  ];

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  // Auto-actualización del menú cada 10 segundos
  useAutoRefresh(() => {
    if (autoRefresh) {
      fetchMenuItems();
    }
  }, 10000, [selectedCategory]);

  const fetchMenuItems = async () => {
    try {
      if (!loading) { // Solo mostrar loading en la carga inicial
        const params = selectedCategory !== 'todos' ? { categoria: selectedCategory } : {};
        const response = await menuService.getItems({ ...params, disponible: true });
        setMenuItems(response.data);
      } else {
        setLoading(true);
        const params = selectedCategory !== 'todos' ? { categoria: selectedCategory } : {};
        const response = await menuService.getItems({ ...params, disponible: true });
        setMenuItems(response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error al cargar menú:', error);
      if (loading) {
        toast.error('Error al cargar el menú');
        setLoading(false);
      }
    }
  };

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!mesa && tipoPedido === 'local') {
      toast.error('Por favor indica el número de mesa');
      return;
    }

    // Solo validar nombre si no es cliente
    const isClientMode = localStorage.getItem('clientMode') === 'true';
    if (!isClientMode && !clienteNombre) {
      toast.error('Por favor indica el nombre del cliente');
      return;
    }

    try {
      setSendingOrder(true);
      const pedidoData = getPedidoData();
      
      // Enviar el pedido a caja (todos los usuarios)
      await createPedidoFromMenu(pedidoData);
      
      // Mensaje según el rol del usuario
      if (!user || user.role === 'cliente' || user.role === 'mozo') {
        toast.success('✅ Pedido enviado a caja para procesar el pago');
      } else if (user.role === 'caja' || user.role === 'admin') {
        toast.success('✅ Pedido creado - Ve a la sección de Caja para procesarlo');
      }
      
      clearCart();
      setCartOpen(false);
    } catch (error) {
      console.error('Error al enviar pedido:', error);
      toast.error('Error al enviar el pedido');
    } finally {
      setSendingOrder(false);
    }
  };

  const handleAddToCart = (item) => {
    addItem(item);
    toast.success(`${item.nombre} agregado al carrito`, {
      duration: 1500, // 1.5 segundos
      position: 'bottom-center' // Cambiar posición para no tapar el botón
    });
  };

  const getItemQuantity = (itemId) => {
    const item = cartItems.find(i => i.menu_id === itemId);
    return item ? item.cantidad : 0;
  };

  const getDefaultImage = (categoria) => {
    const images = {
      'entrada': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      'plato_principal': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
      'bebida': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
      'postre': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
      'adicional': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400'
    };
    return images[categoria] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menú</h1>
          <p className="text-gray-600 mt-1">Selecciona los productos para tu pedido</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Toggle auto-refresh */}
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
            <span className="text-sm">{autoRefresh ? 'Auto' : 'Manual'}</span>
          </button>
          
          {/* Botón del carrito */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative btn-primary flex items-center space-x-2"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Ver Carrito</span>
            {getTotalItems() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <span className="mr-2">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? (
        <LoadingSpinner size="lg" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map(item => {
            const quantity = getItemQuantity(item.id);
            
            return (
              <div 
                key={item.id} 
                className={`card hover:shadow-lg transition-shadow ${quantity === 0 ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  // Solo agregar si no hay cantidad y se hace click fuera de los botones
                  if (quantity === 0 && !event.target.closest('button')) {
                    handleAddToCart(item);
                  }
                }}
              >
                <img
                  src={item.imagen_url || getDefaultImage(item.categoria)}
                  alt={item.nombre}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = getDefaultImage(item.categoria);
                  }}
                />
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.nombre}
                </h3>
                
                {item.descripcion && (
                  <p className="text-sm text-gray-600 mb-3">
                    {item.descripcion}
                  </p>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary-600">
                    S/. {parseFloat(item.precio).toFixed(2)}
                  </span>
                  {item.tiempo_preparacion && (
                    <span className="text-xs text-gray-500">
                      ⏱️ {item.tiempo_preparacion} min
                    </span>
                  )}
                </div>
                
                {quantity === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-full btn-primary flex items-center justify-center space-x-2 hover:scale-105 transition-transform"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, quantity - 1);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold">{quantity}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, quantity + 1);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Carrito lateral */}
      {cartOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setCartOpen(false)}
          />
          
          {/* Panel del carrito */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Carrito de Compras</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tu carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.map(item => (
                      <div key={item.menu_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              S/. {parseFloat(item.precio).toFixed(2)} c/u
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.menu_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.menu_id, item.cantidad - 1)}
                              className="p-1 bg-white hover:bg-gray-200 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-semibold px-3">{item.cantidad}</span>
                            <button
                              onClick={() => updateQuantity(item.menu_id, item.cantidad + 1)}
                              className="p-1 bg-white hover:bg-gray-200 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-semibold">
                            S/. {(item.precio * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Datos del pedido */}
                  <div className="border-t pt-4 mb-4">
                    <h3 className="font-semibold mb-3">Datos del Pedido</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Pedido
                        </label>
                        <select
                          value={tipoPedido}
                          onChange={(e) => updateOrderData({ tipoPedido: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="local">Para Mesa</option>
                          <option value="llevar">Para Llevar</option>
                          <option value="delivery">Delivery</option>
                        </select>
                      </div>
                      
                      {tipoPedido === 'local' && (
                        <div>
                          {/* Mostrar selector de mesa solo para clientes */}
                          {localStorage.getItem('clientMode') === 'true' ? (
                            <MesaSelector
                              selectedMesa={mesa}
                              onSelectMesa={(mesaNum) => updateOrderData({ mesa: mesaNum })}
                              isClientMode={true}
                            />
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número de Mesa
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Mesa 5"
                                value={mesa}
                                onChange={(e) => updateOrderData({ mesa: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Solo mostrar campo de nombre si NO es cliente */}
                      {localStorage.getItem('clientMode') !== 'true' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Cliente
                          </label>
                          <input
                            type="text"
                            placeholder="Ingrese el nombre"
                            value={clienteNombre}
                            onChange={(e) => updateOrderData({ clienteNombre: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xl font-bold">Total:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        S/. {getTotal().toFixed(2)}
                      </span>
                    </div>
                    
                    <button
                      onClick={clearCart}
                      className="w-full btn-outline mb-2"
                    >
                      Limpiar Carrito
                    </button>
                    
                    <button
                      onClick={handleSendToKitchen}
                      disabled={sendingOrder}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      {sendingOrder ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Enviar a Caja</span>
                        </>
                      )}
                    </button>
                    
                    {user && (user.role === 'caja' || user.role === 'admin') && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Como cajero, el pedido se procesará directamente
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Menu;
