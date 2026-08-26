@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
echo TNT interface test mode - hardware and StriveX are disabled.
where node >nul 2>nul || (echo ERROR: Install Node.js LTS 22.x & pause & exit /b 1)
if not exist "node_modules\electron\cli.js" call npm.cmd install
if errorlevel 1 (echo ERROR: Dependency installation failed. & pause & exit /b 1)
set TNT_INTERFACE_TEST=true
call npm.cmd start
if errorlevel 1 (echo ERROR: Test mode stopped with an error. & pause)
