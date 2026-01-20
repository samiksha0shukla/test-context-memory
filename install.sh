#!/bin/bash

# ContextMemory Installation Script
# This script sets up both backend and frontend

set -e  # Exit on error

echo "🚀 ContextMemory Setup"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}❌ Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python $(python3 --version)${NC}"
echo -e "${GREEN}✅ Node $(node --version)${NC}"
echo ""

# Backend Setup
echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Frontend Setup
cd ../web
echo -e "${BLUE}📦 Setting up Frontend...${NC}"

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
fi

echo "Installing Node dependencies (this may take a few minutes)..."
npm install

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo "To start the application:"
echo ""
echo -e "${BLUE}Terminal 1 (Backend):${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python -m uvicorn main:app --reload"
echo ""
echo -e "${BLUE}Terminal 2 (Frontend):${NC}"
echo "  cd web"
echo "  npm run dev"
echo ""
echo -e "Then visit: ${GREEN}http://localhost:3000${NC}"
echo ""
echo "📚 Read SETUP.md for more information"
