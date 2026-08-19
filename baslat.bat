@echo off
chcp 65001 >nul
cd /d "%~dp0"

set PORT=8123
set URL=http://127.0.0.1:%PORT%

echo ============================================================
echo  Kutuphane Icerik Yonetimi v2 - Lokal Sunucu
echo  Arayuz:   %URL%/manager/
echo  Onizleme: %URL%/
echo ------------------------------------------------------------
echo  Kapatmak icin bu pencereyi kapatmaniz yeterli.
echo  Sunucu zaten calisiyorsa mevcut sunucuya acilir.
echo ============================================================
echo.

rem Sunucu zaten calisiyor mu? (tek kopya garantisi)
netstat -ano | findstr ":8123" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 goto open

echo  Sunucu baslatiliyor (port %PORT%)...
start "" /b cmd /c "set MANAGER_PORT=8123&& python manager/server.py"
timeout /t 3 /nobreak >nul

:open
start "" %URL%/manager/
