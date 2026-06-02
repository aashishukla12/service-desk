# ServiceDesk Docker Automated Setup Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

# Clear screen and display ASCII art
Clear-Host
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "      ServiceDesk Automated Docker Setup & Launch" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host ""

# 1. Verify Docker is running
Write-Host "🔍 Step 1: Checking Docker installation and status..." -ForegroundColor White
try {
    $dockerInfo = & docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker daemon is not running."
    }
    Write-Host "✅ Docker is installed and running." -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is either not installed or not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Exit 1
}
Write-Host ""

# 2. Check for port conflicts and resolve them
Write-Host "🔍 Step 2: Checking port availability..." -ForegroundColor White
$ports = @{
    3000 = "Next.js Application Server"
    5433 = "PostgreSQL Database Server"
}

foreach ($port in $ports.Keys) {
    $owningProcessId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($owningProcessId) {
        $processName = (Get-Process -Id $owningProcessId -ErrorAction SilentlyContinue).ProcessName
        Write-Host "⚠️ Port $port ($($ports[$port])) is occupied by '$processName' (PID: $owningProcessId)." -ForegroundColor Yellow
        
        # Propose stopping the process
        $response = Read-Host "Would you like this script to terminate process '$processName' (PID: $owningProcessId) to free port $port? (y/n)"
        if ($response -eq 'y' -or $response -eq 'yes') {
            try {
                Stop-Process -Id $owningProcessId -Force
                Start-Sleep -Seconds 2
                Write-Host "✅ Process terminated and port $port is now free." -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to terminate process. Please stop process '$processName' manually to free up port $port." -ForegroundColor Red
                Exit 1
            }
        } else {
            Write-Host "❌ Port $port is occupied. Cannot proceed with Docker Compose. Exiting." -ForegroundColor Red
            Exit 1
        }
    } else {
        Write-Host "✅ Port $port ($($ports[$port])) is free." -ForegroundColor Green
    }
}
Write-Host ""

# 3. Handle Environment File
Write-Host "🔍 Step 3: Verifying environment configuration..." -ForegroundColor White
if (-not (Test-Path ".env")) {
    Write-Host "📝 Local .env file not found. Creating from .env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created." -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists." -ForegroundColor Green
}
Write-Host ""

# 4. Spin up Docker containers
Write-Host "🚀 Step 4: Building and spinning up Docker containers..." -ForegroundColor White
Write-Host "Executing: docker compose up -d --build" -ForegroundColor Gray
& docker compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Docker Compose failed to build or start the containers." -ForegroundColor Red
    Exit 1
}
Write-Host "✅ Docker containers started." -ForegroundColor Green
Write-Host ""

# 5. Wait for the application to be online
Write-Host "⏳ Step 5: Waiting for application to launch and initialize..." -ForegroundColor White
$url = "http://localhost:3000"
$maxRetries = 24
$retryIntervalSec = 5
$isOnline = $false

for ($i = 1; $i -le $maxRetries; $i++) {
    Write-Host "  Checking application status (Attempt $i/$maxRetries)..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$url/sign-in" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 302) {
            $isOnline = $true
            break
        }
    } catch {
        # Silent ignore, database or app is still warming up
    }
    Start-Sleep -Seconds $retryIntervalSec
}

if ($isOnline) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! ServiceDesk is fully operational in Docker." -ForegroundColor Green
    Write-Host "----------------------------------------------------------" -ForegroundColor Magenta
    Write-Host "  Access URL:  $url" -ForegroundColor Cyan
    Write-Host "  Admin Login: admin@servicedesk.com / admin123" -ForegroundColor Cyan
    Write-Host "----------------------------------------------------------" -ForegroundColor Magenta
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    [void][System.Console]::ReadKey($true)
} else {
    Write-Host "⚠️ Warning: The application server did not respond within the expected time." -ForegroundColor Yellow
    Write-Host "Please check container logs for detailed errors using:" -ForegroundColor Gray
    Write-Host "  docker compose logs -f app" -ForegroundColor White
    Exit 1
}
