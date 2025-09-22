-- Script para verificar y limpiar índices duplicados en la tabla Users
USE polleria_db;

-- 1. Ver todos los índices de la tabla Users
SHOW INDEX FROM Users;

-- 2. Eliminar índices duplicados del campo username (mantener solo uno)
-- Nota: PRIMARY KEY y el primer UNIQUE se mantienen

-- Obtener información de los índices
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'polleria_db' 
    AND TABLE_NAME = 'Users'
    AND COLUMN_NAME = 'username'
ORDER BY 
    INDEX_NAME;

-- Si hay múltiples índices UNIQUE en username, eliminar los duplicados
-- Mantener solo 'username' o 'username_UNIQUE'
-- Comentar/descomentar según sea necesario después de ver los resultados anteriores

-- DROP INDEX username_2 ON Users;
-- DROP INDEX username_3 ON Users;
-- DROP INDEX username_4 ON Users;
-- DROP INDEX username_5 ON Users;

-- 3. Verificar el total de índices
SELECT 
    COUNT(DISTINCT INDEX_NAME) as total_indices
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'polleria_db' 
    AND TABLE_NAME = 'Users';

-- 4. Si el total es cercano a 64, necesitamos limpiar índices no utilizados
-- Listar todos los índices para revisión
SELECT 
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns,
    NON_UNIQUE
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'polleria_db' 
    AND TABLE_NAME = 'Users'
GROUP BY 
    INDEX_NAME, NON_UNIQUE
ORDER BY 
    INDEX_NAME;
