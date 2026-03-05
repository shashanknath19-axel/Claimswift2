@echo off
setlocal
title ClaimSwift Stopper

echo.
echo ============================================================
echo   ClaimSwift - Stopping Full Stack
echo ============================================================
echo.

call :stopWindow "claimswift-config-server"
call :stopWindow "claimswift-eureka-server"
call :stopWindow "claimswift-auth-service"
call :stopWindow "claimswift-claim-service"
call :stopWindow "claimswift-document-service"
call :stopWindow "claimswift-assessment-service"
call :stopWindow "claimswift-payment-service"
call :stopWindow "claimswift-notification-service"
call :stopWindow "claimswift-reporting-service"
call :stopWindow "claimswift-api-gateway"
call :stopWindow "claimswift-frontend-angular"

echo.
echo Stop command completed.
echo ============================================================
echo.
pause
exit /b 0

:stopWindow
set "WTITLE=%~1"
tasklist /v /fi "imagename eq cmd.exe" /fi "windowtitle eq %WTITLE%" | find /i "%WTITLE%" >nul
if errorlevel 1 (
  echo [INFO] Not running: %WTITLE%
) else (
  echo [STOP] %WTITLE%
  taskkill /f /t /fi "imagename eq cmd.exe" /fi "windowtitle eq %WTITLE%" >nul 2>nul
)
exit /b 0

