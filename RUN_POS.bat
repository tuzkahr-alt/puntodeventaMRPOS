@echo off
echo Iniciando Servidor Local para RetailPro ERP/POS...
echo.
echo Presiona CTRL+C para detener el servidor.
echo.
start http://localhost:8000
python -m http.server 8000
pause
