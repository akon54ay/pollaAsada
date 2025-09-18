import axios from 'axios';
import toast from 'react-hot-toast';

// Detectar si estamos en desarrollo local o en red
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  // Si es localhost o 127.0.0.1, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080/api';
  }
  
  // Si es una IP, usar la misma IP pero con puerto 8080
  return `http://${hostname}:8080/api`;
};

const API_URL = getApiUrl();

console.log('API URL configurada:', API_URL);

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No mostrar toast para ciertos endpoints que manejan sus propios errores
    const skipToastUrls = ['/caja/pago', '/pedidos'];
    const shouldSkipToast = skipToastUrls.some(url => 
      error.config?.url?.includes(url)
    );

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // No redirigir si está en modo cliente
      if (localStorage.getItem('clientMode') !== 'true') {
        window.location.href = '/login';
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
    } else if (error.response?.data?.message && !shouldSkipToast) {
      // Solo mostrar toast si no es un endpoint que maneja sus propios errores
      toast.error(error.response.data.message);
    } else if (!error.response && !shouldSkipToast) {
      toast.error('Error de conexión con el servidor');
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

// Servicios del menú
export const menuService = {
  getItems: async (params = {}) => {
    const response = await api.get('/menu', { params });
    return response.data;
  },
  
  getItem: async (id) => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },
  
  createItem: async (data) => {
    const response = await api.post('/menu', data);
    return response.data;
  },
  
  updateItem: async (id, data) => {
    const response = await api.put(`/menu/${id}`, data);
    return response.data;
  },
  
  deleteItem: async (id) => {
    const response = await api.delete(`/menu/${id}`);
    return response.data;
  },
  
  toggleAvailability: async (id) => {
    const response = await api.patch(`/menu/${id}/toggle-availability`);
    return response.data;
  }
};

// Servicios de pedidos
export const pedidoService = {
  createPedido: async (data) => {
    const response = await api.post('/pedidos', data);
    return response.data;
  },
  
  getPedidos: async (params = {}) => {
    const response = await api.get('/pedidos', { params });
    return response.data;
  },
  
  getPedidoById: async (id) => {
    const response = await api.get(`/pedidos/${id}`);
    return response.data;
  },
  
  updateEstado: async (id, estado, observacion = '') => {
    const response = await api.patch(`/pedidos/${id}/estado`, {
      estado,
      observacion
    });
    return response.data;
  },
  
  updateObservaciones: async (id, observaciones) => {
    const response = await api.patch(`/pedidos/${id}`, {
      observaciones
    });
    return response.data;
  },
  
  cancelarPedido: async (id, motivo) => {
    const response = await api.delete(`/pedidos/${id}`, {
      data: { motivo }
    });
    return response.data;
  }
};

// Servicios de caja
export const cajaService = {
  registrarPago: async (data) => {
    const response = await api.post('/caja/pago', data);
    return response.data;
  },
  
  procesarPago: async (pedidoId, data) => {
    // Usar registrarPago para procesar el pago del pedido
    const response = await api.post('/caja/pago', {
      pedido_id: pedidoId,
      ...data
    });
    return response.data;
  },
  
  crearPedidoConPago: async (data) => {
    const response = await api.post('/caja/pedido-con-pago', data);
    return response.data;
  },
  
  getTicket: async (numeroTicket) => {
    const response = await api.get(`/caja/ticket/${numeroTicket}`);
    return response.data;
  },
  
  getResumenCaja: async (fecha = null) => {
    const params = fecha ? { fecha } : {};
    const response = await api.get('/caja/resumen', { params });
    return response.data;
  }
};

// Servicios de cocina
export const cocinaService = {
  getPedidosPendientes: async () => {
    const response = await api.get('/cocina/pedidos-pendientes');
    return response.data;
  },
  
  iniciarPreparacion: async (id, observacion = '') => {
    const response = await api.patch(`/cocina/pedido/${id}/iniciar`, {
      observacion
    });
    return response.data;
  },
  
  marcarComoListo: async (id, observacion = '') => {
    const response = await api.patch(`/cocina/pedido/${id}/listo`, {
      observacion
    });
    return response.data;
  },
  
  getEstadisticas: async () => {
    const response = await api.get('/cocina/estadisticas');
    return response.data;
  },
  
  getProductosMasPedidos: async () => {
    const response = await api.get('/cocina/productos-mas-pedidos');
    return response.data;
  }
};

// Servicios de mozo
export const mozoService = {
  getPedidosListos: async (tipoPedido = null) => {
    const params = tipoPedido ? { tipo_pedido: tipoPedido } : {};
    const response = await api.get('/mozo/pedidos-listos', { params });
    return response.data;
  },
  
  marcarComoEntregado: async (id, observacion = '') => {
    const response = await api.patch(`/mozo/pedido/${id}/entregado`, {
      observacion
    });
    return response.data;
  },
  
  getPedidosPorMesa: async (mesa) => {
    const response = await api.get(`/mozo/mesa/${mesa}/pedidos`);
    return response.data;
  },
  
  getMesasActivas: async () => {
    const response = await api.get('/mozo/mesas-activas');
    return response.data;
  },
  
  getEstadisticas: async () => {
    const response = await api.get('/mozo/estadisticas');
    return response.data;
  }
};

export default api;
