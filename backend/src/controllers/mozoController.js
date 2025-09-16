const { Pedido, DetallePedido, Menu, HistorialPedido, Pago, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener pedidos listos para entrega
const getPedidosListos = async (req, res, next) => {
  try {
    const { tipo_pedido } = req.query;
    
    const where = { estado: 'listo' };
    if (tipo_pedido) {
      where.tipo_pedido = tipo_pedido;
    }
    
    const pedidos = await Pedido.findAll({
      where,
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'categoria']
          }]
        },
        {
          model: Pago,
          as: 'pago',
          attributes: ['numero_ticket', 'metodo_pago', 'monto_total']
        }
      ],
      order: [['fecha_listo', 'ASC']] // Los que están listos hace más tiempo primero
    });
    
    // Calcular tiempo de espera desde que está listo
    const pedidosConTiempo = pedidos.map(pedido => {
      const tiempoEsperaListo = Math.floor((new Date() - new Date(pedido.fecha_listo)) / 1000 / 60); // en minutos
      return {
        ...pedido.toJSON(),
        tiempo_esperando_entrega: tiempoEsperaListo
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

// Marcar pedido como entregado
const marcarComoEntregado = async (req, res, next) => {
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
    
    if (pedido.estado !== 'listo') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede marcar como entregado. El pedido está en estado: ${pedido.estado}`
      });
    }
    
    // Verificar que el pedido esté pagado
    const pago = await Pago.findOne({
      where: { pedido_id: pedido.id },
      transaction: t
    });
    
    if (!pago) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El pedido debe estar pagado antes de ser entregado'
      });
    }
    
    const estadoAnterior = pedido.estado;
    pedido.estado = 'entregado';
    pedido.fecha_entregado = new Date();
    await pedido.save({ transaction: t });
    
    // Registrar en historial
    await HistorialPedido.create({
      pedido_id: pedido.id,
      estado_anterior: estadoAnterior,
      estado_nuevo: 'entregado',
      usuario_id: req.userId,
      observacion: observacion || 'Pedido entregado al cliente'
    }, { transaction: t });
    
    await t.commit();
    
    // Calcular tiempos
    const tiempoTotal = Math.floor((pedido.fecha_entregado - pedido.createdAt) / 1000 / 60); // en minutos
    const tiempoDesdeListoMinutos = Math.floor((pedido.fecha_entregado - pedido.fecha_listo) / 1000 / 60);
    
    res.json({
      success: true,
      message: 'Pedido marcado como entregado',
      data: {
        ...pedido.toJSON(),
        tiempo_total_minutos: tiempoTotal,
        tiempo_entrega_minutos: tiempoDesdeListoMinutos
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Obtener pedidos por mesa
const getPedidosPorMesa = async (req, res, next) => {
  try {
    const { mesa } = req.params;
    
    const pedidos = await Pedido.findAll({
      where: {
        mesa,
        estado: { [Op.ne]: 'cancelado' },
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) // Solo pedidos del día
        }
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'precio']
          }]
        },
        {
          model: Pago,
          as: 'pago'
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: pedidos
    });
  } catch (error) {
    next(error);
  }
};

// Obtener mesas activas
const getMesasActivas = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pedidosActivos = await Pedido.findAll({
      where: {
        tipo_pedido: 'local',
        estado: { [Op.notIn]: ['entregado', 'cancelado'] },
        createdAt: { [Op.gte]: hoy },
        mesa: { [Op.not]: null }
      },
      attributes: [
        'mesa',
        [sequelize.fn('COUNT', sequelize.col('id')), 'pedidos_activos'],
        [sequelize.fn('MIN', sequelize.col('createdAt')), 'primer_pedido']
      ],
      group: ['mesa'],
      order: [['mesa', 'ASC']]
    });
    
    // Para cada mesa, obtener información adicional
    const mesasConInfo = await Promise.all(pedidosActivos.map(async (mesa) => {
      const pedidos = await Pedido.findAll({
        where: {
          mesa: mesa.mesa,
          estado: { [Op.notIn]: ['entregado', 'cancelado'] },
          createdAt: { [Op.gte]: hoy }
        },
        include: [{
          model: Pago,
          as: 'pago'
        }]
      });
      
      const totalPendiente = pedidos.reduce((sum, pedido) => {
        return sum + (pedido.pago ? 0 : parseFloat(pedido.total));
      }, 0);
      
      const tiempoOcupacion = Math.floor((new Date() - new Date(mesa.dataValues.primer_pedido)) / 1000 / 60); // en minutos
      
      return {
        mesa: mesa.mesa,
        pedidos_activos: parseInt(mesa.dataValues.pedidos_activos),
        tiempo_ocupacion_minutos: tiempoOcupacion,
        total_pendiente_pago: totalPendiente,
        estados: pedidos.map(p => p.estado)
      };
    }));
    
    res.json({
      success: true,
      data: mesasConInfo
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas del mozo
const getEstadisticasMozo = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Estadísticas del día
    const [
      pedidosListos,
      pedidosEntregadosHoy,
      mesasActivas
    ] = await Promise.all([
      Pedido.count({ where: { estado: 'listo' } }),
      Pedido.count({
        where: {
          estado: 'entregado',
          fecha_entregado: { [Op.gte]: hoy },
          usuario_id: req.userId // Solo los entregados por este mozo
        }
      }),
      Pedido.count({
        where: {
          tipo_pedido: 'local',
          estado: { [Op.notIn]: ['entregado', 'cancelado'] },
          mesa: { [Op.not]: null }
        },
        group: ['mesa']
      })
    ]);
    
    // Tiempo promedio de entrega (desde listo hasta entregado)
    const pedidosConTiempo = await Pedido.findAll({
      where: {
        estado: 'entregado',
        fecha_entregado: { [Op.gte]: hoy },
        fecha_listo: { [Op.not]: null }
      },
      attributes: ['fecha_listo', 'fecha_entregado']
    });
    
    let tiempoPromedioEntrega = 0;
    if (pedidosConTiempo.length > 0) {
      const tiempoTotal = pedidosConTiempo.reduce((sum, pedido) => {
        return sum + (pedido.fecha_entregado - pedido.fecha_listo);
      }, 0);
      tiempoPromedioEntrega = Math.floor(tiempoTotal / pedidosConTiempo.length / 1000 / 60);
    }
    
    res.json({
      success: true,
      data: {
        pedidos_listos_para_entrega: pedidosListos,
        pedidos_entregados_hoy: pedidosEntregadosHoy,
        mesas_activas: mesasActivas.length || 0,
        tiempo_promedio_entrega_minutos: tiempoPromedioEntrega
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPedidosListos,
  marcarComoEntregado,
  getPedidosPorMesa,
  getMesasActivas,
  getEstadisticasMozo
};
