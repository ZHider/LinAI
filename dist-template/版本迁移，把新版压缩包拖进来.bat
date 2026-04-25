@echo off
cd /d "%~dp0"
set NODE_ENV=production
.\runtime\node.exe .\server\migrate.js "%~1"
pause
