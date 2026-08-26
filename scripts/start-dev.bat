@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
echo [1/3] Checking Node.js...
where node >nul 2>nul || (echo ERROR: Install Node.js LTS 22.x & pause & exit /b 1)
node --version
echo [2/3] Checking dependencies...
if not exist "node_modules\electron\cli.js" call npm.cmd install
if errorlevel 1 (echo ERROR: Dependency installation failed. & pause & exit /b 1)
echo [3/3] Starting TNT...
call npm.cmd start
if errorlevel 1 (echo ERROR: TNT stopped with an error. & pause)
