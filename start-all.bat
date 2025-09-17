@echo off
echo ========================================
echo   INICIANDO SISTEMA COMPLETO POLLERIA
echo ========================================
echo.

echo [1/2] Iniciando Backend...
cd backend
start cmd /k "npm install && npm start"
timeout /t 5 /nobreak > nul

echo [2/2] Iniciando Frontend...
cd ../frontend
start cmd /k "npm install && npm run dev"

echo.
echo ========================================
echo   SISTEMA INICIADO
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Espera unos segundos para que los servicios inicien completamente.
echo.
pause
