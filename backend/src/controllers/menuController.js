const { Menu } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los items del menú
const getMenuItems = async (req, res, next) => {
  try {
    const { categoria, disponible, search } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (disponible !== undefined) {
      where.disponible = disponible === 'true';
    }
    
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const menuItems = await Menu.findAll({
      where,
      order: [['categoria', 'ASC'], ['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un item del menú por ID
const getMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const menuItem = await Menu.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Item del menú no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// Crear un nuevo item del menú
const createMenuItem = async (req, res, next) => {
  try {
    const {
      nombre,
      descripcion,
      categoria,
      precio,
      disponible,
      imagen_url,
      tiempo_preparacion
    } = req.body;
    
    const menuItem = await Menu.create({
      nombre,
      descripcion,
      categoria,
      precio,
      disponible: disponible !== undefined ? disponible : true,
      imagen_url,
      tiempo_preparacion
    });
    
    res.status(201).json({
      success: true,
      message: 'Item del menú creado exitosamente',
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar un item del menú
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const menuItem = await Menu.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Item del menú no encontrado'
      });
    }
    
    await menuItem.update(updates);
    
    res.json({
      success: true,
      message: 'Item del menú actualizado exitosamente',
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar un item del menú
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const menuItem = await Menu.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Item del menú no encontrado'
      });
    }
    
    await menuItem.destroy();
    
    res.json({
      success: true,
      message: 'Item del menú eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar disponibilidad de un item
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const menuItem = await Menu.findByPk(id);
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Item del menú no encontrado'
      });
    }
    
    menuItem.disponible = !menuItem.disponible;
    await menuItem.save();
    
    res.json({
      success: true,
      message: `Item ${menuItem.disponible ? 'habilitado' : 'deshabilitado'} exitosamente`,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
};
