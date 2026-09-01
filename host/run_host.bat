@echo off
title WebRTC Windows Remote Desktop Host - CAD Streamer
color 0A

echo =========================================================================
echo  WebRTC Windows Desktop Capture Host for iPhone Safari/Chrome Client
echo =========================================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/
    pause
    exit /b
)

:: Check if virtual environment exists
if not exist "venv" (
    echo [1/3] Creating Python Virtual Environment (venv)...
    python -m venv venv
)

echo [2/3] Activating Virtual Environment and Installing Dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --upgrade

echo.
echo [3/3] Starting Windows Desktop Host Streamer...
echo -------------------------------------------------------------------------
echo Tip: If using Tailscale, pass your Tailscale IP or signaling URL:
echo      python windows_host.py --signaling http://100.x.y.z:3000 --fps 30
echo -------------------------------------------------------------------------
echo.

python windows_host.py --signaling http://localhost:3000 --fps 30 --mode ws

pause
