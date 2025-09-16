@echo off
echo ========================================
echo   INICIANDO BACKEND POLLERIA (DEV MODE)
echo ========================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo ========================================
echo   INICIANDO SERVIDOR EN MODO DESARROLLO
echo ========================================
echo.
echo Servidor iniciando en http://localhost:8080
echo Modo: DESARROLLO (con auto-reload)
echo Presiona Ctrl+C para detener el servidor
echo.
npm run dev
