const { Pago, Pedido, DetallePedido, Menu, sequelize } = require('../models');
const { Op } = require('sequelize');

// Registrar pago de un pedido
const registrarPago = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      pedido_id,
      metodo_pago,
      monto_recibido
    } = req.body;
    
    // Buscar pedido
    const pedido = await Pedido.findByPk(pedido_id, {
      include: [{
        model: DetallePedido,
        as: 'detalles'
      }],
      transaction: t
    });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    // Verificar si ya tiene pago
    const pagoExistente = await Pago.findOne({
      where: { pedido_id },
      transaction: t
    });
    
    if (pagoExistente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este pedido ya ha sido pagado'
      });
    }
    
    // Crear pago
    const pago = await Pago.create({
      pedido_id,
      metodo_pago,
      monto_total: pedido.total,
      monto_recibido: metodo_pago === 'efectivo' ? monto_recibido : pedido.total,
      usuario_id: req.userId
    }, { transaction: t });
    
    await t.commit();
    
    // Obtener pago completo con pedido
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [{
        model: Pedido,
        as: 'pedido',
        include: [{
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'precio']
          }]
        }]
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: {
        pago: pagoCompleto,
        ticket: generarTicket(pagoCompleto)
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Generar ticket de venta
const generarTicket = (pago) => {
  const fecha = new Date(pago.createdAt);
  const fechaFormateada = fecha.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let ticket = `
========================================
         POLLERÍA - TICKET DE VENTA
========================================
Ticket #: ${pago.numero_ticket}
Pedido #: ${pago.pedido.numero_pedido}
Fecha: ${fechaFormateada}
----------------------------------------
DETALLE:
`;
  
  pago.pedido.detalles.forEach(detalle => {
    const subtotal = detalle.cantidad * detalle.precio_unitario;
    ticket += `${detalle.cantidad}x ${detalle.menu.nombre.padEnd(20)} S/.${subtotal.toFixed(2)}\n`;
    if (detalle.observaciones) {
      ticket += `   Nota: ${detalle.observaciones}\n`;
    }
  });
  
  ticket += `
----------------------------------------
TOTAL:                    S/.${pago.monto_total}
Método de pago:           ${pago.metodo_pago.toUpperCase()}`;
  
  if (pago.metodo_pago === 'efectivo') {
    ticket += `
Recibido:                 S/.${pago.monto_recibido}
Cambio:                   S/.${pago.cambio}`;
  }
  
  ticket += `
========================================
        ¡GRACIAS POR SU COMPRA!
========================================
`;
  
  return ticket;
};

// Obtener ticket de un pago
const getTicket = async (req, res, next) => {
  try {
    const { numero_ticket } = req.params;
    
    const pago = await Pago.findOne({
      where: { numero_ticket },
      include: [{
        model: Pedido,
        as: 'pedido',
        include: [{
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'precio']
          }]
        }]
      }]
    });
    
    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Ticket no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        pago,
        ticket: generarTicket(pago)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener resumen de caja del día
const getResumenCaja = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    
    const fechaInicio = fecha 
      ? new Date(fecha) 
      : new Date(new Date().setHours(0, 0, 0, 0));
    
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + 1);
    
    // Obtener todos los pagos del día
    const pagos = await Pago.findAll({
      where: {
        createdAt: {
          [Op.gte]: fechaInicio,
          [Op.lt]: fechaFin
        }
      },
      include: [{
        model: Pedido,
        as: 'pedido',
        attributes: ['numero_pedido', 'tipo_pedido']
      }]
    });
    
    // Calcular resumen
    const resumen = {
      fecha: fechaInicio.toISOString().split('T')[0],
      total_ventas: pagos.length,
      monto_total: pagos.reduce((sum, pago) => sum + parseFloat(pago.monto_total), 0),
      por_metodo_pago: {},
      por_tipo_pedido: {}
    };
    
    // Agrupar por método de pago
    pagos.forEach(pago => {
      if (!resumen.por_metodo_pago[pago.metodo_pago]) {
        resumen.por_metodo_pago[pago.metodo_pago] = {
          cantidad: 0,
          monto: 0
        };
      }
      resumen.por_metodo_pago[pago.metodo_pago].cantidad++;
      resumen.por_metodo_pago[pago.metodo_pago].monto += parseFloat(pago.monto_total);
      
      // Agrupar por tipo de pedido
      const tipoPedido = pago.pedido.tipo_pedido;
      if (!resumen.por_tipo_pedido[tipoPedido]) {
        resumen.por_tipo_pedido[tipoPedido] = {
          cantidad: 0,
          monto: 0
        };
      }
      resumen.por_tipo_pedido[tipoPedido].cantidad++;
      resumen.por_tipo_pedido[tipoPedido].monto += parseFloat(pago.monto_total);
    });
    
    res.json({
      success: true,
      data: {
        resumen,
        pagos
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo pedido y registrar pago (todo en uno)
const crearPedidoConPago = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    const {
      // Datos del pedido
      mesa,
      cliente_nombre,
      tipo_pedido,
      observaciones,
      detalles,
      // Datos del pago
      metodo_pago,
      monto_recibido
    } = req.body;
    
    // Validar detalles
    if (!detalles || detalles.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El pedido debe tener al menos un producto'
      });
    }
    
    // Calcular total y validar productos
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
    
    // Crear detalles
    for (const detalle of detallesConPrecio) {
      await DetallePedido.create({
        pedido_id: pedido.id,
        ...detalle
      }, { transaction: t });
    }
    
    // Crear pago
    const pago = await Pago.create({
      pedido_id: pedido.id,
      metodo_pago,
      monto_total: total,
      monto_recibido: metodo_pago === 'efectivo' ? monto_recibido : total,
      usuario_id: req.userId
    }, { transaction: t });
    
    await t.commit();
    
    // Obtener datos completos
    const pagoCompleto = await Pago.findByPk(pago.id, {
      include: [{
        model: Pedido,
        as: 'pedido',
        include: [{
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Menu,
            as: 'menu',
            attributes: ['nombre', 'precio', 'categoria']
          }]
        }]
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Pedido y pago registrados exitosamente',
      data: {
        pago: pagoCompleto,
        ticket: generarTicket(pagoCompleto)
      }
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  registrarPago,
  getTicket,
  getResumenCaja,
  crearPedidoConPago
};
