const { Pedido, DetallePedido, Menu, User, HistorialPedido, sequelize } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los pedidos
const getPedidos = async (req, res, next) => {
  try {
    const { estado, fecha_inicio, fecha_fin, tipo_pedido } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (estado) {
      where.estado = estado;
    }
    
    if (tipo_pedido) {
      where.tipo_pedido = tipo_pedido;
    }
    
    if (fecha_inicio || fecha_fin) {
      where.createdAt = {};
      if (fecha_inicio) {
        where.createdAt[Op.gte] = new Date(fecha_inicio);
      }
      if (fecha_fin) {
        where.createdAt[Op.lte] = new Date(fecha_fin);
      }
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
            attributes: ['nombre', 'precio']
          }]
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['username', 'role']
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

// Obtener un pedido por ID
const getPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu'
          }]
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['username', 'role']
        },
        {
          model: HistorialPedido,
          as: 'historial',
          include: [{
            model: User,
            as: 'usuario',
            attributes: ['username']
          }],
          order: [['fecha_cambio', 'ASC']]
        }
      ]
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: pedido
    });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo pedido
const createPedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      mesa,
      cliente_nombre,
      tipo_pedido,
      observaciones,
      detalles
    } = req.body;
    
    // Validar que haya detalles
    if (!detalles || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El pedido debe tener al menos un producto'
      });
    }
    
    // Calcular total
    let total = 0;
    const detallesConPrecio = [];
    
    for (const detalle of detalles) {
      const menu = await Menu.findByPk(detalle.menu_id, { transaction: t });
      
      if (!menu) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${detalle.menu_id} no encontrado`
        });
      }
      
      if (!menu.disponible) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `El producto "${menu.nombre}" no está disponible`
        });
      }
      
      const subtotal = menu.precio * detalle.cantidad;
      total += subtotal;
      
      detallesConPrecio.push({
        menu_id: detalle.menu_id,
        cantidad: detalle.cantidad,
        precio_unitario: menu.precio,
        subtotal,
        observaciones: detalle.observaciones
      });
    }
    
    // Crear pedido
    const pedido = await Pedido.create({
      mesa,
      cliente_nombre,
      tipo_pedido: tipo_pedido || 'local',
      estado: 'pendiente',
      total,
      observaciones,
      usuario_id: req.userId
    }, { transaction: t });
    
    // Crear detalles del pedido
    for (const detalle of detallesConPrecio) {
      await DetallePedido.create({
        pedido_id: pedido.id,
        ...detalle
      }, { transaction: t });
    }
    
    // Crear registro en historial
    await HistorialPedido.create({
      pedido_id: pedido.id,
      estado_anterior: null,
      estado_nuevo: 'pendiente',
      usuario_id: req.userId,
      observacion: 'Pedido creado'
    }, { transaction: t });
    
    await t.commit();
    
    // Obtener pedido completo
    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'precio', 'categoria']
          }]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: pedidoCompleto
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Actualizar estado del pedido
const updateEstadoPedido = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado, observacion } = req.body;
    
    const pedido = await Pedido.findByPk(id, { transaction: t });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    const estadoAnterior = pedido.estado;
    
    // Validar transición de estado
    const transicionesValidas = {
      'pendiente': ['preparando', 'cancelado'],
      'preparando': ['listo', 'cancelado'],
      'listo': ['entregado', 'cancelado'],
      'entregado': [],
      'cancelado': []
    };
    
    if (!transicionesValidas[estadoAnterior].includes(estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de estado "${estadoAnterior}" a "${estado}"`
      });
    }
    
    // Actualizar fechas según el estado
    const fechaActual = new Date();
    if (estado === 'preparando') {
      pedido.fecha_preparando = fechaActual;
    } else if (estado === 'listo') {
      pedido.fecha_listo = fechaActual;
    } else if (estado === 'entregado') {
      pedido.fecha_entregado = fechaActual;
    }
    
    pedido.estado = estado;
    await pedido.save({ transaction: t });
    
    // Crear registro en historial
    await HistorialPedido.create({
      pedido_id: pedido.id,
      estado_anterior: estadoAnterior,
      estado_nuevo: estado,
      usuario_id: req.userId,
      observacion: observacion || `Estado cambiado de ${estadoAnterior} a ${estado}`
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Estado del pedido actualizado exitosamente',
      data: pedido
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Actualizar pedido (solo observaciones u otros campos)
const updatePedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    
    // Buscar pedido
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    // Actualizar solo las observaciones
    if (observaciones !== undefined) {
      pedido.observaciones = observaciones;
    }
    
    await pedido.save();
    
    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      data: pedido
    });
  } catch (error) {
    next(error);
  }
};

// Cancelar pedido
const cancelarPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    req.body.estado = 'cancelado';
    req.body.observacion = motivo || 'Pedido cancelado';
    
    return updateEstadoPedido(req, res, next);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPedidos,
  getPedido,
  createPedido,
  updateEstadoPedido,
  updatePedido,
  cancelarPedido
};
