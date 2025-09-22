const { Pedido, DetallePedido, Menu, Pago, HistorialPedido, User, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function seedTestData() {
  const t = await sequelize.transaction();
  
  try {
    console.log('=== Creando datos de prueba ===\n');
    
    // Obtener un usuario de prueba (o usar null)
    const user = await User.findOne({ where: { role: 'caja' } });
    const userId = user ? user.id : null;
    
    // Obtener algunos productos del menú
    const menuItems = await Menu.findAll({ limit: 5 });
    
    if (menuItems.length === 0) {
      console.log('No hay productos en el menú. Creando algunos...');
      
      // Crear productos de prueba
      const productos = [
        { nombre: '1/4 Pollo a la Brasa', categoria: 'plato_principal', precio: 15.00, tiempo_preparacion: 15, disponible: true },
        { nombre: '1/2 Pollo a la Brasa', categoria: 'plato_principal', precio: 25.00, tiempo_preparacion: 15, disponible: true },
        { nombre: 'Pollo Entero', categoria: 'plato_principal', precio: 45.00, tiempo_preparacion: 20, disponible: true },
        { nombre: 'Papas Fritas', categoria: 'adicional', precio: 8.00, tiempo_preparacion: 5, disponible: true },
        { nombre: 'Ensalada Mixta', categoria: 'entrada', precio: 10.00, tiempo_preparacion: 5, disponible: true },
        { nombre: 'Gaseosa Personal', categoria: 'bebida', precio: 5.00, tiempo_preparacion: 1, disponible: true },
        { nombre: 'Chicha Morada Jarra', categoria: 'bebida', precio: 12.00, tiempo_preparacion: 2, disponible: true }
      ];
      
      for (const prod of productos) {
        await Menu.create(prod, { transaction: t });
      }
      
      // Volver a obtener los items
      menuItems.push(...await Menu.findAll({ limit: 5, transaction: t }));
    }
    
    const ahora = new Date();
    const hace1Hora = new Date(ahora.getTime() - 60 * 60 * 1000);
    const hace30Min = new Date(ahora.getTime() - 30 * 60 * 1000);
    const hace15Min = new Date(ahora.getTime() - 15 * 60 * 1000);
    const hace5Min = new Date(ahora.getTime() - 5 * 60 * 1000);
    
    // Crear pedidos con diferentes estados
    const pedidosData = [
      // Pedidos pendientes (3)
      { 
        estado: 'pendiente', 
        mesa: '1', 
        cliente_nombre: 'Cliente 1',
        tipo_pedido: 'local',
        createdAt: hace30Min,
        fecha_pendiente: hace30Min
      },
      { 
        estado: 'pendiente', 
        mesa: '2', 
        cliente_nombre: 'Cliente 2',
        tipo_pedido: 'local',
        createdAt: hace15Min,
        fecha_pendiente: hace15Min
      },
      { 
        estado: 'pendiente', 
        mesa: null, 
        cliente_nombre: 'Cliente Delivery',
        tipo_pedido: 'delivery',
        createdAt: hace5Min,
        fecha_pendiente: hace5Min
      },
      
      // Pedidos en preparación (2)
      { 
        estado: 'preparando', 
        mesa: '3', 
        cliente_nombre: 'Cliente 3',
        tipo_pedido: 'local',
        createdAt: hace1Hora,
        fecha_pendiente: hace1Hora,
        fecha_preparando: hace30Min
      },
      { 
        estado: 'preparando', 
        mesa: '4', 
        cliente_nombre: 'Cliente 4',
        tipo_pedido: 'local',
        createdAt: hace30Min,
        fecha_pendiente: hace30Min,
        fecha_preparando: hace15Min
      },
      
      // Pedidos listos (2)
      { 
        estado: 'listo', 
        mesa: '5', 
        cliente_nombre: 'Cliente 5',
        tipo_pedido: 'local',
        createdAt: hace1Hora,
        fecha_pendiente: hace1Hora,
        fecha_preparando: hace30Min,
        fecha_listo: hace15Min
      },
      { 
        estado: 'listo', 
        mesa: null, 
        cliente_nombre: 'Cliente Llevar',
        tipo_pedido: 'llevar',
        createdAt: hace30Min,
        fecha_pendiente: hace30Min,
        fecha_preparando: hace15Min,
        fecha_listo: hace5Min
      },
      
      // Pedidos entregados (3)
      { 
        estado: 'entregado', 
        mesa: '6', 
        cliente_nombre: 'Cliente 6',
        tipo_pedido: 'local',
        createdAt: hace1Hora,
        fecha_pendiente: hace1Hora,
        fecha_preparando: hace30Min,
        fecha_listo: hace15Min,
        fecha_entregado: hace5Min
      },
      { 
        estado: 'entregado', 
        mesa: '7', 
        cliente_nombre: 'Cliente 7',
        tipo_pedido: 'local',
        createdAt: hace30Min,
        fecha_pendiente: hace30Min,
        fecha_preparando: hace15Min,
        fecha_listo: hace5Min,
        fecha_entregado: ahora
      },
      { 
        estado: 'entregado', 
        mesa: '8', 
        cliente_nombre: 'Cliente 8',
        tipo_pedido: 'local',
        createdAt: hace15Min,
        fecha_pendiente: hace15Min,
        fecha_preparando: hace5Min,
        fecha_listo: new Date(ahora.getTime() - 2 * 60 * 1000),
        fecha_entregado: ahora
      }
    ];
    
    console.log(`Creando ${pedidosData.length} pedidos de prueba...`);
    
    for (const pedidoData of pedidosData) {
      // Calcular total basado en productos aleatorios
      const numProductos = Math.floor(Math.random() * 3) + 1;
      let total = 0;
      const detalles = [];
      
      for (let i = 0; i < numProductos && i < menuItems.length; i++) {
        const menu = menuItems[i];
        const cantidad = Math.floor(Math.random() * 2) + 1;
        const subtotal = menu.precio * cantidad;
        total += subtotal;
        
        detalles.push({
          menu_id: menu.id,
          cantidad,
          precio_unitario: menu.precio,
          subtotal
        });
      }
      
      // Crear pedido
      const pedido = await Pedido.create({
        ...pedidoData,
        total,
        usuario_id: userId,
        observaciones: `Pedido de prueba - ${pedidoData.estado}`
      }, { transaction: t });
      
      // Crear detalles
      for (const detalle of detalles) {
        await DetallePedido.create({
          pedido_id: pedido.id,
          ...detalle
        }, { transaction: t });
      }
      
      // Crear historial
      await HistorialPedido.create({
        pedido_id: pedido.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        usuario_id: userId,
        observacion: 'Pedido creado (datos de prueba)',
        fecha_cambio: pedidoData.fecha_pendiente
      }, { transaction: t });
      
      // Si el pedido no está pendiente, agregar más historial
      if (pedidoData.fecha_preparando) {
        await HistorialPedido.create({
          pedido_id: pedido.id,
          estado_anterior: 'pendiente',
          estado_nuevo: 'preparando',
          usuario_id: userId,
          observacion: 'Preparación iniciada',
          fecha_cambio: pedidoData.fecha_preparando
        }, { transaction: t });
      }
      
      if (pedidoData.fecha_listo) {
        await HistorialPedido.create({
          pedido_id: pedido.id,
          estado_anterior: 'preparando',
          estado_nuevo: 'listo',
          usuario_id: userId,
          observacion: 'Pedido listo',
          fecha_cambio: pedidoData.fecha_listo
        }, { transaction: t });
      }
      
      if (pedidoData.fecha_entregado) {
        await HistorialPedido.create({
          pedido_id: pedido.id,
          estado_anterior: 'listo',
          estado_nuevo: 'entregado',
          usuario_id: userId,
          observacion: 'Pedido entregado',
          fecha_cambio: pedidoData.fecha_entregado
        }, { transaction: t });
        
        // Crear pago para pedidos entregados
        await Pago.create({
          pedido_id: pedido.id,
          numero_ticket: `T${Date.now()}`,
          metodo_pago: ['efectivo', 'tarjeta', 'yape'][Math.floor(Math.random() * 3)],
          monto_total: total,
          monto_recibido: total,
          cambio: 0,
          usuario_id: userId
        }, { transaction: t });
      }
      
      console.log(`✓ Pedido ${pedido.numero_pedido} creado (${pedidoData.estado})`);
    }
    
    await t.commit();
    
    console.log('\n=== Datos de prueba creados exitosamente ===');
    
    // Mostrar resumen
    const resumen = await Pedido.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['estado']
    });
    
    console.log('\nResumen de pedidos creados:');
    resumen.forEach(r => {
      console.log(`  ${r.estado}: ${r.dataValues.cantidad}`);
    });
    
    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('Error al crear datos de prueba:', error);
    process.exit(1);
  }
}

seedTestData();
