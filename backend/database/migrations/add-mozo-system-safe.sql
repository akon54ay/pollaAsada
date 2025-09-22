-- Migración SEGURA para sistema de múltiples mozos
-- Fecha: 2024-09-22
-- Esta versión evita problemas con índices duplicados

USE polleria_db;

-- 1. Primero verificar si las columnas ya existen antes de agregarlas
-- Agregar columnas una por una para evitar errores

-- Agregar codigo_empleado si no existe
SET @dbname = DATABASE();
SET @tablename = 'Users';
SET @columnname = 'codigo_empleado';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column codigo_empleado already exists'",
  "ALTER TABLE Users ADD COLUMN codigo_empleado VARCHAR(20) AFTER username"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar turno si no existe
SET @columnname = 'turno';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column turno already exists'",
  "ALTER TABLE Users ADD COLUMN turno ENUM('mañana', 'tarde', 'noche', 'completo') DEFAULT 'completo' AFTER isActive"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar mesas_asignadas si no existe
SET @columnname = 'mesas_asignadas';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column mesas_asignadas already exists'",
  "ALTER TABLE Users ADD COLUMN mesas_asignadas JSON AFTER turno"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar estado_mozo si no existe
SET @columnname = 'estado_mozo';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column estado_mozo already exists'",
  "ALTER TABLE Users ADD COLUMN estado_mozo ENUM('disponible', 'ocupado', 'descanso', 'offline') DEFAULT 'offline' AFTER mesas_asignadas"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Crear tabla AsignacionMesas si no existe
CREATE TABLE IF NOT EXISTS AsignacionMesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mozo_id INT NOT NULL,
    mesa_numero VARCHAR(10) NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_liberacion DATETIME NULL,
    estado ENUM('activa', 'finalizada') DEFAULT 'activa',
    turno VARCHAR(20),
    notas TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mozo_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_mozo_mesa (mozo_id, mesa_numero),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_asignacion)
);

-- 3. Crear tabla NotificacionesMozo si no existe
CREATE TABLE IF NOT EXISTS NotificacionesMozo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mozo_id INT NOT NULL,
    tipo ENUM('mesa_liberada', 'pedido_listo', 'nueva_asignacion', 'cambio_turno', 'alerta') NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    mesa_numero VARCHAR(10),
    pedido_id INT,
    leida BOOLEAN DEFAULT FALSE,
    fecha_leida DATETIME,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mozo_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE SET NULL,
    INDEX idx_mozo_no_leidas (mozo_id, leida),
    INDEX idx_fecha (createdAt)
);

-- 4. Crear tabla HistorialAtencionMesas si no existe
CREATE TABLE IF NOT EXISTS HistorialAtencionMesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mozo_id INT NOT NULL,
    mesa_numero VARCHAR(10) NOT NULL,
    pedido_id INT,
    tiempo_atencion_minutos INT,
    calificacion INT CHECK (calificacion >= 1 AND calificacion <= 5),
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME,
    total_vendido DECIMAL(10, 2),
    propina DECIMAL(10, 2) DEFAULT 0,
    observaciones TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mozo_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE SET NULL,
    INDEX idx_mozo (mozo_id),
    INDEX idx_fecha (fecha_inicio)
);

-- 5. Actualizar mozos existentes con los nuevos campos
UPDATE Users 
SET 
    codigo_empleado = CONCAT('MZ00', id),
    turno = 'completo',
    estado_mozo = 'disponible',
    mesas_asignadas = '[]'
WHERE 
    role = 'mozo' 
    AND codigo_empleado IS NULL;

-- 6. Insertar mozos de ejemplo (solo si no existen)
INSERT IGNORE INTO Users (username, email, password, role, codigo_empleado, turno, estado_mozo, isActive)
VALUES 
    ('mozo1', 'mozo1@polleria.com', '$2a$10$YourHashedPassword', 'mozo', 'MZ001', 'mañana', 'disponible', true),
    ('mozo2', 'mozo2@polleria.com', '$2a$10$YourHashedPassword', 'mozo', 'MZ002', 'tarde', 'disponible', true),
    ('mozo3', 'mozo3@polleria.com', '$2a$10$YourHashedPassword', 'mozo', 'MZ003', 'noche', 'disponible', true);

-- 7. Mensaje de éxito
SELECT 'Migración completada exitosamente' AS mensaje;

COMMIT;
