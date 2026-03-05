@echo off
setlocal
title ClaimSwift Launcher

set "ROOT=%~dp0"
set "MAVEN_HOME=C:\Users\shashank.nath\tools\apache-maven-3.9.12\apache-maven-3.9.12"
set "PATH=%MAVEN_HOME%\bin;%PATH%"

if not exist "%ROOT%pom.xml" (
  echo [ERROR] Run this script from project root: %ROOT%
  pause
  exit /b 1
)

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo [ERROR] MAVEN_HOME not found:
  echo         %MAVEN_HOME%
  echo Update MAVEN_HOME inside start-whole-project.cmd
  pause
  exit /b 1
)

where mvn >nul 2>nul
if errorlevel 1 (
  echo [ERROR] mvn not found in PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found in PATH. Install Node.js and reopen terminal.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   ClaimSwift - Starting Full Stack (CMD windows)
echo ============================================================
echo Root      : %ROOT%
echo MAVEN_HOME: %MAVEN_HOME%
echo.

echo [1/11] Starting config-server...
start "claimswift-config-server" cmd /k "cd /d ""%ROOT%config-server"" && mvn spring-boot:run"
timeout /t 12 /nobreak >nul

echo [2/11] Starting eureka-server...
start "claimswift-eureka-server" cmd /k "cd /d ""%ROOT%eureka-server"" && mvn spring-boot:run"
timeout /t 12 /nobreak >nul

echo [3/11] Starting auth-service...
start "claimswift-auth-service" cmd /k "cd /d ""%ROOT%auth-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [4/11] Starting claim-service...
start "claimswift-claim-service" cmd /k "cd /d ""%ROOT%claim-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [5/11] Starting document-service...
start "claimswift-document-service" cmd /k "cd /d ""%ROOT%document-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [6/11] Starting assessment-service...
start "claimswift-assessment-service" cmd /k "cd /d ""%ROOT%assessment-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [7/11] Starting payment-service...
start "claimswift-payment-service" cmd /k "cd /d ""%ROOT%payment-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [8/11] Starting notification-service...
start "claimswift-notification-service" cmd /k "cd /d ""%ROOT%notification-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [9/11] Starting reporting-service...
start "claimswift-reporting-service" cmd /k "cd /d ""%ROOT%reporting-service"" && mvn spring-boot:run"
timeout /t 5 /nobreak >nul

echo [10/11] Starting api-gateway...
start "claimswift-api-gateway" cmd /k "cd /d ""%ROOT%api-gateway"" && mvn spring-boot:run"
timeout /t 8 /nobreak >nul

echo [11/11] Starting frontend-angular...
start "claimswift-frontend-angular" cmd /k "cd /d ""%ROOT%frontend-angular"" && npm start"

echo.
echo ============================================================
echo Startup commands launched.
echo.
echo Verify:
echo   Eureka   : http://localhost:8761
echo   Gateway  : http://localhost:8080/actuator/health
echo   Frontend : http://localhost:4200
echo ============================================================
echo.
pause
