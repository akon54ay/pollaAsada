@echo off
echo ========================================
echo   INICIANDO FRONTEND POLLERIA
echo ========================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo ========================================
echo   INICIANDO SERVIDOR DE DESARROLLO
echo ========================================
echo.
echo Frontend iniciando en http://localhost:5173
echo Presiona Ctrl+C para detener el servidor
echo.
npm run dev
