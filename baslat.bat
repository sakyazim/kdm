@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================================
echo  Kutuphane Icerik Yonetimi - Lokal Sunucu
echo  Arayuz:  http://127.0.0.1:8123/manager/
echo  Onizleme: http://127.0.0.1:8123/
echo ------------------------------------------------------------
echo  Kapatmak icin bu pencereyi kapatmaniz yeterli.
echo  (Sunucu zaten calisiyorsa pencere kendiliginden kapanir,
echo   tarayici mevcut sunucuya acilir.)
echo ============================================================
echo.

start "" /b python manager/server.py
timeout /t 3 /nobreak >nul
start "" http://127.0.0.1:8123/manager/
