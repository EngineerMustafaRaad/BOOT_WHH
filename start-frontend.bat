@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
title WhatsApp Moderator - Frontend Dashboard
cd /d "%~dp0\frontend"
echo ====================================================
echo  Starting React Admin Dashboard on http://localhost:5173 ...
echo ====================================================
npm run dev
pause
