# ============================================================
#  deploy.ps1  —  博客一键部署脚本 (Windows → 泰山派)
#  用法: 在 blog 目录下执行  .\deploy.ps1
# ============================================================

# ── 配置区（根据实际情况修改） ───────────────────────────────
$PI_HOST   = "你的泰山派IP"          # 例如 192.168.1.100 或 SSH别名
$PI_USER   = "你的用户名"            # 例如 ubuntu / pi
$PI_DIR    = "~/blog"               # 泰山派上的项目目录
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

function Log($msg) {
    Write-Host ""
    Write-Host "► $msg" -ForegroundColor Cyan
}

function OK($msg) {
    Write-Host "✓ $msg" -ForegroundColor Green
}

function Fail($msg) {
    Write-Host "✗ $msg" -ForegroundColor Red
    exit 1
}

Log "第 1 步：提交并推送代码到 GitHub..."
Set-Location $PSScriptRoot

$status = git status --porcelain
if ($status) {
    $commitMsg = Read-Host "  检测到未提交改动，请输入提交信息（直接回车使用默认）"
    if (-not $commitMsg) { $commitMsg = "chore: update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }
    git add -A
    git commit -m $commitMsg
}

git push origin main
if ($LASTEXITCODE -ne 0) { Fail "git push 失败，请检查网络或仓库权限" }
OK "代码已推送到 GitHub"

Log "第 2 步：SSH 连接泰山派，拉取并重新构建..."

$remoteScript = @"
set -e
echo '--- 拉取最新代码 ---'
cd $PI_DIR
git pull origin main

echo '--- 构建前端 ---'
cd frontend
npm run build
cd ..

echo '--- 重启后端进程 ---'
pm2 restart blog-backend

echo '--- 完成！---'
pm2 status blog-backend
"@

ssh "${PI_USER}@${PI_HOST}" $remoteScript
if ($LASTEXITCODE -ne 0) { Fail "远程部署失败，请检查 SSH 连接或泰山派日志" }

Write-Host ""
OK "============================================"
OK " 部署完成！访问 https://t1anjhonline.com 查看"
OK "============================================"
