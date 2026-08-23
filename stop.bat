@echo off
title Stop Society Maintenance Complaint Tracker
cd /d "%~dp0"

echo =====================================================================
echo       STOPPING SOCIETY MAINTENANCE COMPLAINT TRACKER
echo =====================================================================
echo.

echo [*] Terminating backend (port 8000) and frontend (port 5173) processes...

powershell -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
powershell -Command "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [OK] Backend and Frontend servers have been stopped.
echo.
pause
