# Frontend Pollería - Sistema de Gestión

Frontend desarrollado con React, Vite y Tailwind CSS para el sistema de gestión de pollería.

## 🚀 Características

- **4 Vistas principales**: Menú, Caja, Cocina y Mozo
- **Autenticación JWT** con roles y permisos
- **Carrito de compras** con persistencia local
- **Actualización en tiempo real** con polling
- **Interfaz responsiva** con Tailwind CSS
- **Gestión de estado** con Zustand y Context API

## 📋 Requisitos Previos

- Node.js 14+
- NPM o Yarn
- Backend corriendo en http://localhost:8080

## 🔧 Instalación

1. **Navegar a la carpeta frontend**
```bash
cd frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx         # Layout principal con sidebar
│   │   ├── PrivateRoute.jsx   # Protección de rutas
│   │   └── LoadingSpinner.jsx # Componente de carga
│   ├── contexts/
│   │   └── AuthContext.jsx    # Contexto de autenticación
│   ├── pages/
│   │   ├── Login.jsx          # Página de login
│   │   ├── Menu.jsx           # Vista del menú
│   │   ├── Caja.jsx           # Vista de caja
│   │   ├── Cocina.jsx         # Vista de cocina
│   │   └── Mozo.jsx           # Vista de mozo
│   ├── services/
│   │   └── api.js             # Servicios de API
│   ├── stores/
│   │   └── useCartStore.js    # Store del carrito (Zustand)
│   ├── App.jsx                # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎨 Vistas del Sistema

### 1. Vista de Menú (`/`)
- Lista de productos con imágenes
- Filtros por categoría
- Carrito de compras lateral
- Agregar/quitar productos

### 2. Vista de Caja (`/caja`)
- Registro de nuevos pedidos
- Procesamiento de pagos
- Generación de tickets
- Resumen de ventas del día

### 3. Vista de Cocina (`/cocina`)
- Lista de pedidos pendientes
- Cambio de estado a "listo"
- Estadísticas de preparación
- Productos más pedidos

### 4. Vista de Mozo (`/mozo`)
- Pedidos listos para entrega
- Gestión de mesas activas
- Marcar pedidos como entregados
- Historial de entregas

## 🔐 Roles y Permisos

| Rol | Acceso a Vistas |
|-----|-----------------|
| Admin | Todas las vistas |
| Caja | Menú, Caja |
| Cocina | Cocina |
| Mozo | Menú, Mozo |

## 🛠️ Tecnologías Utilizadas

- **React 18** - Framework UI
- **Vite** - Build tool
- **React Router v6** - Routing
- **Tailwind CSS** - Estilos
- **Zustand** - Estado global (carrito)
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 🔄 Flujo de Trabajo

1. **Login**: Usuario ingresa con credenciales
2. **Menú**: Selección de productos para el pedido
3. **Caja**: Procesamiento del pedido y pago
4. **Cocina**: Preparación del pedido
5. **Mozo**: Entrega del pedido

## 🎯 Características Destacadas

### Carrito Persistente
El carrito se mantiene en localStorage, permitiendo que los productos seleccionados persistan entre sesiones.

### Actualización en Tiempo Real
Las vistas de Cocina y Mozo se actualizan automáticamente cada 15-20 segundos para mostrar nuevos pedidos.

### Diseño Responsivo
La interfaz se adapta a diferentes tamaños de pantalla, desde móviles hasta desktop.

### Gestión de Estados
- Estados de pedido: pendiente → preparando → listo → entregado
- Indicadores visuales de tiempo de espera
- Badges de colores según estado

## 🚀 Despliegue

Para compilar para producción:

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

### Configuración para producción:

1. Actualizar la URL de la API en el archivo de servicios
2. Configurar variables de entorno si es necesario
3. Servir los archivos estáticos desde un servidor web

## 🐛 Solución de Problemas

### El frontend no se conecta al backend
- Verificar que el backend esté corriendo en http://localhost:8080
- Revisar la configuración del proxy en vite.config.js
- Verificar CORS en el backend

### Los estilos no se cargan
- Asegurarse de que Tailwind CSS esté instalado
- Verificar que postcss.config.js esté configurado
- Revisar imports en index.css

### Errores de autenticación
- Verificar que el token JWT esté siendo enviado
- Revisar la configuración de axios en api.js
- Verificar roles y permisos

## 📄 Licencia

Sistema propietario - Todos los derechos reservados.
