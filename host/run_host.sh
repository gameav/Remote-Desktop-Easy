#!/usr/bin/env bash
# =============================================================================
# WebRTC Low-Latency Remote Desktop Host Runner for macOS & Linux
# =============================================================================
set -e

echo "======================================================================"
echo " 🖥️ WebRTC Cross-Platform Desktop Streamer (macOS / Linux / Windows)"
echo "======================================================================"

# Determine operating system
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    OS_NAME="macOS";;
    Linux*)     OS_NAME="Linux";;
    *)          OS_NAME="Unknown";;
esac
echo "Detected Operating System: ${OS_NAME} ($(uname -m))"

# Check Python 3 installation
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 was not found. Please install Python 3.10+ from python.org or via brew/apt."
    exit 1
fi

PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "Using Python version: ${PY_VERSION}"

# macOS Permission Guidance
if [ "${OS_NAME}" = "macOS" ]; then
    echo ""
    echo "📋 macOS Security Notice:"
    echo "  Ensure your Terminal (or iTerm2) has permissions granted in:"
    echo "  1. System Settings -> Privacy & Security -> Screen Recording"
    echo "  2. System Settings -> Privacy & Security -> Accessibility"
    echo ""
fi

# Setup Virtual Environment if not present
if [ ! -d "venv" ]; then
    echo "[*] Creating isolated Python virtual environment (venv)..."
    python3 -m venv venv
fi

# Activate Virtual Environment
echo "[*] Activating virtual environment..."
source venv/bin/activate

# Upgrade pip and install requirements
echo "[*] Verifying & installing dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

# Launch Host Streamer
echo ""
echo "🚀 Starting WebRTC Host Streamer..."
echo "Press Ctrl+C at any time to stop."
echo "======================================================================"

python3 windows_host.py --signaling http://localhost:3000 --fps 60 --backend auto "$@"
