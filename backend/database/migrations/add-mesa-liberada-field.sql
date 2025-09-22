-- Migración para agregar el campo mesa_liberada a la tabla Pedidos
-- Este campo indica si la mesa fue liberada/desocupada manualmente por el mozo

-- Agregar el campo mesa_liberada si no existe
ALTER TABLE Pedidos 
ADD COLUMN IF NOT EXISTS mesa_liberada BOOLEAN DEFAULT FALSE NOT NULL;

-- Actualizar registros existentes para que tengan el valor por defecto
UPDATE Pedidos 
SET mesa_liberada = FALSE 
WHERE mesa_liberada IS NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_mesa_liberada 
ON Pedidos(mesa_liberada, mesa, createdAt);

-- Comentario explicativo
COMMENT ON COLUMN Pedidos.mesa_liberada IS 'Indica si la mesa fue liberada manualmente por el mozo. TRUE = mesa desocupada, FALSE = mesa aún ocupada';
