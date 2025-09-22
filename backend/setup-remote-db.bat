@echo off
echo ========================================
echo   CONFIGURACION PARA BASE DE DATOS REMOTA
echo ========================================
echo.

echo Creando archivo .env para conectar al servidor remoto...

(
echo # Configuracion de Base de Datos - SERVIDOR REMOTO
echo DB_HOST=172.80.15.84
echo DB_USER=polleria_puno
echo DB_PASSWORD=123456
echo DB_NAME=polleria_db
echo DB_PORT=3306
echo.
echo # Configuracion del Servidor
echo PORT=8080
echo NODE_ENV=development
echo.
echo # Configuracion JWT
echo JWT_SECRET=polleria_secret_key_2024_super_secure
echo JWT_EXPIRES_IN=24h
echo.
echo # Configuracion CORS - Permitir todas las conexiones
echo ALLOWED_ORIGINS=*
) > .env

echo.
echo ✅ Archivo .env creado para conexion remota!
echo.
echo ========================================
echo   VERIFICANDO CONEXION AL SERVIDOR
echo ========================================
echo.

echo Probando conexion a 172.80.15.84...
ping -n 2 172.80.15.84 >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ El servidor responde al ping
) else (
    echo ⚠️ No se puede hacer ping al servidor
    echo    Esto podria ser normal si el firewall bloquea ICMP
)

echo.
echo ========================================
echo   POSIBLES PROBLEMAS Y SOLUCIONES
echo ========================================
echo.
echo Si el backend NO se conecta, verifica:
echo.
echo 1. FIREWALL DEL SERVIDOR:
echo    - El puerto 3306 debe estar abierto
echo    - MySQL debe permitir conexiones remotas
echo.
echo 2. CONFIGURACION DE MySQL EN EL SERVIDOR:
echo    - El usuario 'polleria_puno' debe tener permisos desde '%%'
echo    - Ejecutar en el servidor MySQL:
echo      GRANT ALL PRIVILEGES ON polleria_db.* TO 'polleria_puno'@'%%';
echo      FLUSH PRIVILEGES;
echo.
echo 3. ARCHIVO my.ini o my.cnf EN EL SERVIDOR:
echo    - Comentar o cambiar: bind-address = 127.0.0.1
echo    - Cambiar a: bind-address = 0.0.0.0
echo    - Reiniciar MySQL despues del cambio
echo.
echo 4. VERIFICAR CONECTIVIDAD:
echo    - Asegurate de estar en la misma red
echo    - Prueba con telnet: telnet 172.80.15.84 3306
echo.
pause
