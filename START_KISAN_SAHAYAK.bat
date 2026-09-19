@echo off
title Kisan Sahayak AI Server Launcher
echo ========================================================
echo   Starting Kisan Sahayak (Backend :5000 + Frontend :5173)
echo ========================================================
cd /d "%~dp0"
echo.
echo 1. Launching development servers...
echo 2. Opening http://localhost:5173 in browser...
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
npm run dev
pause
