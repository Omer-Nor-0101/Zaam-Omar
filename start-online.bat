@echo off
cd /d "%~dp0server"

if not exist node_modules call npm install

if not exist .env (
  copy .env.example .env >nul
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-env.ps1"
  echo.
  echo Waa la abuuray server\.env. Hadda ku qor DB_USER iyo DB_PASSWORD, keydi, xir, kadibna mar kale orod start-online.bat
  notepad .env
  pause
  exit /b
)

where cloudflared >nul 2>nul
if errorlevel 1 goto install_cf
goto run

:install_cf
echo Waxaan rarayaa cloudflared...
winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements
echo.
echo La rari karo. Xir daaqadan, kadibna mar kale orod start-online.bat
pause
exit /b

:run
start "Forever Us server" cmd /k npm start
timeout /t 8 >nul
echo.
echo Hoos ka raadi link ka bilaabma https://  oo ku dhammaada trycloudflare.com - kaas u dir qofkaaga.
echo.
cloudflared tunnel --url http://localhost:3000
