@echo off
chcp 65001
title 咸鱼运营 Agent 启动器

echo.
echo ═══════════════════════════════════════
echo       咸鱼运营 Agent 启动中...
echo ═══════════════════════════════════════
echo.

:: 检查 Node.js
echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未安装 Node.js
    echo 请先安装: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js 已安装
echo.

:: 检查 pnpm
echo [2/4] 检查 pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 pnpm...
    npm install -g pnpm
)
echo [OK] pnpm 已安装
echo.

:: 安装后端依赖
echo [3/4] 安装后端依赖...
cd server
call pnpm install
call pnpm add express cors dotenv
cd ..
echo.

:: 启动后端
echo [4/4] 启动后端服务...
start "后端服务" cmd /k "cd server && pnpm run dev"
echo [OK] 后端已启动 (http://localhost:9091)
echo.

:: 启动前端
echo 正在启动前端界面...
echo.
echo ═══════════════════════════════════════
echo       启动完成！
echo ═══════════════════════════════════════
echo.
echo 请用浏览器打开: http://localhost:8081
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:8081
