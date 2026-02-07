@echo off
setlocal enabledelayedexpansion

echo.
echo ============================================================
echo TapTap Repack Tool for Windows
echo ============================================================
echo.

set "BAT_DIR=%~dp0"
set "GAME_DIR=%BAT_DIR%game"

if exist "%GAME_DIR%" (
    echo [OK] Found game folder: %GAME_DIR%
    set "USE_DIR=%GAME_DIR%"
    goto start_pack
) else (
    echo [INFO] game folder not found in current directory
    echo.
    goto ask_path
)

:ask_path
echo Please enter the full path to game folder:
echo TIP: You can drag and drop the game folder here
echo.
set /p "USER_INPUT=Enter path: "

set "USER_INPUT=%USER_INPUT:"=%"

if "%USER_INPUT%"=="" (
    echo.
    echo [ERROR] Path cannot be empty
    goto error_exit
)

if not exist "%USER_INPUT%" (
    echo.
    echo [ERROR] Path does not exist: %USER_INPUT%
    goto error_exit
)

if not exist "%USER_INPUT%\*" (
    echo.
    echo [ERROR] Path is not a folder: %USER_INPUT%
    goto error_exit
)

set "USE_DIR=%USER_INPUT%"
echo.
echo [OK] Using directory: %USE_DIR%
echo.

:start_pack
echo [CHECK] Validating game folder...

if not exist "%USE_DIR%\game.js" (
    echo [WARN] game.js not found
)

if not exist "%USE_DIR%\game.json" (
    echo [WARN] game.json not found
)

echo [OK] Game folder validated
echo.

for %%F in ("%USE_DIR%") do set "PARENT_DIR=%%~dpF"
set "OUTPUT_ZIP=%PARENT_DIR%game.zip"

if exist "%OUTPUT_ZIP%" (
    echo [INFO] Deleting old game.zip...
    del /f /q "%OUTPUT_ZIP%"
)

echo ============================================================
echo Starting repack...
echo ============================================================
echo.
echo Source: %USE_DIR%
echo Output: %OUTPUT_ZIP%
echo.

echo [INFO] Creating ZIP package...
echo [INFO] This may take a while, please wait...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $ProgressPreference = 'SilentlyContinue'; $sourceDir = '%USE_DIR%'; $destZip = '%OUTPUT_ZIP%'; if (Test-Path $destZip) { Remove-Item $destZip -Force }; $files = Get-ChildItem -Path $sourceDir -Recurse -File; $totalFiles = $files.Count; Write-Host '[INFO] Total files:' $totalFiles; Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open($destZip, 'Create'); $count = 0; foreach ($file in $files) { $relativePath = $file.FullName.Substring($sourceDir.Length + 1).Replace('\', '/'); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath, 'Optimal') | Out-Null; $count++; if ($count %% 100 -eq 0) { Write-Host '  Progress:' $count '/' $totalFiles 'files' } }; $zip.Dispose(); $zipSize = (Get-Item $destZip).Length / 1MB; Write-Host ''; Write-Host '[SUCCESS] ZIP created:' ([math]::Round($zipSize, 2)) 'MB' }"

if errorlevel 1 (
    echo.
    echo ============================================================
    echo [ERROR] Repack failed
    echo ============================================================
    goto error_exit
)

echo.
echo ============================================================
echo [SUCCESS] Repack completed
echo ============================================================
echo.
echo Output: %OUTPUT_ZIP%
echo game.zip is ready to upload to TapTap
echo.
goto normal_exit

:error_exit
echo.
echo Press any key to exit...
pause >nul
exit /b 1

:normal_exit
echo Press any key to exit...
pause >nul
exit /b 0
