@echo off
REM ThinkersCave frontend - dev server on port 4300 (Windows). Launched by scripts\dev-start.ps1.

cd /d "%~dp0"

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":4300" ^| findstr "LISTENING"') do (
  echo Stopping PID %%p on port 4300...
  taskkill /F /PID %%p >nul 2>&1
)

call npm start
