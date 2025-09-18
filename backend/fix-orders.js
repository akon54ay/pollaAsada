// Script para eliminar pedidos problemáticos
// Ejecutar con: node fix-orders.js

require('dotenv').config();
const { sequelize } = require('./src/config/db');
const { Pedido, DetallePedido, HistorialPedido, Pago } = require('./src/models');

const deleteProblematicOrders = async () => {
  try {
    console.log('🔧 Iniciando limpieza de pedidos problemáticos...');
    
    // IDs de los pedidos a eliminar (incluimos más por si acaso)
    const pedidosIds = [5, 6, 7]; // Agregamos el 7 por si es el tercer pedido problemático
    
    // Iniciar transacción
    const t = await sequelize.transaction();
    
    try {
      // Eliminar detalles de pedidos
      const detallesDeleted = await DetallePedido.destroy({
        where: { pedido_id: pedidosIds },
        transaction: t
      });
      console.log(`✓ Detalles eliminados: ${detallesDeleted}`);
      
      // Eliminar historial
      const historialDeleted = await HistorialPedido.destroy({
        where: { pedido_id: pedidosIds },
        transaction: t
      });
      console.log(`✓ Historial eliminado: ${historialDeleted}`);
      
      // Eliminar pagos
      const pagosDeleted = await Pago.destroy({
        where: { pedido_id: pedidosIds },
        transaction: t
      });
      console.log(`✓ Pagos eliminados: ${pagosDeleted}`);
      
      // Eliminar pedidos
      const pedidosDeleted = await Pedido.destroy({
        where: { id: pedidosIds },
        transaction: t
      });
      console.log(`✓ Pedidos eliminados: ${pedidosDeleted}`);
      
      // Confirmar transacción
      await t.commit();
      
      console.log('✅ Limpieza completada exitosamente');
      console.log('📋 Pedidos #5, #6 y #7 han sido eliminados del sistema');
      
    } catch (error) {
      await t.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar la función
deleteProblematicOrders();
