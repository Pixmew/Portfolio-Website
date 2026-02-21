@echo off
echo Starting Portfolio Server...
echo.
echo =============================================
echo   Portfolio will open at: http://localhost:8080
echo   Close this window to stop the server.
echo =============================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
