@echo off
title Midnight Backend

if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo use npm i.
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
echo Restarting Midnight
goto start
