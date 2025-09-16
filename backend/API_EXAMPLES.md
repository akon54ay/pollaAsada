# Ejemplos de Uso de la API - Pollería Backend

## 🔐 Autenticación

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "caja",
    "password": "caja123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 2,
      "username": "caja",
      "email": "caja@polleria.com",
      "role": "caja"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Registro de nuevo usuario
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nuevo_mozo",
    "email": "mozo2@polleria.com",
    "password": "password123",
    "role": "mozo"
  }'
```

## 📋 Menú

### Listar todos los items del menú
```bash
curl -X GET http://localhost:8080/api/menu
```

### Filtrar por categoría
```bash
curl -X GET "http://localhost:8080/api/menu?categoria=plato_principal&disponible=true"
```

### Crear nuevo item (requiere rol admin)
```bash
curl -X POST http://localhost:8080/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "nombre": "Alitas BBQ",
    "descripcion": "6 alitas de pollo con salsa BBQ",
    "categoria": "entrada",
    "precio": 18.50,
    "disponible": true,
    "tiempo_preparacion": 15
  }'
```

## 🛒 Pedidos

### Crear un nuevo pedido
```bash
curl -X POST http://localhost:8080/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mesa": "5",
    "cliente_nombre": "Juan Pérez",
    "tipo_pedido": "local",
    "observaciones": "Sin picante",
    "detalles": [
      {
        "menu_id": 2,
        "cantidad": 1,
        "observaciones": "Bien cocido"
      },
      {
        "menu_id": 4,
        "cantidad": 2
      },
      {
        "menu_id": 6,
        "cantidad": 1
      }
    ]
  }'
```

### Obtener pedidos pendientes
```bash
curl -X GET "http://localhost:8080/api/pedidos?estado=pendiente" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Actualizar estado de pedido
```bash
curl -X PATCH http://localhost:8080/api/pedidos/1/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "estado": "preparando",
    "observacion": "Iniciando preparación"
  }'
```

## 💰 Caja

### Crear pedido con pago (todo en uno)
```bash
curl -X POST http://localhost:8080/api/caja/pedido-con-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "mesa": "3",
    "cliente_nombre": "María García",
    "tipo_pedido": "local",
    "detalles": [
      {
        "menu_id": 1,
        "cantidad": 1
      },
      {
        "menu_id": 6,
        "cantidad": 2
      }
    ],
    "metodo_pago": "efectivo",
    "monto_recibido": 100
  }'
```

### Registrar pago de pedido existente
```bash
curl -X POST http://localhost:8080/api/caja/pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pedido_id": 1,
    "metodo_pago": "yape"
  }'
```

### Obtener resumen de caja del día
```bash
curl -X GET http://localhost:8080/api/caja/resumen \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Obtener ticket
```bash
curl -X GET http://localhost:8080/api/caja/ticket/T241216-00001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 👨‍🍳 Cocina

### Ver pedidos pendientes
```bash
curl -X GET http://localhost:8080/api/cocina/pedidos-pendientes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Iniciar preparación
```bash
curl -X PATCH http://localhost:8080/api/cocina/pedido/1/iniciar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "observacion": "Comenzando preparación"
  }'
```

### Marcar como listo
```bash
curl -X PATCH http://localhost:8080/api/cocina/pedido/1/listo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "observacion": "Pedido completado"
  }'
```

### Ver estadísticas de cocina
```bash
curl -X GET http://localhost:8080/api/cocina/estadisticas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ver productos más pedidos
```bash
curl -X GET http://localhost:8080/api/cocina/productos-mas-pedidos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚶 Mozo

### Ver pedidos listos para entrega
```bash
curl -X GET http://localhost:8080/api/mozo/pedidos-listos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Marcar como entregado
```bash
curl -X PATCH http://localhost:8080/api/mozo/pedido/1/entregado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "observacion": "Entregado en mesa 5"
  }'
```

### Ver pedidos de una mesa
```bash
curl -X GET http://localhost:8080/api/mozo/mesa/5/pedidos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ver mesas activas
```bash
curl -X GET http://localhost:8080/api/mozo/mesas-activas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ver estadísticas del mozo
```bash
curl -X GET http://localhost:8080/api/mozo/estadisticas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Flujo Completo de Ejemplo

### 1. Login como cajero
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "caja", "password": "caja123"}' \
  | jq -r '.data.token')
```

### 2. Crear pedido con pago
```bash
curl -X POST http://localhost:8080/api/caja/pedido-con-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mesa": "10",
    "cliente_nombre": "Pedro Sánchez",
    "tipo_pedido": "local",
    "detalles": [
      {"menu_id": 2, "cantidad": 2},
      {"menu_id": 4, "cantidad": 2},
      {"menu_id": 6, "cantidad": 2}
    ],
    "metodo_pago": "efectivo",
    "monto_recibido": 100
  }'
```

### 3. Login como cocinero
```bash
TOKEN_COCINA=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "cocina", "password": "cocina123"}' \
  | jq -r '.data.token')
```

### 4. Ver pedidos pendientes
```bash
curl -X GET http://localhost:8080/api/cocina/pedidos-pendientes \
  -H "Authorization: Bearer $TOKEN_COCINA"
```

### 5. Marcar como listo
```bash
curl -X PATCH http://localhost:8080/api/cocina/pedido/1/listo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_COCINA"
```

### 6. Login como mozo
```bash
TOKEN_MOZO=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "mozo", "password": "mozo123"}' \
  | jq -r '.data.token')
```

### 7. Ver pedidos listos
```bash
curl -X GET http://localhost:8080/api/mozo/pedidos-listos \
  -H "Authorization: Bearer $TOKEN_MOZO"
```

### 8. Marcar como entregado
```bash
curl -X PATCH http://localhost:8080/api/mozo/pedido/1/entregado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_MOZO"
```

## 📊 Respuestas de Error Comunes

### Error de autenticación
```json
{
  "success": false,
  "message": "Token inválido."
}
```

### Error de permisos
```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere uno de los siguientes roles: admin, caja"
}
```

### Error de validación
```json
{
  "success": false,
  "errors": [
    {
      "field": "precio",
      "message": "El precio debe ser un número positivo"
    }
  ]
}
```

### Error de recurso no encontrado
```json
{
  "success": false,
  "message": "Pedido no encontrado"
}
```

## 🧪 Testing con Postman

1. Importa la colección de Postman (crear archivo `polleria-api.postman_collection.json`)
2. Configura la variable de entorno `{{base_url}}` como `http://localhost:8080`
3. Configura la variable `{{token}}` después del login
4. Ejecuta las pruebas en orden

## 📝 Notas Importantes

- Todos los endpoints protegidos requieren el header `Authorization: Bearer TOKEN`
- Los tokens expiran en 24 horas por defecto
- Los roles determinan qué acciones puede realizar cada usuario
- Las fechas se manejan en zona horaria de Perú (UTC-5)
- Los precios se manejan con 2 decimales
- Los estados de pedidos siguen un flujo específico y no se pueden saltar pasos

## 🔧 Configuración de Cliente HTTP

### Axios (JavaScript)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Fetch (JavaScript)
```javascript
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:8080/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    }
  });
  
  return response.json();
};
```
