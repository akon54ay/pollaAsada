const app = require('./app');
const { sequelize, testConnection } = require('./config/db');
const { User, Menu } = require('./models');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 8080;

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  try {
    // Probar conexión
    await testConnection();
    
    // Sincronizar modelos con la base de datos
    // En producción, usar migraciones en lugar de sync
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');
    
    // Crear usuario admin por defecto si no existe
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@polleria.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Usuario admin creado (username: admin, password: admin123)');
    }
    
    // Crear algunos items de menú de ejemplo si la tabla está vacía
    const menuCount = await Menu.count();
    if (menuCount === 0) {
      const menuItems = [
        {
          nombre: 'Pollo a la Brasa Entero',
          descripcion: 'Pollo entero marinado con especias peruanas',
          categoria: 'plato_principal',
          precio: 55.00,
          disponible: true,
          tiempo_preparacion: 45
        },
        {
          nombre: '1/2 Pollo a la Brasa',
          descripcion: 'Medio pollo marinado con especias peruanas',
          categoria: 'plato_principal',
          precio: 30.00,
          disponible: true,
          tiempo_preparacion: 30
        },
        {
          nombre: '1/4 Pollo a la Brasa',
          descripcion: 'Cuarto de pollo marinado con especias peruanas',
          categoria: 'plato_principal',
          precio: 18.00,
          disponible: true,
          tiempo_preparacion: 20
        },
        {
          nombre: 'Papas Fritas',
          descripcion: 'Papas fritas crocantes',
          categoria: 'adicional',
          precio: 8.00,
          disponible: true,
          tiempo_preparacion: 10
        },
        {
          nombre: 'Ensalada Fresca',
          descripcion: 'Lechuga, tomate, pepino y aderezo de la casa',
          categoria: 'entrada',
          precio: 12.00,
          disponible: true,
          tiempo_preparacion: 5
        },
        {
          nombre: 'Inca Kola 1.5L',
          descripcion: 'Bebida gaseosa peruana',
          categoria: 'bebida',
          precio: 8.00,
          disponible: true,
          tiempo_preparacion: 1
        },
        {
          nombre: 'Coca Cola 1.5L',
          descripcion: 'Bebida gaseosa',
          categoria: 'bebida',
          precio: 8.00,
          disponible: true,
          tiempo_preparacion: 1
        },
        {
          nombre: 'Chicha Morada 1L',
          descripcion: 'Bebida tradicional peruana de maíz morado',
          categoria: 'bebida',
          precio: 10.00,
          disponible: true,
          tiempo_preparacion: 2
        },
        {
          nombre: 'Crema Volteada',
          descripcion: 'Postre tradicional peruano',
          categoria: 'postre',
          precio: 10.00,
          disponible: true,
          tiempo_preparacion: 2
        },
        {
          nombre: 'Anticuchos',
          descripcion: 'Brochetas de corazón de res marinadas',
          categoria: 'entrada',
          precio: 15.00,
          disponible: true,
          tiempo_preparacion: 15
        }
      ];
      
      await Menu.bulkCreate(menuItems);
      console.log('✅ Items de menú de ejemplo creados.');
    }
    
    // Crear usuarios de ejemplo para cada rol
    const roles = ['caja', 'cocina', 'mozo'];
    for (const role of roles) {
      const userExists = await User.findOne({ where: { username: role } });
      if (!userExists) {
        await User.create({
          username: role,
          email: `${role}@polleria.com`,
          password: `${role}123`,
          role: role,
          isActive: true
        });
        console.log(`✅ Usuario ${role} creado (username: ${role}, password: ${role}123)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    
    // Iniciar servidor Express en todas las interfaces
    app.listen(PORT, '0.0.0.0', () => {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      
      // Obtener todas las IPs disponibles
      for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }
      
      console.log(`
========================================
🚀 Servidor iniciado exitosamente
========================================
📍 Local: http://localhost:${PORT}
📍 Red: ${addresses.map(addr => `http://${addr}:${PORT}`).join('\n📍 Red: ')}
📍 API Health: http://localhost:${PORT}/health
📍 Entorno: ${process.env.NODE_ENV}
📍 Base de datos: ${process.env.DB_NAME}@${process.env.DB_HOST}
========================================
📝 Usuarios de prueba:
   - admin/admin123 (Administrador)
   - caja/caja123 (Cajero)
   - cocina/cocina123 (Cocinero)
   - mozo/mozo123 (Mozo)
========================================
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales para cerrar correctamente
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Cerrando conexiones...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido. Cerrando conexiones...');
  await sequelize.close();
  process.exit(0);
});

// Iniciar aplicación
startServer();
