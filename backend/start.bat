@echo off
echo ========================================
echo   INICIANDO BACKEND POLLERIA
echo ========================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo ========================================
echo   INICIANDO SERVIDOR
echo ========================================
echo.
echo Servidor iniciando en http://localhost:8080
echo Presiona Ctrl+C para detener el servidor
echo.
npm start
