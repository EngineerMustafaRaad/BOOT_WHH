@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
title WhatsApp Moderator - Backend Server
cd /d "%~dp0"
echo ====================================================
echo  Starting WhatsApp Group Moderator Backend Server...
echo ====================================================
npm run dev
pause
