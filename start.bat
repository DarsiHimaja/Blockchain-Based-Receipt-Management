@echo off
TITLE Blockchain Digital Receipt System Launcher
echo ==============================================================
echo    Starting Blockchain Digital Receipt & Purchase History System
echo ==============================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Hardhat Local Ethereum Node...
start "Hardhat Node (Port 8545)" cmd /k "title Hardhat Node (Port 8545) && npx hardhat node"

echo Waiting for Ethereum RPC node to start up...
timeout /t 6 /nobreak >nul

echo.
echo [2/3] Deploying Smart Contract and Seeding Demo Receipts...
call npx hardhat run scripts/deploy.js --network localhost
call npx hardhat run scripts/seed.js --network localhost

echo.
echo [3/3] Starting Frontend React Application...
start "Frontend Web Server (Port 3000)" cmd /k "title Frontend Web Server (Port 3000) && cd frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo.
echo ==============================================================
echo  PROJECT IS SUCCESSFULLY RUNNING!
echo  -------------------------------------------------------------
echo  1. Localhost Web App:   http://localhost:3000
echo  2. Blockchain RPC Node: http://127.0.0.1:8545 (Chain 31337)
echo.
echo  Keep the opened terminal windows running!
echo ==============================================================
pause
