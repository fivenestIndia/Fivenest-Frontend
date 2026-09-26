@echo off
title FiveNest CorelDRAW Plugin Installer
color 0A
echo =====================================================================
echo           FIVENEST COREL TO STUDIO 1-CLICK EXPORTER INSTALLER
echo =====================================================================
echo.
echo Installing FiveNest Enterprise Plugin to CorelDRAW...
echo.

set FOUND=0
set TARGET_ROOT=%APPDATA%\Corel

if not exist "%TARGET_ROOT%" (
    echo [ERROR] CorelDRAW AppData directory not found: "%TARGET_ROOT%"
    echo Please make sure CorelDRAW has been run at least once on this computer.
    goto ManualInstall
)

echo Scanning for installed CorelDRAW versions...
for /D %%D in ("%TARGET_ROOT%\CorelDRAW Graphics Suite*") do (
    set FOUND=1
    echo Found: "%%~nxD"
    set ADDON_DIR=%%D\Draw\Addons
    if not exist "!ADDON_DIR!" mkdir "!ADDON_DIR!"
    
    echo Copying FiveNest Plugin to: "!ADDON_DIR!\4 Enterprise"...
    xcopy /E /I /Y "%~dp04 Enterprise" "!ADDON_DIR!\4 Enterprise" >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [OK] Successfully installed into %%~nxD!
    ) else (
        echo [WARNING] Failed to copy into %%~nxD. Try running as Administrator.
    )
)

if %FOUND% EQU 0 (
    echo [INFO] No standard CorelDRAW Graphics Suite folders found in AppData.
    goto ManualInstall
)

echo.
echo =====================================================================
echo [SUCCESS] FiveNest 1-Click CorelDRAW Plugin Installed!
echo.
echo HOW TO USE IN COREL DRAW:
echo 1. Open CorelDRAW.
echo 2. Go to: Window menu ^> Dockers ^> check "FN Enterprise"
echo 3. In the docker, click "🚀 EXPORT ^& SEND TO FIVENEST"
echo    - Exports all panels in 300 DPI RGB JPG
echo    - Creates pre-formatted ZIP package on your Desktop
echo    - Opens FiveNest Studio in your browser automatically!
echo =====================================================================
pause
exit /b

:ManualInstall
echo.
echo ---------------------------------------------------------------------
echo MANUAL INSTALLATION INSTRUCTIONS:
echo 1. Copy the folder "4 Enterprise" from this directory.
echo 2. Press Win + R, type: %%APPDATA%%\Corel and press Enter.
echo 3. Open your CorelDRAW Graphics Suite folder ^> Draw ^> Addons.
echo 4. Paste the "4 Enterprise" folder there.
echo 5. Open CorelDRAW ^> Window ^> Dockers ^> FN Enterprise.
echo ---------------------------------------------------------------------
pause
exit /b
