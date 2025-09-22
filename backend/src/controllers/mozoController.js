const { Pedido, DetallePedido, Menu, HistorialPedido, Pago, User, AsignacionMesa, NotificacionMozo, sequelize } = require('../models');
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
    
    // Primero obtener TODAS las mesas con pedidos del día que NO han sido liberadas
    // Una mesa está activa si tiene pedidos del día y NO ha sido liberada manualmente
    const mesasConPedidos = await Pedido.findAll({
      where: {
        tipo_pedido: 'local',
        estado: { [Op.notIn]: ['cancelado'] }, // Solo excluir cancelados
        createdAt: { [Op.gte]: hoy },
        mesa: { [Op.not]: null },
        [Op.or]: [
          { mesa_liberada: false },
          { mesa_liberada: null }  // Para compatibilidad con registros antiguos
        ]
      },
      attributes: [
        'mesa',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_pedidos'],
        [sequelize.fn('MIN', sequelize.col('createdAt')), 'primer_pedido']
      ],
      group: ['mesa'],
      order: [['mesa', 'ASC']]
    });
    
    // IMPORTANTE: Todas las mesas con pedidos del día se consideran activas
    // hasta que el mozo las marque como desocupadas manualmente
    const mesasActivas = mesasConPedidos;
    
    // Para cada mesa activa, obtener información adicional
    const mesasConInfo = await Promise.all(mesasActivas.map(async (mesa) => {
      // Obtener todos los pedidos del día (para calcular totales)
      const todosPedidos = await Pedido.findAll({
        where: {
          mesa: mesa.mesa,
          estado: { [Op.notIn]: ['cancelado'] },
          createdAt: { [Op.gte]: hoy }
        },
        include: [{
          model: Pago,
          as: 'pago'
        }]
      });
      
      // Contar pedidos no entregados
      const pedidosNoEntregados = todosPedidos.filter(p => 
        p.estado !== 'entregado' && p.estado !== 'cancelado'
      );
      
      const totalPendiente = todosPedidos.reduce((sum, pedido) => {
        return sum + (pedido.pago ? 0 : parseFloat(pedido.total));
      }, 0);
      
      const tiempoOcupacion = Math.floor((new Date() - new Date(mesa.dataValues.primer_pedido)) / 1000 / 60); // en minutos
      
      return {
        mesa: mesa.mesa,
        pedidos_activos: pedidosNoEntregados.length,
        pedidos_totales: parseInt(mesa.dataValues.total_pedidos),
        tiempo_ocupacion_minutos: tiempoOcupacion,
        total_pendiente_pago: totalPendiente,
        estados: todosPedidos.map(p => p.estado),
        cliente_presente: true // La mesa está ocupada hasta que se libere manualmente
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

// Verificar si una mesa específica está ocupada
const verificarEstadoMesa = async (req, res, next) => {
  try {
    const { numeroMesa } = req.params;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Buscar pedidos activos en esta mesa
    const pedidosActivos = await Pedido.findAll({
      where: {
        mesa: numeroMesa,
        tipo_pedido: 'local',
        estado: { [Op.notIn]: ['entregado', 'cancelado'] },
        createdAt: { [Op.gte]: hoy }
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre']
          }]
        }
      ]
    });
    
    const estaOcupada = pedidosActivos.length > 0;
    
    // Si está ocupada, obtener información adicional
    let infoOcupacion = null;
    if (estaOcupada) {
      const primerPedido = pedidosActivos[0];
      const tiempoOcupacion = Math.floor((new Date() - new Date(primerPedido.createdAt)) / 1000 / 60);
      
      infoOcupacion = {
        cliente: primerPedido.cliente_nombre,
        tiempo_ocupacion_minutos: tiempoOcupacion,
        numero_pedidos: pedidosActivos.length,
        estados: pedidosActivos.map(p => p.estado),
        total_pendiente: pedidosActivos.reduce((sum, p) => sum + parseFloat(p.total), 0)
      };
    }
    
    res.json({
      success: true,
      data: {
        mesa: numeroMesa,
        ocupada: estaOcupada,
        info: infoOcupacion
      }
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
      pedidosEntregadosHoy
    ] = await Promise.all([
      Pedido.count({ where: { estado: 'listo' } }),
      Pedido.count({
        where: {
          estado: 'entregado',
          fecha_entregado: { [Op.gte]: hoy }
          // Removido el filtro por usuario_id para mostrar todos los entregados del día
        }
      })
    ]);
    
    // Contar mesas activas (necesita una consulta separada con GROUP BY)
    const mesasActivasResult = await Pedido.findAll({
      where: {
        tipo_pedido: 'local',
        estado: { [Op.notIn]: ['entregado', 'cancelado'] },
        mesa: { [Op.not]: null },
        createdAt: { [Op.gte]: hoy } // Solo pedidos del día
      },
      attributes: [
        'mesa',
        [sequelize.fn('COUNT', sequelize.col('mesa')), 'count']
      ],
      group: ['mesa']
    });
    
    const mesasActivas = mesasActivasResult.length; // Número de mesas únicas
    
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
        mesas_activas: mesasActivas,
        tiempo_promedio_entrega_minutos: tiempoPromedioEntrega
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener notificaciones del mozo
const getNotificaciones = async (req, res, next) => {
  try {
    const mozoId = req.userId;
    const { no_leidas } = req.query;
    
    const where = { mozo_id: mozoId };
    if (no_leidas === 'true') {
      where.leida = false;
    }
    
    const notificaciones = await NotificacionMozo.findAll({
      where,
      include: [{
        model: Pedido,
        as: 'pedido',
        attributes: ['numero_pedido', 'mesa', 'cliente_nombre']
      }],
      order: [
        ['prioridad', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 50
    });
    
    res.json({
      success: true,
      data: notificaciones
    });
  } catch (error) {
    next(error);
  }
};

// Marcar notificación como leída
const marcarNotificacionLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mozoId = req.userId;
    
    const notificacion = await NotificacionMozo.findOne({
      where: { id, mozo_id: mozoId }
    });
    
    if (!notificacion) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }
    
    notificacion.leida = true;
    notificacion.fecha_leida = new Date();
    await notificacion.save();
    
    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    next(error);
  }
};

// Asignar mesa a mozo
const asignarMesa = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { mesa_numero, mozo_id } = req.body;
    const turno = req.body.turno || 'completo';
    
    // Verificar si la mesa ya está asignada
    const asignacionExistente = await AsignacionMesa.findOne({
      where: {
        mesa_numero,
        estado: 'activa'
      },
      transaction: t
    });
    
    if (asignacionExistente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'La mesa ya está asignada a otro mozo'
      });
    }
    
    // Crear nueva asignación
    const asignacion = await AsignacionMesa.create({
      mozo_id: mozo_id || req.userId,
      mesa_numero,
      turno
    }, { transaction: t });
    
    // Actualizar el usuario mozo
    const mozo = await User.findByPk(mozo_id || req.userId, { transaction: t });
    if (mozo) {
      const mesasActuales = mozo.mesas_asignadas ? JSON.parse(mozo.mesas_asignadas) : [];
      mesasActuales.push(mesa_numero);
      mozo.mesas_asignadas = JSON.stringify(mesasActuales);
      mozo.estado_mozo = 'ocupado';
      await mozo.save({ transaction: t });
    }
    
    // Crear notificación
    await NotificacionMozo.create({
      mozo_id: mozo_id || req.userId,
      tipo: 'nueva_asignacion',
      titulo: `Mesa ${mesa_numero} asignada`,
      mensaje: `Se te ha asignado la mesa ${mesa_numero}`,
      mesa_numero,
      prioridad: 'media'
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Mesa asignada correctamente',
      data: asignacion
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Liberar/Desocupar mesa - versión simplificada
const liberarMesa = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { mesa_numero } = req.params;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Marcar TODOS los pedidos del día de esta mesa para indicar que fue liberada
    // Esto incluye pedidos entregados para que no aparezca en mesas activas
    const pedidosActualizados = await Pedido.update(
      { 
        mesa_liberada: true,  // Campo para indicar que la mesa fue liberada
        observaciones: sequelize.fn('CONCAT', 
          sequelize.col('observaciones'), 
          ' - Mesa desocupada por el mozo'
        )
      },
      {
        where: {
          mesa: mesa_numero,
          createdAt: { [Op.gte]: hoy }
        },
        transaction: t
      }
    );
    
    // Intentar actualizar la asignación si existe el sistema
    try {
      const asignacion = await AsignacionMesa.findOne({
        where: {
          mesa_numero,
          estado: 'activa'
        },
        include: [{
          model: User,
          as: 'mozo'
        }],
        transaction: t
      });
      
      if (asignacion) {
        // Marcar como finalizada
        asignacion.estado = 'finalizada';
        asignacion.fecha_liberacion = new Date();
        await asignacion.save({ transaction: t });
        
        // Actualizar el mozo
        const mozo = asignacion.mozo;
        if (mozo && mozo.mesas_asignadas) {
          const mesasActuales = JSON.parse(mozo.mesas_asignadas);
          const index = mesasActuales.indexOf(mesa_numero);
          if (index > -1) {
            mesasActuales.splice(index, 1);
          }
          mozo.mesas_asignadas = JSON.stringify(mesasActuales);
          if (mesasActuales.length === 0) {
            mozo.estado_mozo = 'disponible';
          }
          await mozo.save({ transaction: t });
        }
      }
    } catch (error) {
      // Si no existe el sistema de asignación, no hay problema
      console.log('Sistema de asignación no disponible, continuando...');
    }
    
    // Intentar notificar a mozos si existe el sistema
    try {
      const mozosDisponibles = await User.findAll({
        where: {
          role: 'mozo',
          isActive: true
        },
        transaction: t
      });
      
      for (const mozoDisponible of mozosDisponibles) {
        await NotificacionMozo.create({
          mozo_id: mozoDisponible.id,
          tipo: 'mesa_liberada',
          titulo: `Mesa ${mesa_numero} disponible`,
          mensaje: `La mesa ${mesa_numero} se ha liberado y está disponible para asignar`,
          mesa_numero,
          prioridad: 'media'
        }, { transaction: t });
      }
    } catch (error) {
      // Si no existe la tabla de notificaciones, no hay problema
      console.log('Sistema de notificaciones no disponible');
    }
    
    await t.commit();
    
    res.json({
      success: true,
      message: `Mesa ${mesa_numero} desocupada correctamente`,
      data: {
        mesa: mesa_numero,
        pedidos_actualizados: pedidosActualizados[0] || 0,
        timestamp: new Date()
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Obtener mozos disponibles
const getMozosDisponibles = async (req, res, next) => {
  try {
    const mozos = await User.findAll({
      where: {
        role: 'mozo',
        isActive: true
      },
      attributes: ['id', 'username', 'codigo_empleado', 'turno', 'mesas_asignadas', 'estado_mozo'],
      include: [{
        model: AsignacionMesa,
        as: 'mesasAsignadas',
        where: { estado: 'activa' },
        required: false,
        attributes: ['mesa_numero', 'fecha_asignacion']
      }]
    });
    
    // Formatear respuesta
    const mozosFormateados = mozos.map(mozo => {
      const mesasAsignadas = mozo.mesas_asignadas ? JSON.parse(mozo.mesas_asignadas) : [];
      return {
        id: mozo.id,
        nombre: mozo.username,
        codigo: mozo.codigo_empleado,
        turno: mozo.turno,
        estado: mozo.estado_mozo,
        mesas_asignadas: mesasAsignadas,
        cantidad_mesas: mesasAsignadas.length,
        disponible: mozo.estado_mozo === 'disponible' || mesasAsignadas.length < 4
      };
    });
    
    res.json({
      success: true,
      data: mozosFormateados
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas detalladas de todos los mozos
const getEstadisticasTodosMozos = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const mozos = await User.findAll({
      where: { role: 'mozo', isActive: true },
      attributes: ['id', 'username', 'codigo_empleado', 'turno', 'estado_mozo']
    });
    
    const estadisticas = await Promise.all(mozos.map(async (mozo) => {
      // Pedidos entregados hoy
      const pedidosEntregadosHoy = await Pedido.count({
        where: {
          estado: 'entregado',
          fecha_entregado: { [Op.gte]: hoy }
        },
        include: [{
          model: HistorialPedido,
          as: 'historial',
          where: {
            usuario_id: mozo.id,
            estado_nuevo: 'entregado'
          },
          required: true
        }]
      });
      
      // Mesas asignadas actualmente
      const mesasAsignadas = await AsignacionMesa.count({
        where: {
          mozo_id: mozo.id,
          estado: 'activa'
        }
      });
      
      // Notificaciones no leídas
      const notificacionesPendientes = await NotificacionMozo.count({
        where: {
          mozo_id: mozo.id,
          leida: false
        }
      });
      
      return {
        mozo_id: mozo.id,
        nombre: mozo.username,
        codigo: mozo.codigo_empleado,
        turno: mozo.turno,
        estado: mozo.estado_mozo,
        pedidos_entregados_hoy: pedidosEntregadosHoy,
        mesas_asignadas: mesasAsignadas,
        notificaciones_pendientes: notificacionesPendientes
      };
    }));
    
    res.json({
      success: true,
      data: estadisticas
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
  verificarEstadoMesa,
  getEstadisticasMozo,
  getNotificaciones,
  marcarNotificacionLeida,
  asignarMesa,
  liberarMesa,
  getMozosDisponibles,
  getEstadisticasTodosMozos
};
