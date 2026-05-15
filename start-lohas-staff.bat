@echo off
cd /d "%~dp0"
start "LOHAS stock server" cmd /k ""C:\Users\AndyLin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" server.py"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8769/index.html"
