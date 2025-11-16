@echo off
echo CineCore MongoDB Keep-Alive Service
echo =====================================

:loop
echo [%date% %time%] Running keep-alive ping...
cd /d "E:\ReactNative\Backend"
node scripts\keepAlive.js

echo [%date% %time%] Waiting 3 hours before next ping...
timeout /t 10800 /nobreak > nul

goto loop