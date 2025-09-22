-- Migración para sistema de múltiples mozos
-- Fecha: 2024-09-22

USE polleria_db;

-- 1. Agregar campos adicionales a la tabla Users para mozos
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS codigo_empleado VARCHAR(20) UNIQUE AFTER username,
ADD COLUMN IF NOT EXISTS turno ENUM('mañana', 'tarde', 'noche', 'completo') DEFAULT 'completo' AFTER isActive,
ADD COLUMN IF NOT EXISTS mesas_asignadas JSON AFTER turno,
ADD COLUMN IF NOT EXISTS estado_mozo ENUM('disponible', 'ocupado', 'descanso', 'offline') DEFAULT 'offline' AFTER mesas_asignadas;

-- 2. Crear tabla para asignación de mesas a mozos
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

-- 3. Crear tabla para historial de atención de mesas
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

-- 4. Crear tabla para notificaciones de mozos
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
    FOREIGN KEY (mozo_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES Pedidos(id) ON DELETE SET NULL,
    INDEX idx_mozo_no_leidas (mozo_id, leida),
    INDEX idx_fecha (createdAt)
);

-- 5. Crear vista para estadísticas de mozos
CREATE OR REPLACE VIEW vista_estadisticas_mozos AS
SELECT 
    u.id AS mozo_id,
    u.username AS mozo_nombre,
    u.codigo_empleado,
    u.turno,
    u.estado_mozo,
    COUNT(DISTINCT am.mesa_numero) AS mesas_asignadas_actuales,
    COUNT(DISTINCT CASE WHEN p.estado = 'listo' THEN p.id END) AS pedidos_listos,
    COUNT(DISTINCT CASE WHEN DATE(ham.fecha_inicio) = CURDATE() THEN ham.id END) AS mesas_atendidas_hoy,
    COALESCE(AVG(ham.tiempo_atencion_minutos), 0) AS tiempo_promedio_atencion,
    COALESCE(AVG(ham.calificacion), 0) AS calificacion_promedio,
    COALESCE(SUM(CASE WHEN DATE(ham.fecha_inicio) = CURDATE() THEN ham.total_vendido ELSE 0 END), 0) AS venta_total_hoy,
    COALESCE(SUM(CASE WHEN DATE(ham.fecha_inicio) = CURDATE() THEN ham.propina ELSE 0 END), 0) AS propinas_hoy
FROM Users u
LEFT JOIN AsignacionMesas am ON u.id = am.mozo_id AND am.estado = 'activa'
LEFT JOIN Pedidos p ON p.usuario_id = u.id AND p.estado = 'listo'
LEFT JOIN HistorialAtencionMesas ham ON u.id = ham.mozo_id
WHERE u.role = 'mozo'
GROUP BY u.id;

-- 6. Insertar mozos de ejemplo (si no existen)
INSERT INTO Users (username, password, role, codigo_empleado, turno, mesas_asignadas, estado_mozo, isActive)
SELECT * FROM (
    SELECT 'mozo1' as username, '$2a$10$YourHashedPassword' as password, 'mozo' as role, 
           'MZ001' as codigo_empleado, 'mañana' as turno, '["1","2","3","4"]' as mesas_asignadas, 
           'disponible' as estado_mozo, true as isActive
    UNION ALL
    SELECT 'mozo2', '$2a$10$YourHashedPassword', 'mozo', 'MZ002', 'tarde', '["5","6","7","8"]', 'disponible', true
    UNION ALL
    SELECT 'mozo3', '$2a$10$YourHashedPassword', 'mozo', 'MZ003', 'noche', '["9","10","11","12"]', 'disponible', true
) AS new_mozos
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username IN ('mozo1', 'mozo2', 'mozo3'));

