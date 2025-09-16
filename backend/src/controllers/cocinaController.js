const { Pedido, DetallePedido, Menu, HistorialPedido, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener pedidos pendientes y en preparación
const getPedidosPendientes = async (req, res, next) => {
  try {
    const pedidos = await Pedido.findAll({
      where: {
        estado: {
          [Op.in]: ['pendiente', 'preparando']
        }
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'categoria', 'tiempo_preparacion']
          }]
        }
      ],
      order: [
        ['estado', 'DESC'], // preparando primero, luego pendiente
        ['createdAt', 'ASC'] // más antiguos primero
      ]
    });
    
    // Calcular tiempo de espera
    const pedidosConTiempo = pedidos.map(pedido => {
      const tiempoEspera = Math.floor((new Date() - new Date(pedido.createdAt)) / 1000 / 60); // en minutos
      return {
        ...pedido.toJSON(),
        tiempo_espera_minutos: tiempoEspera
      };
    });
    
    res.json({
      success: true,
      data: pedidosConTiempo
    });
  } catch (error) {
    next(error);
  }
};

// Marcar pedido como en preparación
const iniciarPreparacion = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    
    const pedido = await Pedido.findByPk(id, { transaction: t });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    if (pedido.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede iniciar preparación. El pedido está en estado: ${pedido.estado}`
      });
    }
    
    const estadoAnterior = pedido.estado;
    pedido.estado = 'preparando';
    pedido.fecha_preparando = new Date();
    await pedido.save({ transaction: t });
    
    // Registrar en historial
    await HistorialPedido.create({
      pedido_id: pedido.id,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'preparando',
      usuario_id: req.userId,
      observacion: observacion || 'Preparación iniciada'
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Preparación del pedido iniciada',
      data: pedido
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Marcar pedido como listo
const marcarComoListo = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { observacion } = req.body;
    
    const pedido = await Pedido.findByPk(id, { transaction: t });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    if (!['pendiente', 'preparando'].includes(pedido.estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede marcar como listo. El pedido está en estado: ${pedido.estado}`
      });
    }
    
    const estadoAnterior = pedido.estado;
    pedido.estado = 'listo';
    pedido.fecha_listo = new Date();
    
    // Si viene directo de pendiente, también establecer fecha_preparando
    if (estadoAnterior === 'pendiente') {
      pedido.fecha_preparando = new Date();
    }
    
    await pedido.save({ transaction: t });
    
    // Registrar en historial
    await HistorialPedido.create({
      pedido_id: pedido.id,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'listo',
      usuario_id: req.userId,
      observacion: observacion || 'Pedido listo para entrega'
    }, { transaction: t });
    
    await t.commit();
    
    // Calcular tiempo de preparación
    const tiempoPreparacion = Math.floor((pedido.fecha_listo - pedido.createdAt) / 1000 / 60); // en minutos
    
    res.json({
      success: true,
      message: 'Pedido marcado como listo',
      data: {
        ...pedido.toJSON(),
        tiempo_preparacion_minutos: tiempoPreparacion
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Obtener estadísticas de cocina
const getEstadisticasCocina = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Pedidos del día
    const [
      totalPendientes,
      totalPreparando,
      totalListosHoy,
      totalEntregadosHoy
    ] = await Promise.all([
      Pedido.count({ where: { estado: 'pendiente' } }),
      Pedido.count({ where: { estado: 'preparando' } }),
      Pedido.count({
        where: {
          estado: 'listo',
          fecha_listo: { [Op.gte]: hoy }
        }
      }),
      Pedido.count({
        where: {
          estado: 'entregado',
          fecha_entregado: { [Op.gte]: hoy }
        }
      })
    ]);
    
    // Tiempo promedio de preparación del día
    const pedidosCompletados = await Pedido.findAll({
      where: {
        estado: { [Op.in]: ['listo', 'entregado'] },
        fecha_listo: { 
          [Op.gte]: hoy,
          [Op.not]: null
        }
      },
      attributes: ['createdAt', 'fecha_listo']
    });
    
    let tiempoPromedioMinutos = 0;
    if (pedidosCompletados.length > 0) {
      const tiempoTotal = pedidosCompletados.reduce((sum, pedido) => {
        return sum + (pedido.fecha_listo - pedido.createdAt);
      }, 0);
      tiempoPromedioMinutos = Math.floor(tiempoTotal / pedidosCompletados.length / 1000 / 60);
    }
    
    res.json({
      success: true,
      data: {
        pendientes: totalPendientes,
        en_preparacion: totalPreparando,
        listos_hoy: totalListosHoy,
        entregados_hoy: totalEntregadosHoy,
        tiempo_promedio_preparacion: tiempoPromedioMinutos,
        total_procesados_hoy: totalListosHoy + totalEntregadosHoy
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener productos más pedidos del día (para cocina)
const getProductosMasPedidos = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const resultado = await DetallePedido.findAll({
      attributes: [
        'menu_id',
        [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad']
      ],
      include: [
        {
          model: Menu,
          as: 'menu',
          attributes: ['nombre', 'categoria']
        },
        {
          model: Pedido,
          as: 'pedido',
          attributes: [],
          where: {
            createdAt: { [Op.gte]: hoy }
          }
        }
      ],
      group: ['menu_id', 'menu.id'],
      order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
      limit: 10
    });
    
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPedidosPendientes,
  iniciarPreparacion,
  marcarComoListo,
  getEstadisticasCocina,
  getProductosMasPedidos
};
