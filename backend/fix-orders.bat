@echo off
echo ====================================
echo  ELIMINANDO PEDIDOS PROBLEMATICOS
echo ====================================
echo.
echo Este script eliminara los pedidos que no se pueden marcar como entregados
echo Pedidos a eliminar: #5, #6, #7
echo.
pause

cd /d "%~dp0"
node fix-orders.js

echo.
echo ====================================
echo  PROCESO COMPLETADO
echo ====================================
pause