-- 7. Crear procedimiento para asignar mesa a mozo
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS AsignarMesaAMozo(
    IN p_mozo_id INT,
    IN p_mesa_numero VARCHAR(10),
    IN p_turno VARCHAR(20)
)
BEGIN
    DECLARE mesa_ocupada INT DEFAULT 0;
    
    -- Verificar si la mesa ya está asignada
    SELECT COUNT(*) INTO mesa_ocupada 
    FROM AsignacionMesas 
    WHERE mesa_numero = p_mesa_numero 
    AND estado = 'activa';
    
    IF mesa_ocupada > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'La mesa ya está asignada a otro mozo';
    ELSE
        -- Asignar la mesa
        INSERT INTO AsignacionMesas (mozo_id, mesa_numero, turno)
        VALUES (p_mozo_id, p_mesa_numero, p_turno);
        
        -- Actualizar las mesas asignadas en el usuario
        UPDATE Users 
        SET mesas_asignadas = JSON_ARRAY_APPEND(
            COALESCE(mesas_asignadas, JSON_ARRAY()), 
            '$', 
            p_mesa_numero
        ),
        estado_mozo = 'ocupado'
        WHERE id = p_mozo_id;
    END IF;
END//
DELIMITER ;

-- 8. Crear procedimiento para liberar mesa
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS LiberarMesa(
    IN p_mesa_numero VARCHAR(10)
)
BEGIN
    DECLARE v_mozo_id INT;
    
    -- Obtener el mozo asignado
    SELECT mozo_id INTO v_mozo_id
    FROM AsignacionMesas
    WHERE mesa_numero = p_mesa_numero
    AND estado = 'activa'
    LIMIT 1;
    
    IF v_mozo_id IS NOT NULL THEN
        -- Marcar la asignación como finalizada
        UPDATE AsignacionMesas
        SET estado = 'finalizada',
            fecha_liberacion = NOW()
        WHERE mesa_numero = p_mesa_numero
        AND estado = 'activa';
        
        -- Actualizar las mesas del mozo
        UPDATE Users
        SET mesas_asignadas = JSON_REMOVE(
            mesas_asignadas,
            JSON_UNQUOTE(JSON_SEARCH(mesas_asignadas, 'one', p_mesa_numero))
        )
        WHERE id = v_mozo_id;
        
        -- Crear notificación para otros mozos
        INSERT INTO NotificacionesMozo (mozo_id, tipo, titulo, mensaje, mesa_numero, prioridad)
        SELECT id, 'mesa_liberada', 
               CONCAT('Mesa ', p_mesa_numero, ' disponible'),
               CONCAT('La mesa ', p_mesa_numero, ' se ha liberado y está disponible para asignar'),
               p_mesa_numero,
               'media'
        FROM Users
        WHERE role = 'mozo' 
        AND estado_mozo IN ('disponible', 'ocupado')
        AND id != v_mozo_id;
    END IF;
END//
DELIMITER ;

-- 9. Crear trigger para notificar cuando un pedido está listo
DELIMITER //
CREATE TRIGGER IF NOT EXISTS notificar_pedido_listo
AFTER UPDATE ON Pedidos
FOR EACH ROW
BEGIN
    IF NEW.estado = 'listo' AND OLD.estado != 'listo' THEN
        -- Notificar al mozo asignado a la mesa
        INSERT INTO NotificacionesMozo (mozo_id, tipo, titulo, mensaje, mesa_numero, pedido_id, prioridad)
        SELECT am.mozo_id, 'pedido_listo',
               CONCAT('Pedido ', NEW.numero_pedido, ' listo'),
               CONCAT('El pedido ', NEW.numero_pedido, ' de la mesa ', NEW.mesa, ' está listo para entregar'),
               NEW.mesa,
               NEW.id,
               'alta'
        FROM AsignacionMesas am
        WHERE am.mesa_numero = NEW.mesa
        AND am.estado = 'activa';
    END IF;
END//
DELIMITER ;

-- 10. Índices adicionales para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_users_role_estado ON Users(role, estado_mozo);
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa_estado ON Pedidos(mesa, estado);

COMMIT;
