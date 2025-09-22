@echo off
echo ========================================
echo Ejecutando migracion: Campo mesa_liberada
echo ========================================
echo.

set DB_HOST=localhost
set DB_USER=root
set DB_NAME=polleria_db

echo Aplicando migracion a la base de datos...
mysql -h %DB_HOST% -u %DB_USER% %DB_NAME% < database\migrations\add-mesa-liberada-field.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migracion aplicada exitosamente!
    echo.
    echo La tabla Pedidos ahora tiene el campo mesa_liberada
    echo que permite marcar cuando una mesa fue desocupada.
) else (
    echo.
    echo ❌ Error al aplicar la migracion
    echo Por favor, verifica la conexion a la base de datos
)

echo.
echo ========================================
echo Proceso completado
echo ========================================
pause
