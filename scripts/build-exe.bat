@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0.."
call npm.cmd install || exit /b 1
call npm.cmd run check || exit /b 1
call npm.cmd run build
if errorlevel 1 pause
