const { Pedido, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function checkStats() {
  try {
    console.log('=== Verificando datos de pedidos ===\n');
    
    // Total de pedidos
    const totalPedidos = await Pedido.count();
    console.log(`Total de pedidos en la BD: ${totalPedidos}`);
    
    // Pedidos por estado
    const pedidosPorEstado = await Pedido.findAll({
      attributes: [
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: ['estado']
    });
    
    console.log('\nPedidos por estado:');
    pedidosPorEstado.forEach(p => {
      console.log(`  ${p.estado}: ${p.dataValues.cantidad}`);
    });
    
    // Pedidos de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pedidosHoy = await Pedido.count({
      where: {
        createdAt: { [Op.gte]: hoy }
      }
    });
    console.log(`\nPedidos creados hoy: ${pedidosHoy}`);
    
    // Verificar campos de fecha
    const pedidosConFechas = await Pedido.findAll({
      attributes: ['id', 'numero_pedido', 'estado', 'fecha_pendiente', 'fecha_preparando', 'fecha_listo', 'fecha_entregado', 'createdAt'],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    console.log('\nÚltimos 5 pedidos con sus fechas:');
    pedidosConFechas.forEach(p => {
      console.log(`\nPedido ${p.numero_pedido} (${p.estado}):`);
      console.log(`  createdAt: ${p.createdAt}`);
      console.log(`  fecha_pendiente: ${p.fecha_pendiente}`);
      console.log(`  fecha_preparando: ${p.fecha_preparando}`);
      console.log(`  fecha_listo: ${p.fecha_listo}`);
      console.log(`  fecha_entregado: ${p.fecha_entregado}`);
    });
    
    // Verificar pedidos listos con fecha_listo
    const pedidosListosConFecha = await Pedido.count({
      where: {
        estado: 'listo',
        fecha_listo: { [Op.not]: null }
      }
    });
    
    const pedidosListosSinFecha = await Pedido.count({
      where: {
        estado: 'listo',
        fecha_listo: null
      }
    });
    
    console.log(`\nPedidos en estado 'listo':`);
    console.log(`  Con fecha_listo: ${pedidosListosConFecha}`);
    console.log(`  Sin fecha_listo: ${pedidosListosSinFecha}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStats();
