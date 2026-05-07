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
log "项目目录：$BLOG_DIR"

# 1. 拉取最新代码
log "步骤 1/3：拉取最新代码..."
cd "$BLOG_DIR"
git pull origin main || fail "git pull 失败"
ok "代码已更新"

# 2. 构建前端
log "步骤 2/3：构建前端..."
cd "$BLOG_DIR/frontend"
npm run build || fail "前端构建失败"
ok "前端构建完成 → dist/"

# 3. 重启后端
log "步骤 3/3：重启后端进程..."
cd "$BLOG_DIR"
pm2 restart blog-backend || fail "pm2 重启失败"
ok "后端已重启"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} 部署完成！https://t1anjhonline.com${NC}"
echo -e "${GREEN}============================================${NC}"
pm2 status blog-backend
