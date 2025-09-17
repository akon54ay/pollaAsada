import React, { useState, useEffect, useRef } from 'react';
import { menuService } from '../services/api';
import useCartStore from '../stores/useCartStore';
import { ShoppingCart, Plus, Minus, X, Star, Clock, TrendingUp, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from '../hooks/useLenis';

gsap.registerPlugin(ScrollTrigger);

const MenuAnimated = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  
  const { 
    items: cartItems, 
    addItem, 
    removeItem, 
    updateQuantity,
    getTotal,
    getTotalItems,
    clearCart 
  } = useCartStore();

  const { scrollTo } = useLenis();
  
  // Referencias para animaciones
  const headerRef = useRef(null);
  const categoriesRef = useRef(null);
  const gridRef = useRef(null);
  const cartRef = useRef(null);
  const productRefs = useRef([]);
  const categoryButtonRefs = useRef([]);

  const categories = [
    { value: 'todos', label: 'Todos', emoji: '🍽️', color: 'from-gray-500 to-gray-600' },
    { value: 'entrada', label: 'Entradas', emoji: '🥗', color: 'from-green-500 to-green-600' },
    { value: 'plato_principal', label: 'Platos Principales', emoji: '🍗', color: 'from-orange-500 to-red-600' },
    { value: 'bebida', label: 'Bebidas', emoji: '🥤', color: 'from-blue-500 to-cyan-600' },
    { value: 'postre', label: 'Postres', emoji: '🍰', color: 'from-pink-500 to-purple-600' },
    { value: 'adicional', label: 'Adicionales', emoji: '🍟', color: 'from-yellow-500 to-orange-600' }
  ];

  useEffect(() => {
    // Animación de entrada del header
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Animación de las categorías
    if (categoriesRef.current) {
      gsap.fromTo(categoriesRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, delay: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  useEffect(() => {
    // Animación de los productos cuando se cargan
    if (!loading && productRefs.current.length > 0) {
      productRefs.current = productRefs.current.slice(0, menuItems.length);
      
      gsap.fromTo(productRefs.current,
        { 
          scale: 0.8,
          opacity: 0,
          y: 50,
          rotationX: -15
        },
        { 
          scale: 1,
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'back.out(1.2)',
          clearProps: 'all'
        }
      );

      // Configurar animaciones con scroll trigger
      productRefs.current.forEach((product, index) => {
        if (product) {
          gsap.fromTo(product,
            { 
              opacity: 0.8,
              scale: 0.95
            },
            {
              opacity: 1,
              scale: 1,
              duration: 0.5,
              scrollTrigger: {
                trigger: product,
                start: 'top bottom-=100',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }
      });
    }
  }, [loading, menuItems]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'todos' ? { categoria: selectedCategory } : {};
      const response = await menuService.getItems({ ...params, disponible: true });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error al cargar menú:', error);
      toast.error('Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item, buttonRef) => {
    addItem(item);
    
    // Animación del botón
    if (buttonRef) {
      gsap.to(buttonRef, {
        scale: 0.8,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
    
    // Animación del carrito
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
      gsap.to(cartButton, {
        scale: 1.2,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'elastic.out(1, 0.3)'
      });
    }
    
    toast.success(
      <div className="flex items-center space-x-2">
        <span>✅</span>
        <span>{item.nombre} agregado al carrito</span>
      </div>
    );
  };

  const handleCategoryChange = (category, index) => {
    setSelectedCategory(category);
    
    // Animar el botón de categoría
    if (categoryButtonRefs.current[index]) {
      gsap.to(categoryButtonRefs.current[index], {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }
    
    // Scroll suave al inicio de los productos
    scrollTo('#products-grid', { offset: -100 });
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    
    // Animación del corazón
    const heartIcon = document.querySelector(`#heart-${itemId}`);
    if (heartIcon) {
      gsap.to(heartIcon, {
        scale: [1, 1.5, 1],
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    }
  };

  const handleCartToggle = () => {
    setCartOpen(!cartOpen);
    
    if (!cartOpen && cartRef.current) {
      gsap.fromTo(cartRef.current,
        { x: '100%', opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    }
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
      {/* Header animado */}
      <div ref={headerRef} className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
            Menú Especial
          </h1>
          <p className="text-gray-600 mt-1">Descubre nuestros deliciosos platillos</p>
        </div>
        
        {/* Botón del carrito con animación */}
        <button
          onClick={handleCartToggle}
          className="cart-button relative bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Ver Carrito</span>
          {getTotalItems() > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center animate-bounce shadow-lg">
              {getTotalItems()}
            </span>
          )}
        </button>
      </div>

      {/* Filtros de categoría con animación */}
      <div ref={categoriesRef} className="mb-8 flex flex-wrap gap-3">
        {categories.map((cat, index) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              ref={el => categoryButtonRefs.current[index] = el}
              onClick={() => handleCategoryChange(cat.value, index)}
              className={`
                px-5 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 
                ${isActive 
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105` 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                }
              `}
              onMouseEnter={(e) => {
                if (!isActive) {
                  gsap.to(e.currentTarget, { y: -5, duration: 0.2 });
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  gsap.to(e.currentTarget, { y: 0, duration: 0.2 });
                }
              }}
            >
              <span className="mr-2 text-lg">{cat.emoji}</span>
              <span>{cat.label}</span>
              {isActive && (
                <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid de productos con animación */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando deliciosos platillos...</p>
          </div>
        </div>
      ) : (
        <div id="products-grid" ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item, index) => {
            const quantity = getItemQuantity(item.id);
            const isFavorite = favorites.includes(item.id);
            
            return (
              <div 
                key={item.id}
                ref={el => productRefs.current[index] = el}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
                onMouseEnter={(e) => {
                  gsap.to(e.currentTarget.querySelector('.product-image'), {
                    scale: 1.1,
                    duration: 0.3
                  });
                }}
                onMouseLeave={(e) => {
                  gsap.to(e.currentTarget.querySelector('.product-image'), {
                    scale: 1,
                    duration: 0.3
                  });
                }}
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={item.imagen_url || getDefaultImage(item.categoria)}
                    alt={item.nombre}
                    className="product-image w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = getDefaultImage(item.categoria);
                    }}
                  />
                  
                  {/* Badge de popularidad */}
                  {index < 3 && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Popular</span>
                    </div>
                  )}
                  
                  {/* Botón de favorito */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="absolute top-3 right-3 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white transition-all duration-300 hover:scale-110"
                  >
                    <Heart
                      id={`heart-${item.id}`}
                      className={`h-5 w-5 transition-colors ${
                        isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  
                  {/* Overlay con gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {item.nombre}
                  </h3>
                  
                  {item.descripcion && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}
                  
                  {/* Rating simulado */}
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">(4.5)</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                      S/. {parseFloat(item.precio).toFixed(2)}
                    </span>
                    {item.tiempo_preparacion && (
                      <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.tiempo_preparacion} min
                      </span>
                    )}
                  </div>
                  
                  {quantity === 0 ? (
                    <button
                      onClick={(e) => handleAddToCart(item, e.currentTarget)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Agregar al Carrito</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-2">
                      <button
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
                      >
                        <Minus className="h-4 w-4 text-red-600" />
                      </button>
                      <span className="font-bold text-xl text-gray-800 min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-all hover:scale-110"
                      >
                        <Plus className="h-4 w-4 text-green-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Carrito lateral mejorado */}
      {cartOpen && (
        <>
          {/* Overlay con blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
            onClick={handleCartToggle}
          />
          
          {/* Panel del carrito animado */}
          <div 
            ref={cartRef}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              {/* Header del carrito */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Carrito de Compras</h2>
                    <p className="text-orange-100 text-sm mt-1">
                      {getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                  <button
                    onClick={handleCartToggle}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Contenido del carrito */}
              <div className="flex-1 overflow-y-auto p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
                    <p className="text-gray-400 text-sm mt-2">¡Agrega productos deliciosos!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
                      <div
                        key={item.menu_id}
                        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{item.nombre}</h4>
                            <p className="text-sm text-gray-600">
                              S/. {parseFloat(item.precio).toFixed(2)} c/u
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.menu_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded-lg transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.menu_id, item.cantidad - 1)}
                              className="p-1 bg-white hover:bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all"
                            >
                              <Minus className="h-4 w-4 text-red-600" />
                            </button>
                            <span className="font-bold text-lg px-3 min-w-[3rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.menu_id, item.cantidad + 1)}
                              className="p-1 bg-white hover:bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all"
                            >
                              <Plus className="h-4 w-4 text-green-600" />
                            </button>
                          </div>
                          <span className="font-bold text-lg text-gray-900">
                            S/. {(item.precio * item.cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer del carrito */}
              {cartItems.length > 0 && (
                <div className="border-t bg-white p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-700">Total:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                      S/. {getTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <button
                    onClick={clearCart}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all mb-3"
                  >
                    Limpiar Carrito
                  </button>
                  
                  <button
                    onClick={() => {
                      handleCartToggle();
                      toast.info('Ve a la sección de Caja para procesar el pedido');
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Procesar Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MenuAnimated;
