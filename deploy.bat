@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo   DANARI UNIVERSE - 3D Web + PWA One-Click Deploy
echo ========================================================
echo.

:: 1. Git Source Sync (main branch)
git status --short
echo.
set /p COMMIT_MSG="[1/3] Commit message (Press Enter for auto timestamp): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=update: %date% %time:~0,8%

echo.
echo [1/3] Saving source code to GitHub (main)...
git add .
git diff --cached --quiet
if %errorlevel% neq 0 (
    git commit -m "%COMMIT_MSG%"
) else (
    echo   - No source changes to commit.
)

git push origin main
if %errorlevel% neq 0 (
    echo [WARN] Failed to push main branch. Continuing deploy...
)

:: 2. Build & Deploy to GitHub Pages (index.html branch -> www.danari.net)
echo.
echo [2/3] Building 3D production bundle & deploying to www.danari.net...
call npm run deploy
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Deploy failed! Please check the error message above.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   [3/3] DEPLOY COMPLETE!
echo   URL: https://www.danari.net (updates in 1~2 min)
echo ========================================================
echo.
pause

