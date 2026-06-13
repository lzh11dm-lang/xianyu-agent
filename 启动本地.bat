# 本地启动脚本 - 双击即可运行

@echo off
echo ================================
echo   咸鱼运营 Agent 启动中...
echo ================================

echo.
echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未安装 Node.js
    echo 请先安装：https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js 已安装

echo.
echo [2/4] 检查 pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo 正在安装 pnpm...
    npm install -g pnpm
)
echo [OK] pnpm 已安装

echo.
echo [3/4] 安装依赖...
call pnpm install

echo.
echo [4/4] 启动服务...
echo ================================
echo.
echo 服务启动后：
echo - 后端 API: http://localhost:9091
echo - 前端界面: 打开 Expo Go 扫二维码
echo.
echo 按 Ctrl+C 停止服务
echo ================================
echo.

start cmd /k "cd server && pnpm run dev"
start cmd /k "cd client && npx expo start"

echo.
echo 服务已启动！
pause
