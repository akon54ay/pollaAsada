@echo off
echo ========================================
echo   INICIALIZACIÓN DE BASE DE DATOS
echo ========================================
echo.
echo Este script te ayudará a configurar la base de datos
echo.

echo ¿Cómo deseas proceder?
echo.
echo [1] Crear solo la base de datos (Sequelize creará las tablas)
echo [2] Crear base de datos y tablas usando init.sql
echo [3] Solo verificar conexión (la BD ya existe)
echo.
set /p option="Selecciona una opción (1-3): "

if "%option%"=="1" (
    echo.
    echo Creando solo la base de datos...
    echo.
    set /p mysql_user="Ingresa tu usuario MySQL (default: root): "
    if "%mysql_user%"=="" set mysql_user=root
    
    echo CREATE DATABASE IF NOT EXISTS polleria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; | mysql -u %mysql_user% -p
    
    echo.
    echo ✅ Base de datos creada. Ahora ejecuta:
    echo    npm run dev
    echo.
    echo Sequelize creará las tablas automáticamente.
    
) else if "%option%"=="2" (
    echo.
    echo Ejecutando script SQL completo...
    echo.
    set /p mysql_user="Ingresa tu usuario MySQL (default: root): "
    if "%mysql_user%"=="" set mysql_user=root
    
    mysql -u %mysql_user% -p < database\init.sql
    
    echo.
    echo ✅ Base de datos y tablas creadas desde init.sql
    
) else if "%option%"=="3" (
    echo.
    echo Verificando conexión...
    npm run dev
    
) else (
    echo Opción inválida
)

echo.
pause
