#!/bin/bash
set -e

# ANSI escape codes for colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

clear
echo -e "${CYAN}==========================================================${NC}"
echo -e "${WHITE}      ServiceDesk Automated Docker Setup & Launch${NC}"
echo -e "${CYAN}==========================================================${NC}"
echo ""

# 1. Verify Docker is running
echo -e "${WHITE}🔍 Step 1: Checking Docker installation and status...${NC}"
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is either not installed or not running.${NC}"
    echo -e "${YELLOW}Please start Docker and run this script again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed and running.${NC}"
echo ""

# 2. Check for port conflicts
echo -e "${WHITE}🔍 Step 2: Checking port availability...${NC}"
check_port() {
    local port=$1
    local name=$2
    
    # Try finding process using lsof or netstat
    local pid=""
    if command -v lsof >/dev/null 2>&1; then
        pid=$(lsof -t -i:$port || true)
    elif command -v netstat >/dev/null 2>&1; then
        pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 || true)
    fi

    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️ Port $port ($name) is occupied by process PID $pid.${NC}"
        read -p "Would you like this script to terminate process PID $pid to free port $port? (y/n): " choice
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            kill -9 $pid
            sleep 2
            echo -e "${GREEN}✅ Process terminated and port $port is now free.${NC}"
        else
            echo -e "${RED}❌ Port $port is occupied. Cannot proceed with Docker Compose. Exiting.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Port $port ($name) is free.${NC}"
    fi
}

check_port 3000 "Next.js Application Server"
check_port 5433 "PostgreSQL Database Server"
echo ""

# 3. Handle Environment File
echo -e "${WHITE}🔍 Step 3: Verifying environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${CYAN}📝 Local .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created.${NC}"
else
    echo -e "${GREEN}✅ .env file already exists.${NC}"
fi
echo ""

# 4. Spin up Docker containers
echo -e "${WHITE}🚀 Step 4: Building and spinning up Docker containers...${NC}"
echo "Executing: docker compose up -d --build"
docker compose up -d --build
echo -e "${GREEN}✅ Docker containers started.${NC}"
echo ""

# 5. Wait for the application to be online
echo -e "${WHITE}⏳ Step 5: Waiting for application to launch and initialize...${NC}"
url="http://localhost:3000"
max_retries=24
retry_interval=5
is_online=false

for ((i=1; i<=$max_retries; i++)); do
    echo -e "  Checking application status (Attempt $i/$max_retries)..."
    if curl -s -o /dev/null -w "%{http_code}" "$url/sign-in" | grep -qE "200|302"; then
        is_online=true
        break
    fi
    sleep $retry_interval
done

if [ "$is_online" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! ServiceDesk is fully operational in Docker.${NC}"
    echo -e "${CYAN}----------------------------------------------------------${NC}"
    echo -e "  Access URL:  $url"
    echo -e "  Admin Login: admin@servicedesk.com / admin123"
    echo -e "${CYAN}----------------------------------------------------------${NC}"
else
    echo -e "${YELLOW}⚠️ Warning: The application server did not respond within the expected time.${NC}"
    echo -e "Please check container logs for detailed errors using:"
    echo -e "  docker compose logs -f app"
    exit 1
fi
