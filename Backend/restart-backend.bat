taskkill /f /im node.exe > nul 2>&1
timeout /t 2 > nul
echo Starting CineCore Backend...
node server.js
