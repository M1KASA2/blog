#!/bin/bash
# ============================================================
#  setup-cloudflare-tunnel.sh — 泰山派 Cloudflare Tunnel 映射脚本
#  用法：在泰山派上执行  bash ~/blog/setup-cloudflare-tunnel.sh
# ============================================================

set -euo pipefail

DOMAIN="${DOMAIN:-t1anjhonline.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.${DOMAIN}}"
TUNNEL_NAME="${TUNNEL_NAME:-blog-tunnel}"
ORIGIN_URL="${ORIGIN_URL:-http://localhost:3001}"
USER_CF_DIR="$HOME/.cloudflared"
SYSTEM_CF_DIR="/etc/cloudflared"

GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "\n${BLUE}► $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}! $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

install_cloudflared() {
    if command -v cloudflared >/dev/null 2>&1; then
        ok "cloudflared 已安装：$(cloudflared --version)"
        return
    fi

    log "安装 cloudflared..."
    if ! command -v curl >/dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y curl
    fi

    local arch
    arch="$(dpkg --print-architecture)"
    local url
    case "$arch" in
        amd64) url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb" ;;
        arm64) url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb" ;;
        armhf|arm) url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm.deb" ;;
        *) fail "暂不支持的架构：$arch，请手动安装 cloudflared 后再运行本脚本" ;;
    esac

    curl -L "$url" -o /tmp/cloudflared.deb
    sudo dpkg -i /tmp/cloudflared.deb || sudo apt-get -f install -y
    ok "cloudflared 安装完成：$(cloudflared --version)"
}

get_tunnel_id() {
    local tmp_json
    tmp_json="$(mktemp)"
    cloudflared tunnel list --name "$TUNNEL_NAME" --output json > "$tmp_json"
    node -e "
const fs = require('fs');
const tunnels = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
const tunnel = tunnels.find((item) => item.name === process.argv[2] && !item.deletedAt);
process.stdout.write(tunnel ? tunnel.id : '');
" "$tmp_json" "$TUNNEL_NAME"
    rm -f "$tmp_json"
}

log "检查本地服务"
if command -v curl >/dev/null 2>&1; then
    if curl -fsS "$ORIGIN_URL/api/photos" >/dev/null 2>&1 || curl -fsS "$ORIGIN_URL" >/dev/null 2>&1; then
        ok "源站可访问：$ORIGIN_URL"
    else
        warn "暂时访问不到 $ORIGIN_URL。请先确认 PM2 后端已启动：pm2 status blog-backend"
    fi
fi

install_cloudflared

log "检查 Cloudflare 登录状态"
if [ ! -f "$USER_CF_DIR/cert.pem" ]; then
    warn "接下来会打开 Cloudflare 授权链接。请选择 t1anjhonline.com 所在账号并授权。"
    cloudflared tunnel login
else
    ok "已找到登录证书：$USER_CF_DIR/cert.pem"
fi

log "创建或复用 Tunnel：$TUNNEL_NAME"
TUNNEL_ID="$(get_tunnel_id)"
if [ -z "$TUNNEL_ID" ]; then
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID="$(get_tunnel_id)"
fi

if [ -z "$TUNNEL_ID" ]; then
    fail "未能获取 Tunnel ID"
fi
ok "Tunnel ID：$TUNNEL_ID"

if [ ! -f "$USER_CF_DIR/$TUNNEL_ID.json" ]; then
    fail "未找到 Tunnel 凭据：$USER_CF_DIR/$TUNNEL_ID.json"
fi

log "绑定 DNS 到 Tunnel"
cloudflared tunnel route dns --overwrite-dns "$TUNNEL_NAME" "$DOMAIN"
cloudflared tunnel route dns --overwrite-dns "$TUNNEL_NAME" "$WWW_DOMAIN"
ok "DNS 已绑定：$DOMAIN / $WWW_DOMAIN"

log "写入系统服务配置"
sudo mkdir -p "$SYSTEM_CF_DIR"
sudo cp "$USER_CF_DIR/$TUNNEL_ID.json" "$SYSTEM_CF_DIR/$TUNNEL_ID.json"
sudo chmod 600 "$SYSTEM_CF_DIR/$TUNNEL_ID.json"
sudo tee "$SYSTEM_CF_DIR/config.yml" >/dev/null <<EOF
tunnel: $TUNNEL_ID
credentials-file: $SYSTEM_CF_DIR/$TUNNEL_ID.json
protocol: quic
ingress:
  - hostname: $DOMAIN
    service: $ORIGIN_URL
  - hostname: $WWW_DOMAIN
    service: $ORIGIN_URL
  - service: http_status:404
EOF
ok "配置已写入：$SYSTEM_CF_DIR/config.yml"

log "安装并启动 cloudflared systemd 服务"
if systemctl list-unit-files | grep -q '^cloudflared.service'; then
    sudo systemctl restart cloudflared
else
    sudo cloudflared service install
fi
sudo systemctl enable --now cloudflared
ok "cloudflared 已设置为开机自启"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Tunnel 映射完成：${NC}"
echo -e "${GREEN}   https://$DOMAIN${NC}"
echo -e "${GREEN}   https://$WWW_DOMAIN${NC}"
echo -e "${GREEN}============================================${NC}"
sudo systemctl --no-pager --lines=20 status cloudflared
