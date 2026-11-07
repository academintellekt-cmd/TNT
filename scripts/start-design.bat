@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
where node >nul 2>nul || (echo ERROR: Install Node.js LTS 22.x & pause & exit /b 1)
if not exist "node_modules\electron\cli.js" call npm.cmd install
if errorlevel 1 (echo ERROR: Dependency installation failed. & pause & exit /b 1)
call npm.cmd run design
if errorlevel 1 (echo ERROR: Design mode stopped with an error. & pause)
