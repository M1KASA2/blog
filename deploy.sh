#!/bin/bash
# ============================================================
#  deploy.sh  —  泰山派端部署脚本
#  用法：在泰山派上执行  bash ~/blog/deploy.sh
#  或者直接 SSH 调用：ssh user@pi "bash ~/blog/deploy.sh"
# ============================================================

set -e

BLUE='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "\n${BLUE}► $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_FILE="$BLOG_DIR/backend/blog.sqlite"
DB_BACKUP="$BLOG_DIR/backend/blog.sqlite.deploy.bak"
log "项目目录：$BLOG_DIR"

# 1. 拉取最新代码
log "步骤 1/5：拉取最新代码..."
cd "$BLOG_DIR"
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$DB_BACKUP"
    ok "数据库已临时备份"
fi
git pull origin main || fail "git pull 失败"
if [ -f "$DB_BACKUP" ]; then
    cp "$DB_BACKUP" "$DB_FILE"
    rm -f "$DB_BACKUP"
    ok "数据库已还原"
fi
ok "代码已更新"

# 2. 安装后端依赖
log "步骤 2/5：安装后端依赖..."
cd "$BLOG_DIR/backend"
npm ci --omit=dev || fail "后端依赖安装失败"
mkdir -p "$BLOG_DIR/backend/uploads/photos"
ok "后端依赖已安装，上传目录已就绪"

# 3. 安装并构建前端
log "步骤 3/5：安装并构建前端..."
cd "$BLOG_DIR/frontend"
npm ci || fail "前端依赖安装失败"
npm run build || fail "前端构建失败"
ok "前端构建完成 → dist/"

# 4. 检查数据库
log "步骤 4/5：检查数据库..."
cd "$BLOG_DIR/backend"
if [ -f "$DB_FILE" ]; then
    ok "SQLite 数据库存在"
else
    ok "首次启动时会自动创建 SQLite 数据库"
fi

# 5. 重启后端
log "步骤 5/5：重启后端进程..."
cd "$BLOG_DIR"
if pm2 list | grep -q "blog-backend"; then
    pm2 restart blog-backend || fail "pm2 重启失败"
    ok "后端已重启"
else
    pm2 start backend/server.js --name blog-backend || fail "pm2 启动失败"
    pm2 save
    ok "后端已启动并保存 PM2 配置"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} 部署完成！https://t1anjhonline.com${NC}"
echo -e "${GREEN}============================================${NC}"
pm2 status blog-backend
