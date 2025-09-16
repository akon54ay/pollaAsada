-- Script de inicialización de base de datos para Pollería
-- Este script crea la estructura inicial si se prefiere no usar Sequelize sync

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS polleria_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE polleria_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'caja', 'cocina', 'mozo') DEFAULT 'mozo',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de menú
CREATE TABLE IF NOT EXISTS Menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria ENUM('entrada', 'plato_principal', 'bebida', 'postre', 'adicional') NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    imagen_url VARCHAR(255),
    tiempo_preparacion INT DEFAULT 15,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_disponible (disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS Pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    mesa VARCHAR(10),
    cliente_nombre VARCHAR(100),
    tipo_pedido ENUM('local', 'llevar', 'delivery') DEFAULT 'local',
    estado ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado') DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    usuario_id INT,
    fecha_pendiente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_preparando TIMESTAMP NULL,
    fecha_listo TIMESTAMP NULL,
    fecha_entregado TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX idx_numero_pedido (numero_pedido),
    INDEX idx_estado (estado),
    INDEX idx_fecha (createdAt),
    INDEX idx_mesa (mesa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de detalles de pedido
CREATE TABLE IF NOT EXISTS DetallePedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    menu_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    observaciones TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_id) REFERENCES Menus(id) ON DELETE RESTRICT,
    INDEX idx_pedido_id (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS Pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL UNIQUE,
    numero_ticket VARCHAR(20) UNIQUE NOT NULL,
    metodo_pago ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia') NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_recibido DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    usuario_id INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX idx_numero_ticket (numero_ticket),
    INDEX idx_fecha_pago (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de pedidos
CREATE TABLE IF NOT EXISTS HistorialPedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    estado_anterior ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado'),
    estado_nuevo ENUM('pendiente', 'preparando', 'listo', 'entregado', 'cancelado') NOT NULL,
    usuario_id INT,
    observacion TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES Users(id) ON DELETE SET NULL,
    INDEX idx_pedido_historial (pedido_id),
    INDEX idx_fecha_cambio (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear vistas útiles

-- Vista de pedidos con detalles completos
CREATE OR REPLACE VIEW vista_pedidos_completos AS
SELECT 
    p.id,
    p.numero_pedido,
    p.mesa,
    p.cliente_nombre,
    p.tipo_pedido,
    p.estado,
    p.total,
    p.observaciones,
    p.fecha_pendiente,
    p.fecha_preparando,
    p.fecha_listo,
    p.fecha_entregado,
    u.username as usuario_nombre,
    u.role as usuario_rol,
    COUNT(dp.id) as cantidad_items,
    pg.numero_ticket,
    pg.metodo_pago,
    p.createdAt
FROM Pedidos p
LEFT JOIN Users u ON p.usuario_id = u.id
LEFT JOIN DetallePedidos dp ON p.id = dp.pedido_id
LEFT JOIN Pagos pg ON p.id = pg.pedido_id
GROUP BY p.id;

-- Vista de resumen de ventas diarias
CREATE OR REPLACE VIEW vista_ventas_diarias AS
SELECT 
    DATE(p.createdAt) as fecha,
    COUNT(DISTINCT p.id) as total_pedidos,
    SUM(p.total) as venta_total,
    COUNT(DISTINCT CASE WHEN p.estado = 'entregado' THEN p.id END) as pedidos_completados,
    COUNT(DISTINCT CASE WHEN p.estado = 'cancelado' THEN p.id END) as pedidos_cancelados,
    AVG(CASE WHEN p.estado = 'entregado' AND p.fecha_listo IS NOT NULL 
        THEN TIMESTAMPDIFF(MINUTE, p.fecha_pendiente, p.fecha_listo) END) as tiempo_promedio_preparacion
FROM Pedidos p
GROUP BY DATE(p.createdAt);

-- Procedimiento almacenado para obtener productos más vendidos
DELIMITER //
CREATE PROCEDURE sp_productos_mas_vendidos(
    IN fecha_inicio DATE,
    IN fecha_fin DATE
)
BEGIN
    SELECT 
        m.id,
        m.nombre,
        m.categoria,
        SUM(dp.cantidad) as total_vendido,
        SUM(dp.subtotal) as ingreso_total,
        COUNT(DISTINCT dp.pedido_id) as pedidos_diferentes
    FROM DetallePedidos dp
    INNER JOIN Menus m ON dp.menu_id = m.id
    INNER JOIN Pedidos p ON dp.pedido_id = p.id
    WHERE p.createdAt BETWEEN fecha_inicio AND fecha_fin
        AND p.estado != 'cancelado'
    GROUP BY m.id
    ORDER BY total_vendido DESC;
END//
DELIMITER ;

-- Índices adicionales para optimización
CREATE INDEX idx_pedidos_estado_fecha ON Pedidos(estado, createdAt);
CREATE INDEX idx_historial_pedido_fecha ON HistorialPedidos(pedido_id, fecha_cambio);

-- Insertar datos de ejemplo (comentar en producción)
-- Usuario admin por defecto (password: admin123 - hasheado con bcrypt)
-- INSERT INTO Users (username, email, password, role) VALUES 
-- ('admin', 'admin@polleria.com', '$2a$10$YourHashedPasswordHere', 'admin');

GRANT ALL PRIVILEGES ON polleria_db.* TO 'polleria_puno'@'%';
FLUSH PRIVILEGES;
