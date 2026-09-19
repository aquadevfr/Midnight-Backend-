@echo off
title Better Reload

if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies. Please check your internet connection or npm installation.
        pause
        exit
    )
)

:start
node index.js
if %errorlevel% equ 1 (
    echo Backend stopped manually.
    pause
    exit
)
echo Restarting backend...
goto start
