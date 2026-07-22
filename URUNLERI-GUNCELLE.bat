@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\access-to-products.ps1"
if errorlevel 1 (
  echo.
  echo Donusturme basarisiz oldu. Access dosyasini kapatip tekrar deneyin.
  pause
  exit /b 1
)
echo.
echo products.js basariyla guncellendi.
pause
