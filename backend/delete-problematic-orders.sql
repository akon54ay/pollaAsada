-- Script para eliminar pedidos problemáticos
-- Los pedidos 5, 6 y 7 que no se pueden marcar como entregados

-- Primero eliminar los detalles del pedido (relación con productos)
DELETE FROM detallepedidos WHERE pedido_id IN (5, 6, 7);

-- Eliminar historial de pedidos si existe
DELETE FROM historialpedidos WHERE pedido_id IN (5, 6, 7);

-- Eliminar pagos asociados si existen
DELETE FROM pagos WHERE pedido_id IN (5, 6, 7);

-- Finalmente eliminar los pedidos
DELETE FROM pedidos WHERE id IN (5, 6, 7);

-- Confirmar que se eliminaron
SELECT 'Pedidos eliminados exitosamente' as resultado;
