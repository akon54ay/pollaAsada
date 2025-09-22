const { Pedido, User, sequelize } = require('./src/models');
const { Op } = require('sequelize');
const mozoController = require('./src/controllers/mozoController');

async function testMozoStats() {
  try {
    console.log('=== Probando Estadísticas del Mozo ===\n');
    
    // Obtener un usuario mozo para simular la petición
    const mozo = await User.findOne({ where: { role: 'mozo' } });
    const userId = mozo ? mozo.id : null;
    
    // Simular request y response
    const req = { userId };
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
      }
    };
    const next = (error) => {
      if (error) console.error('Error:', error);
    };
    
    // Llamar directamente al controlador
    console.log('1. Obteniendo estadísticas del mozo...');
    await mozoController.getEstadisticasMozo(req, res, next);
    
    if (responseData && responseData.success) {
      console.log('✓ Estadísticas obtenidas:\n');
      console.log(JSON.stringify(responseData.data, null, 2));
    } else {
      console.log('✗ No se pudieron obtener las estadísticas');
    }
    
    // Verificar datos directamente en la BD
    console.log('\n2. Verificando datos en la base de datos...\n');
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Contar pedidos por estado
    const pedidosListos = await Pedido.count({ where: { estado: 'listo' } });
    console.log(`Pedidos listos: ${pedidosListos}`);
    
    const pedidosEntregadosHoy = await Pedido.count({
      where: {
        estado: 'entregado',
        fecha_entregado: { [Op.gte]: hoy }
      }
    });
    console.log(`Pedidos entregados hoy: ${pedidosEntregadosHoy}`);
    
    // Mesas activas
    const mesasActivasResult = await Pedido.findAll({
      where: {
        tipo_pedido: 'local',
        estado: { [Op.notIn]: ['entregado', 'cancelado'] },
        mesa: { [Op.not]: null },
        createdAt: { [Op.gte]: hoy }
      },
      attributes: [
        'mesa',
        [sequelize.fn('COUNT', sequelize.col('mesa')), 'count']
      ],
      group: ['mesa']
    });
    
    console.log(`Mesas activas: ${mesasActivasResult.length}`);
    
    if (mesasActivasResult.length > 0) {
      console.log('\nDetalles de mesas:');
      mesasActivasResult.forEach(mesa => {
        console.log(`  - Mesa ${mesa.mesa}: ${mesa.dataValues.count} pedidos`);
      });
    }
    
    // Verificar fechas de pedidos entregados
    const pedidosConFechas = await Pedido.findAll({
      where: {
        estado: 'entregado',
        fecha_entregado: { [Op.gte]: hoy }
      },
      attributes: ['numero_pedido', 'fecha_listo', 'fecha_entregado'],
      limit: 3
    });
    
    if (pedidosConFechas.length > 0) {
      console.log('\nPedidos entregados hoy con sus tiempos:');
      pedidosConFechas.forEach(p => {
        const tiempoEntrega = p.fecha_listo && p.fecha_entregado 
          ? Math.floor((p.fecha_entregado - p.fecha_listo) / 1000 / 60)
          : 'N/A';
        console.log(`  - ${p.numero_pedido}: ${tiempoEntrega} min de entrega`);
      });
    }
    
    console.log('\n=== Prueba completada ===');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

testMozoStats();
