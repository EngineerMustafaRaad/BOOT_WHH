@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
title WhatsApp Moderator - Master Launcher
cd /d "%~dp0"
echo ====================================================
echo  Launching Backend and Frontend Dashboard...
echo ====================================================
start "WA Moderator - Backend (Port 4000)" cmd /k "call start-backend.bat"
timeout /t 3 /nobreak >nul
start "WA Moderator - Frontend (Port 5173)" cmd /k "call start-frontend.bat"
echo.
echo Both servers have been launched!
echo Open your browser at: http://localhost:5173
echo.
pause
