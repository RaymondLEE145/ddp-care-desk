# 部署手册

本手册覆盖三种部署方式：GitHub Pages（纯静态）、Render（Node 服务）、自有服务器。全部零 npm 依赖，只需要 Node.js 18+。

---

## 一、GitHub Pages（最快，免费）

适合：个人使用、不想维护服务器。数据保存在浏览器 localStorage。

### 1. 新建仓库并推送

在 GitHub 新建 **public** 仓库（例如 `ddp-care-desk`），不要勾选 README（避免冲突）。

```bash
cd ddp-care-desk
git init
git add .
git commit -m "feat: CareDesk DDP after-sales script desk"
git branch -M main
git remote add origin https://github.com/<你的用户名>/ddp-care-desk.git
git push -u origin main
```

> 如果本机没有 git，可先安装 Git for Windows，或用 GitHub 网页「Add file → Upload files」上传整个目录（不要上传 `server/data/`）。

### 2. 开启 Pages

**Settings → Pages → Build and deployment**

- Source 选 **Deploy from a branch**。
- Branch 选 `main`，目录选 `/ (root)`，保存。

根目录已带 `.nojekyll`，无需额外配置；每次 push 后 GitHub 会自动重新发布静态文件。

`https://<你的用户名>.github.io/ddp-care-desk/`

### 3. 验证

- 首页应显示 36 条话术、3 条专线、政策速览。
- 进入「话术库」，国家/类别筛选、搜索、复制正常。
- 进入「截图改话」，粘贴截图可识别；生成后「我的回复 → 截图话术库」出现自动归档。
- 刷新页面后归档仍在（localStorage），换浏览器/设备则不在。

### 静态模式限制

- 新增话术、收藏、截图归档仅在**当前浏览器**。
- 不能多人共享；需要共享请用下面的 Node 服务。
- 「AI 润色」不可用（没有服务端代理）。

---

## 二、Render（推荐团队使用）

适合：多人共享、持久化、可选 AI。免费套餐足够小团队使用。

### 1. 推送到 GitHub（同上）

### 2. 用 Blueprint 部署

1. 登录 [Render](https://render.com)，**New → Blueprint**。
2. 连接 GitHub 仓库，Render 自动读取 `render.yaml`。
3. 确认服务名、区域（建议 Singapore）。
4. 设置环境变量：
   - `ADMIN_TOKEN`：写入接口口令（可让 Render 生成）。
   - `AI_API_KEY`（可选）：OpenAI 兼容 Key。
   - `AI_BASE_URL`、`AI_MODEL` 有默认值。
5. 点击 **Apply**，等待部署完成。

### 3. 首次配置

1. 打开站点，顶部/侧边显示「服务端模式」。
2. 进入「设置」：
   - 在「管理口令」填入 `ADMIN_TOKEN` 相同的值（否则新增/删除会 401）。
   - 需要 AI 的话，填 API Base / Key / Model，点「保存 AI 配置」。
3. 试新增一条话术，刷新后仍在 → 持久化成功。

### 4. 注意

- Render 免费实例会休眠，首次访问可能等 30–60 秒。
- `server/data/db.json` 在免费实例重启后可能丢失（无持久磁盘）。重要数据请定期在「设置 → 导出 JSON」备份。
- 如需长期持久化，给 Render 挂 Persistent Disk（`/opt/render/project/src/server/data`），或改用带磁盘的 VPS。

---

## 三、自有服务器（VPS）

```bash
# 1. 上传项目
scp -r ddp-care-desk user@server:/opt/

# 2. 用 systemd 常驻
sudo tee /etc/systemd/system/caredesk.service > /dev/null <<'EOF'
[Unit]
Description=CareDesk DDP script desk
After=network.target

[Service]
WorkingDirectory=/opt/ddp-care-desk
Environment=PORT=8080
Environment=ADMIN_TOKEN=change-me
Environment=AI_API_KEY=
ExecStart=/usr/bin/node server/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now caredesk
```

Nginx 反向代理示例：

```nginx
server {
  listen 80;
  server_name caredesk.example.com;
  client_max_body_size 2m;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

建议加 HTTPS（certbot），并在防火墙只开放 80/443；Node 端口不要直接暴露公网。

---

## 四、常见问题

**Q：页面显示「本地模式」，但我启动了 Node 服务？**
A：确认访问的是 Node 服务端口（默认 4173），且 `/api/health` 返回 JSON。如果通过 Nginx 子路径部署，需要把 `/api` 一起反代。

**Q：截图识别一直停在「加载中英文语言包」？**
A：Tesseract.js 首次需从 CDN 下载语言包（约 15MB），需要外网；企业网络可能拦截 `cdn.jsdelivr.net`。可改用「文字」标签直接粘贴客户原话。

**Q：复制按钮没反应？**
A：浏览器要求 HTTPS 或 localhost 才允许剪贴板写入；并且需要一次用户点击（当前实现已满足）。自建 HTTP 域名请配置 HTTPS。

**Q：新增/删除提示 401？**
A：服务端设置了 `ADMIN_TOKEN`，到网页「设置 → 管理口令」填同一个值。

**Q：AI 润色报错「未配置 AI_API_KEY」？**
A：设置页的 Key 只在服务端模式生效；本地静态模式没有代理。配置环境变量或设置页 Key 后重试。

**Q：如何更新政策 / 话术？**
A：编辑 `data/scenarios-*.json` 或网页内编辑；政策速览数据在 `data/policy-snapshot.json`。每季度对照官方来源复核一次。

**Q：数据会丢吗？**
A：静态模式清浏览器/换设备会丢，务必导出备份；服务端模式写 JSON 文件，建议定期备份 `server/data/db.json`。
