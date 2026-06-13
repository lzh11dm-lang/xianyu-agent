@echo off
chcp 65001 >nul
echo ========================================
echo 咸鱼运营 Agent 启动中...
echo ========================================

echo.
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
echo ========================================

echo.
echo 正在启动后端服务 (端口 9091)...
start "后端服务" cmd /k "cd server && pnpm run dev"

echo.
echo 正在启动前端服务 (端口 8081)...
start "前端服务" cmd /k "cd client && npx expo start --web"

echo.
echo ========================================
echo 启动完成！
echo.
echo 请在浏览器中打开: http://localhost:8081
echo.
echo 按任意键关闭此窗口...
echo ========================================
pause >nul
