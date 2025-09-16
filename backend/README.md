# Backend Pollería - Sistema de Gestión

Backend desarrollado con Node.js, Express, MySQL y JWT para un sistema de gestión de pollería.

## 🚀 Características

- **Autenticación JWT** con roles (admin, caja, cocina, mozo)
- **Base de datos MySQL** con Sequelize ORM
- **API RESTful** con validación de datos
- **Sistema de roles y permisos**
- **Gestión completa de pedidos** con estados y historial
- **Sistema de caja** con generación de tickets
- **Panel de cocina** para gestión de preparación
- **Panel de mozos** para entrega de pedidos

## 📋 Requisitos Previos

- Node.js 14+ 
- MySQL 5.7+ o MariaDB 10.3+
- NPM o Yarn

## 🔧 Instalación

1. **Clonar el repositorio o navegar a la carpeta backend**
```bash
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

El archivo `.env` ya está configurado con:
```env
# Base de datos
DB_HOST=172.80.15.84
DB_USER=polleria_puno
DB_PASSWORD=123456
DB_NAME=polleria_db
DB_PORT=3306

# Servidor
PORT=8080

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=*

# Entorno
NODE_ENV=development
```

4. **Iniciar el servidor**
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── db.js           # Configuración de base de datos
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── menuController.js
│   │   ├── pedidoController.js
│   │   ├── cajaController.js
│   │   ├── cocinaController.js
│   │   └── mozoController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Menu.js
│   │   ├── Pedido.js
│   │   ├── DetallePedido.js
│   │   ├── Pago.js
│   │   ├── HistorialPedido.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── menuRoutes.js
│   │   ├── pedidoRoutes.js
│   │   ├── cajaRoutes.js
│   │   ├── cocinaRoutes.js
│   │   └── mozoRoutes.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── app.js              # Configuración de Express
│   └── server.js            # Punto de entrada
├── database/
│   └── init.sql            # Script SQL inicial
├── .env                    # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🔑 Usuarios de Prueba

Al iniciar el servidor por primera vez, se crean automáticamente estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| caja | caja123 | Cajero |
| cocina | cocina123 | Cocinero |
| mozo | mozo123 | Mozo |

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere auth)
- `POST /api/auth/change-password` - Cambiar contraseña (requiere auth)

### Menú
- `GET /api/menu` - Listar items del menú
- `GET /api/menu/:id` - Obtener item específico
- `POST /api/menu` - Crear item (admin)
- `PUT /api/menu/:id` - Actualizar item (admin)
- `DELETE /api/menu/:id` - Eliminar item (admin)
- `PATCH /api/menu/:id/toggle-availability` - Cambiar disponibilidad (admin/cocina)

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Obtener pedido específico
- `POST /api/pedidos` - Crear pedido (caja/mozo/admin)
- `PATCH /api/pedidos/:id/estado` - Actualizar estado
- `POST /api/pedidos/:id/cancelar` - Cancelar pedido (caja/admin)

### Caja
- `POST /api/caja/pago` - Registrar pago
- `POST /api/caja/pedido-con-pago` - Crear pedido y pago
- `GET /api/caja/ticket/:numero_ticket` - Obtener ticket
- `GET /api/caja/resumen` - Resumen de caja del día

### Cocina
- `GET /api/cocina/pedidos-pendientes` - Pedidos pendientes/preparando
- `PATCH /api/cocina/pedido/:id/iniciar` - Iniciar preparación
- `PATCH /api/cocina/pedido/:id/listo` - Marcar como listo
- `GET /api/cocina/estadisticas` - Estadísticas de cocina
- `GET /api/cocina/productos-mas-pedidos` - Productos más pedidos

### Mozo
- `GET /api/mozo/pedidos-listos` - Pedidos listos para entrega
- `PATCH /api/mozo/pedido/:id/entregado` - Marcar como entregado
- `GET /api/mozo/mesa/:mesa/pedidos` - Pedidos por mesa
- `GET /api/mozo/mesas-activas` - Mesas activas
- `GET /api/mozo/estadisticas` - Estadísticas del mozo

## 🔒 Sistema de Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y menú
- Visualización de reportes

### Caja
- Crear pedidos y registrar pagos
- Generar tickets
- Ver resumen de caja
- Cancelar pedidos

### Cocina
- Ver pedidos pendientes
- Iniciar preparación
- Marcar pedidos como listos
- Cambiar disponibilidad de productos

### Mozo
- Ver pedidos listos
- Marcar como entregados
- Gestionar mesas
- Crear pedidos

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Cors** - Manejo de CORS
- **Express-validator** - Validación de datos
- **Dotenv** - Variables de entorno

## 📝 Estados de Pedidos

1. **pendiente** - Pedido creado, esperando preparación
2. **preparando** - En proceso de preparación
3. **listo** - Preparación completada, listo para entrega
4. **entregado** - Entregado al cliente
5. **cancelado** - Pedido cancelado

## 🔄 Flujo de Trabajo

1. **Caja/Mozo** crea un pedido
2. **Caja** registra el pago y genera ticket
3. **Cocina** ve el pedido pendiente
4. **Cocina** inicia preparación (opcional)
5. **Cocina** marca como listo
6. **Mozo** ve pedido listo
7. **Mozo** entrega y marca como entregado

## 🐛 Debugging

Para ver logs detallados en desarrollo:
```bash
NODE_ENV=development npm run dev
```

## 📊 Base de Datos

El sistema crea automáticamente las tablas necesarias al iniciar. Si prefieres crear las tablas manualmente, usa el script SQL en `database/init.sql`.

### Tablas principales:
- Users - Usuarios del sistema
- Menus - Items del menú
- Pedidos - Pedidos realizados
- DetallePedidos - Detalles de cada pedido
- Pagos - Registro de pagos
- HistorialPedidos - Historial de cambios de estado

## 🚀 Despliegue

Para producción:

1. Cambiar `JWT_SECRET` en `.env`
2. Configurar `NODE_ENV=production`
3. Usar un proceso manager como PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name polleria-backend
```

## 📧 Soporte

Para soporte o consultas sobre el sistema, contactar al equipo de desarrollo.

## 📄 Licencia

Sistema propietario - Todos los derechos reservados.
