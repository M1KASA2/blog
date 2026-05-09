# 博客修改、上传与泰山派部署命令

## 1. 本地提交并上传到 GitHub

```powershell
cd C:\Users\admin\Desktop\blog
git add .
git commit -m "Add gallery and Taishan one-click deploy"
git push origin main
```

## 2. 泰山派一键修复、部署、映射公网

优先用这个：

```bash
ssh 用户名@泰山派IP
cd ~/blog
bash taishan-one-click.sh
```

它会自动完成：

- 备份 `backend/blog.sqlite`
- 备份 `backend/uploads`
- 强制同步 GitHub 最新代码
- 恢复数据库和上传图片
- 清理旧 `node_modules`
- 在泰山派上重新安装依赖
- 构建前端
- 启动或重启 `pm2` 后端进程
- 配置或检查 Cloudflare Tunnel

如果只想部署网站，不想配置 Cloudflare Tunnel：

```bash
cd ~/blog
WITH_TUNNEL=0 bash taishan-one-click.sh
```

## 3. 泰山派普通更新网站

```bash
ssh 用户名@泰山派IP
cd ~/blog
bash deploy.sh
```

`deploy.sh` 会自动执行：

- 拉取 GitHub 最新代码
- 在泰山派上重新安装后端依赖
- 安装前端依赖并构建 `frontend/dist`
- 创建 `backend/uploads/photos`
- 重启或启动 `pm2` 进程 `blog-backend`

## 3. Cloudflare Tunnel 绑定公网域名

第一次绑定时在泰山派执行：

```bash
ssh 用户名@泰山派IP
cd ~/blog
bash deploy.sh
bash setup-cloudflare-tunnel.sh
```

脚本会做这些事：

- 安装或复用 `cloudflared`
- 打开 Cloudflare 登录授权流程
- 创建或复用 `blog-tunnel`
- 把 `t1anjhonline.com` 和 `www.t1anjhonline.com` 绑定到 tunnel
- 写入 `/etc/cloudflared/config.yml`
- 安装并启动 `cloudflared` systemd 服务，设置开机自启

如果你想换 tunnel 名称或源站端口：

```bash
TUNNEL_NAME=blog-tunnel ORIGIN_URL=http://localhost:3001 bash setup-cloudflare-tunnel.sh
```

常用检查命令：

```bash
pm2 status blog-backend
sudo systemctl status cloudflared --no-pager
cloudflared tunnel list
cloudflared tunnel info blog-tunnel
```

## 5. “文件格式不支持”的简便解决方式

泰山派是 Linux/ARM，不要上传 Windows 里的 `node_modules`。如果遇到类似 `Exec format error`、`invalid ELF header`、`file format not recognized`，直接在泰山派重新安装依赖：

```bash
cd ~/blog/backend
rm -rf node_modules
npm ci --omit=dev

cd ~/blog/frontend
rm -rf node_modules dist
npm ci
npm run build

cd ~/blog
pm2 restart blog-backend || pm2 start backend/server.js --name blog-backend
pm2 save
```

如果第一次拉取本版本时，Git 因为旧的 `node_modules` 或 `blog.sqlite` 被追踪而阻止更新，用下面这套保守命令：

```bash
cd ~/blog
cp backend/blog.sqlite ~/blog.sqlite.bak 2>/dev/null || true
git fetch origin main
git checkout -f origin/main
cp ~/blog.sqlite.bak backend/blog.sqlite 2>/dev/null || true
bash deploy.sh
```

如果是脚本换行导致 `bad interpreter: /bin/bash^M`：

```bash
cd ~/blog
sed -i 's/\r$//' deploy.sh setup-git.sh
bash deploy.sh
```

## 6. 相册上传格式

相册支持：JPG、PNG、WebP、GIF、AVIF，单张最大 10MB。

iPhone 的 HEIC/HEIF 建议先转成 JPG：

```bash
sudo apt update
sudo apt install -y libheif-examples
heif-convert input.heic output.jpg
```

## 7. 访问入口

- 网站首页：`https://t1anjhonline.com`
- 相册页：`https://t1anjhonline.com/gallery`
- 后台相册管理：`https://t1anjhonline.com/admin/gallery`
- 本地后端与构建后前端：`http://localhost:3001`
- 本地 Vite 前端：`http://localhost:5173`
