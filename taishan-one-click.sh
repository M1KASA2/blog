#!/bin/bash
# ============================================================
#  taishan-one-click.sh — 泰山派一键修复、部署、映射公网
#  用法：
#    bash ~/blog/taishan-one-click.sh
#
#  可选：
#    WITH_TUNNEL=0 bash ~/blog/taishan-one-click.sh   # 只部署，不配置 Cloudflare Tunnel
# ============================================================

set -euo pipefail

BRANCH="${BRANCH:-main}"
WITH_TUNNEL="${WITH_TUNNEL:-1}"
BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$HOME/blog-backup-$(date +%Y%m%d-%H%M%S)"

DB_FILE="$BLOG_DIR/backend/blog.sqlite"
UPLOADS_DIR="$BLOG_DIR/backend/uploads"

BLUE='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "\n${BLUE}► $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}! $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

copy_dir_contents() {
    local from="$1"
    local to="$2"

    if [ ! -d "$from" ]; then
        return 0
    fi

    mkdir -p "$to"
    cp -a "$from/." "$to/"
}

log "项目目录：$BLOG_DIR"
cd "$BLOG_DIR"

log "步骤 1/7：备份数据库和上传图片"
mkdir -p "$BACKUP_DIR"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/blog.sqlite"
    ok "数据库已备份：$BACKUP_DIR/blog.sqlite"
else
    warn "未找到数据库，跳过数据库备份"
fi

if [ -d "$UPLOADS_DIR" ]; then
    copy_dir_contents "$UPLOADS_DIR" "$BACKUP_DIR/uploads"
    ok "上传图片已备份：$BACKUP_DIR/uploads"
else
    warn "未找到上传目录，跳过图片备份"
fi

log "步骤 2/7：检查 Git 仓库"
if [ ! -d ".git" ]; then
    fail "当前目录不是 Git 仓库，请确认脚本位于 ~/blog"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    fail "未找到 Git remote origin，请先绑定 GitHub 仓库"
fi

log "步骤 3/7：强制同步 GitHub 最新代码"
git fetch origin "$BRANCH" || fail "git fetch 失败"
git checkout -f "origin/$BRANCH" || fail "切换到 origin/$BRANCH 失败"
git switch -C "$BRANCH" >/dev/null 2>&1 || git checkout -B "$BRANCH"
git reset --hard "origin/$BRANCH" || fail "git reset 失败"
ok "代码已同步到 origin/$BRANCH"

log "步骤 4/7：还原数据库和上传图片"
mkdir -p "$BLOG_DIR/backend"

if [ -f "$BACKUP_DIR/blog.sqlite" ]; then
    cp "$BACKUP_DIR/blog.sqlite" "$DB_FILE"
    ok "数据库已还原"
else
    warn "没有数据库备份，后端首次启动时会自动创建"
fi

mkdir -p "$UPLOADS_DIR"
copy_dir_contents "$BACKUP_DIR/uploads" "$UPLOADS_DIR"
ok "上传目录已就绪"

log "步骤 5/7：清理旧依赖并重新安装"
rm -rf "$BLOG_DIR/backend/node_modules" "$BLOG_DIR/frontend/node_modules" "$BLOG_DIR/frontend/dist"

cd "$BLOG_DIR/backend"
npm ci --omit=dev || fail "后端依赖安装失败"

cd "$BLOG_DIR/frontend"
npm ci || fail "前端依赖安装失败"
npm run build || fail "前端构建失败"
ok "依赖安装和前端构建完成"

log "步骤 6/7：启动或重启后端"
cd "$BLOG_DIR"
mkdir -p "$BLOG_DIR/backend/uploads/photos"

if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "blog-backend"; then
        pm2 restart blog-backend || fail "PM2 重启失败"
    else
        pm2 start backend/server.js --name blog-backend || fail "PM2 启动失败"
    fi
    pm2 save || true
    ok "后端已由 PM2 托管"
else
    fail "未安装 pm2。请先执行：sudo npm install -g pm2"
fi

log "步骤 7/7：配置或检查 Cloudflare Tunnel"
if [ "$WITH_TUNNEL" = "1" ]; then
    if [ -f "$BLOG_DIR/setup-cloudflare-tunnel.sh" ]; then
        bash "$BLOG_DIR/setup-cloudflare-tunnel.sh"
    else
        warn "未找到 setup-cloudflare-tunnel.sh，跳过 Tunnel 配置"
    fi
else
    warn "WITH_TUNNEL=0，已跳过 Cloudflare Tunnel 配置"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} 一键处理完成${NC}"
echo -e "${GREEN} 备份目录：$BACKUP_DIR${NC}"
echo -e "${GREEN} 网站地址：https://t1anjhonline.com${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
pm2 status blog-backend || true
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl --no-pager --lines=12 status cloudflared || true
fi
