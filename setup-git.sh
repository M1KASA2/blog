#!/bin/bash
# ============================================================
#  setup-git.sh — 泰山派一键 Git 初始化配置脚本
#  将现有 ~/blog 目录转换为 git 仓库并完成首次部署
#
#  用法（泰山派上执行）:
#    curl -fsSL https://raw.githubusercontent.com/M1KASA2/blog/main/setup-git.sh | bash
# ============================================================

set -e

BLUE='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "\n${BLUE}━━━ $1 ${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ! $1${NC}"; }
fail() { echo -e "${RED}  ✗ 错误: $1${NC}"; exit 1; }

BLOG_DIR="$HOME/blog"
GITHUB_REPO="https://github.com/M1KASA2/blog.git"
DB_FILE="$BLOG_DIR/backend/blog.db"
DB_BACKUP="$HOME/blog.db.bak"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   博客 Git 初始化一键配置脚本        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"

# ── 检查目录 ────────────────────────────────────────────────
log "步骤 1/7：检查项目目录"
if [ ! -d "$BLOG_DIR" ]; then
    fail "未找到 $BLOG_DIR，请确认博客已上传到此路径"
fi
ok "目录存在：$BLOG_DIR"

# ── 备份数据库 ──────────────────────────────────────────────
log "步骤 2/7：备份数据库"
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$DB_BACKUP"
    ok "数据库已备份 → $DB_BACKUP"
else
    warn "未找到数据库文件，跳过备份（新环境无需备份）"
fi

# ── 初始化 Git ──────────────────────────────────────────────
log "步骤 3/7：初始化 Git 仓库"
cd "$BLOG_DIR"

if [ -d ".git" ]; then
    warn "已是 Git 仓库，跳过初始化"
else
    git init
    ok "Git 仓库初始化完成"
fi

# 设置远程仓库
if git remote | grep -q "^origin$"; then
    warn "远程 origin 已存在，跳过添加"
else
    git remote add origin "$GITHUB_REPO"
    ok "远程仓库已绑定: $GITHUB_REPO"
fi

# ── 拉取代码 ────────────────────────────────────────────────
log "步骤 4/7：从 GitHub 拉取最新代码"
git fetch origin main || fail "无法连接 GitHub，请检查网络"
git checkout -f origin/main
git branch -M main 2>/dev/null || true
git branch --set-upstream-to=origin/main main 2>/dev/null || true
ok "代码已同步到最新版本"

# ── 还原数据库 ──────────────────────────────────────────────
log "步骤 5/7：还原数据库"
if [ -f "$DB_BACKUP" ]; then
    cp "$DB_BACKUP" "$DB_FILE"
    ok "数据库已还原 → $DB_FILE"
else
    warn "无备份，跳过还原（新数据库将在后端首次启动时自动创建）"
fi

# ── 构建前端 ────────────────────────────────────────────────
log "步骤 6/7：安装依赖并构建前端"
cd "$BLOG_DIR/frontend"
npm install --silent || fail "npm install 失败"
npm run build || fail "前端构建失败"
ok "前端构建完成 → dist/"

# ── 重启后端 ────────────────────────────────────────────────
log "步骤 7/7：重启后端进程"
cd "$BLOG_DIR"
if pm2 list | grep -q "blog-backend"; then
    pm2 restart blog-backend
    ok "PM2 进程已重启"
else
    warn "未找到 PM2 进程 blog-backend，尝试启动..."
    pm2 start backend/server.js --name blog-backend
    pm2 save
    ok "PM2 进程已启动并保存"
fi

# ── 完成 ────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉  配置完成！                               ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║  访问: https://t1anjhonline.com               ║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║  以后更新只需运行:                             ║${NC}"
echo -e "${GREEN}║    bash ~/blog/deploy.sh                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
pm2 status blog-backend
