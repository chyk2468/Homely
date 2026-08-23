@echo off
title Society Maintenance Complaint Tracker
cd /d "%~dp0"

cls
echo =====================================================================
echo       SOCIETY MAINTENANCE COMPLAINT TRACKER - STARTUP
echo =====================================================================
echo.

:: ---------------------------------------------------------
:: 1. Check & Setup Backend Environment (.env)
:: ---------------------------------------------------------
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [*] Creating backend\.env from .env.example...
        copy "backend\.env.example" "backend\.env" >nul
    )
)

:: ---------------------------------------------------------
:: 2. Check Backend Virtual Environment & Dependencies
:: ---------------------------------------------------------
if not exist "backend\venv\Scripts\python.exe" (
    echo [*] Python virtual environment not found in backend\venv.
    echo [*] Creating virtual environment...
    python -m venv "backend\venv"
    if %errorlevel% neq 0 (
        echo [!] Failed to create Python virtual environment.
        echo [!] Please make sure Python 3.11+ is installed and added to PATH.
        pause
        exit /b 1
    )
    echo [*] Installing backend dependencies...
    "backend\venv\Scripts\pip" install -r "backend\requirements.txt"
    if %errorlevel% neq 0 (
        echo [!] Failed to install Python dependencies.
        pause
        exit /b 1
    )
)

:: ---------------------------------------------------------
:: 3. Check Frontend Dependencies (node_modules)
:: ---------------------------------------------------------
if not exist "frontend\node_modules" (
    echo [*] Frontend dependencies not found. Running npm install...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
    if %errorlevel% neq 0 (
        echo [!] Failed to install frontend npm packages.
        echo [!] Please ensure Node.js and npm are installed.
        pause
        exit /b 1
    )
)

:: ---------------------------------------------------------
:: 4. Start Backend Server (FastAPI / Uvicorn on Port 8000)
:: ---------------------------------------------------------
echo [*] Starting Backend Server (FastAPI on http://localhost:8000)...
start "Complaint Tracker - Backend" cmd /k "cd /d ""%~dp0backend"" && call ""venv\Scripts\activate.bat"" && title Backend (FastAPI :8000) && uvicorn app.main:app --reload --port 8000"

:: ---------------------------------------------------------
:: 5. Start Frontend Server (Vite / React on Port 5173)
:: ---------------------------------------------------------
echo [*] Starting Frontend Server (Vite on http://localhost:5173)...
start "Complaint Tracker - Frontend" cmd /k "cd /d ""%~dp0frontend"" && title Frontend (Vite :5173) && npm run dev"

:: ---------------------------------------------------------
:: 6. Launch Browser & Display Summary
:: ---------------------------------------------------------
echo.
echo [*] Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo [*] Opening application in your default web browser...
start http://localhost:5173

cls
echo =====================================================================
echo       SOCIETY MAINTENANCE COMPLAINT TRACKER IS RUNNING!
echo =====================================================================
echo.
echo   Application URLs:
echo   - Frontend Portal:    http://localhost:5173
echo   - Backend API Docs:   http://localhost:8000/docs
echo.
echo   Demo Login Credentials:
echo   -------------------------------------------------------------------
echo   Role             Email                   Password
echo   -------------------------------------------------------------------
echo   Society Admin    admin@society.com       admin123
echo   Resident 1       resident@society.com    resident123
echo   Resident 2       priya@society.com       resident123
echo   -------------------------------------------------------------------
echo   (Tip: You can also use the 1-Click Instant Demo Login on the screen)
echo.
echo =====================================================================
echo   To stop all servers, run stop.bat or close the opened terminal windows.
echo =====================================================================
echo.
pause
