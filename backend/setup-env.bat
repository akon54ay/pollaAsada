@echo off
echo ========================================
echo   CONFIGURANDO ARCHIVO .env
echo ========================================
echo.

REM Verificar si ya existe el archivo .env
if exist .env (
    echo El archivo .env ya existe.
    set /p overwrite="¿Deseas sobrescribirlo? (s/n): "
    if /i not "%overwrite%"=="s" (
        echo Operación cancelada.
        pause
        exit /b
    )
)

REM Crear el archivo .env con configuración local
echo Creando archivo .env con configuración local...

(
echo # Configuración de Base de Datos
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=root
echo DB_PASSWORD=
echo DB_NAME=polleria_db
echo.
echo # Configuración del Servidor
echo PORT=8080
echo NODE_ENV=development
echo.
echo # Configuración JWT
echo JWT_SECRET=polleria_jwt_secret_key_2024_super_secure
echo JWT_EXPIRES_IN=24h
echo.
echo # Configuración CORS
echo CORS_ORIGIN=http://localhost:5173
) > .env

echo.
echo ✅ Archivo .env creado exitosamente!
echo.
echo ========================================
echo   IMPORTANTE:
echo ========================================
echo.
echo 1. Edita el archivo .env y configura tu contraseña de MySQL
echo    en la línea DB_PASSWORD=
echo.
echo 2. Asegúrate de que MySQL esté ejecutándose
echo.
echo 3. Puedes crear la base de datos manualmente o dejar
echo    que Sequelize la cree automáticamente
echo.
echo ========================================
pause
