#!/bin/bash
# One-time setup for WSL Ubuntu
# Run: wsl -d Ubuntu bash -c "cd ~/supreme-court-explorer && bash setup-wsl.sh"

set -e
cd ~/supreme-court-explorer

echo "=== Installing prerequisites in WSL Ubuntu ==="

# Update
sudo apt-get update

# Python and pip
sudo apt-get install -y python3 python3-pip python3-venv

# Node.js 20
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Docker (if Docker Desktop not used)
if ! command -v docker &>/dev/null; then
    echo "Docker: Install Docker Desktop for Windows (recommended), or:"
    echo "  sudo apt install docker.io docker-compose-v2"
    echo "  sudo usermod -aG docker \$USER"
fi

# Ollama - user install
if ! command -v ollama &>/dev/null; then
    echo "Ollama: Install from https://ollama.ai (or: curl -fsSL https://ollama.ai/install.sh | sh)"
fi

echo ""
echo "Setup complete. Next:"
echo "  1. Ensure Docker Desktop is running (or Postgres is available)"
echo "  2. ollama pull nomic-embed-text && ollama pull llama3"
echo "  3. bash run-wsl.sh"
