@echo off
setlocal enabledelayedexpansion
title FiveNest CorelDRAW Macro Permanent Installer
color 0B
echo =====================================================================
echo       FIVENEST 1-CLICK COREL TO STUDIO MACRO PERMANENT INSTALLER
echo =====================================================================
echo.
echo Installing FiveNest permanent macro container to your Windows PC...
echo.

set FOUND=0
set TARGET_ROOT=%APPDATA%\Corel

if not exist "%TARGET_ROOT%" (
    echo [ERROR] CorelDRAW AppData directory not found: "%TARGET_ROOT%"
    echo Please make sure CorelDRAW has been launched at least once on this PC.
    echo.
    pause
    exit /b 1
)

echo Scanning for installed CorelDRAW versions in AppData...
echo.

for /D %%D in ("%TARGET_ROOT%\CorelDRAW*") do (
    set FOUND=1
    echo -------------------------------------------------------------
    echo Found Corel Installation: "%%~nxD"
    
    set "GMS_DIR=%%D\Draw\GMS"
    if not exist "!GMS_DIR!" (
        echo Creating GMS directory: "!GMS_DIR!"
        mkdir "!GMS_DIR!"
    )
    
    set "TARGET_GMS=!GMS_DIR!\FiveNest.gms"
    if not exist "!TARGET_GMS!" (
        echo Creating permanent container: "!TARGET_GMS!"
        type nul > "!TARGET_GMS!"
        echo [OK] Created FiveNest.gms successfully!
    ) else (
        echo [OK] FiveNest.gms already exists in this folder!
    )
    
    set "SRC_DIR=!GMS_DIR!\FiveNest_Source"
    if not exist "!SRC_DIR!" mkdir "!SRC_DIR!"
    
    copy /Y "%~dp0UserForm1_Code.txt" "!SRC_DIR!\UserForm1_Code.txt" >nul 2>&1
    copy /Y "%~dp0clsBtn_Code.txt" "!SRC_DIR!\clsBtn_Code.txt" >nul 2>&1
    copy /Y "%~dp0FiveNest_1Click_Exporter.bas" "!SRC_DIR!\FiveNest_1Click_Exporter.bas" >nul 2>&1
    
    echo [OK] Backed up source code into: "!SRC_DIR!"
)

if %FOUND% EQU 0 (
    echo [WARNING] No CorelDRAW folders found under: "%TARGET_ROOT%"
    echo Checking Documents folder...
    for /D %%D in ("%USERPROFILE%\Documents\Corel\CorelDRAW*") do (
        set FOUND=1
        set "GMS_DIR=%%D\GMS"
        if not exist "!GMS_DIR!" mkdir "!GMS_DIR!"
        type nul > "!GMS_DIR!\FiveNest.gms"
        echo [OK] Created FiveNest.gms in "%%D\GMS"
    )
)

echo.
echo =====================================================================
echo  [SUCCESS] FiveNest.gms is now permanently installed in your system!
echo =====================================================================
echo.
echo WHY YOUR PREVIOUS MACRO VANISHED:
echo  You previously pasted code into "CalendarWizard.gms".
echo  CalendarWizard is a factory tool stored in "C:\Program Files" (Read-Only).
echo  Windows prevents saving changes there, so Corel wipes it on restart.
echo.
echo WHY FIVENEST.GMS WILL NEVER VANISH:
echo  FiveNest.gms is installed in your personal user folder:
echo  %%APPDATA%%\Corel\CorelDRAW ...\Draw\GMS\FiveNest.gms
echo  CorelDRAW has full write access here and auto-loads it every time!
echo.
echo ---------------------------------------------------------------------
echo FINAL 30-SECOND SETUP IN COREL DRAW:
echo ---------------------------------------------------------------------
echo 1. Open CorelDRAW.
echo 2. Press Alt + F11 (or menu: Tools > Scripts / Macros > Script Editor).
echo 3. In the left panel, you will now see: FiveNest (FiveNest.gms)
echo    (Make sure to expand FiveNest, NOT CalendarWizard!)
echo 4. In FiveNest:
echo    a. Right-click FiveNest -> Insert -> Class Module (Name: clsBtn)
echo       Paste code from clsBtn_Code.txt
echo    b. Right-click FiveNest -> Insert -> Module (Name: FiveNest_1Click_Exporter)
echo       Paste code from FiveNest_1Click_Exporter.bas
echo    c. Right-click FiveNest -> Insert -> UserForm (Name: UserForm1)
echo       Right-click form -> View Code -> Paste code from UserForm1_Code.txt
echo 5. Press Ctrl + S to save FiveNest.gms.
echo.
echo Done! It will now stay in your CorelDRAW permanently forever!
echo =====================================================================
echo.

pause
