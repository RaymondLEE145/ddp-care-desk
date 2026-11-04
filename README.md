# CareDesk · DDP 专线售后话术中枢

面向 **中澳 / 中加 / 中美** DDP 海运拼箱（LCL）的售后话术工具。每条话术按「共情 → 事实 → 方案 → 同步 → 安抚」五段式写成，带当地清关口径、可直接发 WhatsApp 的英文原文，并且能把客户截图变成 3 条不同语气的英文回复。

> 36 条场景 · 3 条专线 · 12 类高频问题 · 每条 3 段主话术 + 2 段同题替代 · 截图自动归档

**在线使用：** <https://raymondlee145.github.io/ddp-care-desk/> · **GitHub：** <https://github.com/RaymondLEE145/ddp-care-desk>

---

## 核心能力

| 能力 | 说明 |
|---|---|
| 三国话术库 | 澳洲 12 条、加拿大 12 条、美国 12 条；覆盖查验、税费、时效、货损、派送、合规、费用、情绪 |
| 五段式结构 | 每条话术都有中文内部口径（共情/事实/方案/同步/安抚），英文正文自然融合五段 |
| 一键复制 | 英文原文位于 WhatsApp 气泡预览中，变量自动提示；填充后复制即可发送 |
| 截图改话 | Ctrl/⌘+V 粘贴客户截图 → 浏览器内 OCR（中英）→ 识别问题 → 生成 3 条英文回复 |
| 多问题合并 | 客户一条消息里同时问查验、费用、时效时，识别第二个诉求并合并进 3 条回复 |
| 自动归档 | 每次生成自动形成一条带标题的「截图话术库」记录：客户原话、匹配场景、3 条回复、截图缩略图 |
| 可维护 | 网页内新增/编辑话术、搜索筛选、导入导出 JSON；服务端模式下多人共享 |
| 双模式 | 纯静态（GitHub Pages，浏览器本地保存）或 Node 服务（JSON 持久化、共享、AI 可选） |

## 为什么是「五段式」

售后真正难的，不是解释流程，而是四件事同时做到：

1. **先接情绪**——客户损失的是时间、生意或钱，不是「一个查询」。
2. **只讲已核实的事实**——区分「已知」与「正在核实」，不甩锅给海关。
3. **给动作和时间**——谁在做、做什么、下次什么时候同步。
4. **给确定性**——不承诺结果，但承诺跟进方式与兜底路径。

所以库里的英文不是公告，是「负责这件事的人」会发出的消息。

---

## 快速开始

需要 Node.js 18+（无任何 npm 依赖）。

### 方式 A：静态预览（模拟 GitHub Pages）

```bash
node tools/static-server.js 4174
# 打开 http://localhost:4174
```

静态模式：基础话术从 `data/*.json` 读取；新增话术、我的回复、截图归档保存在**当前浏览器 localStorage**。适合个人使用和 GitHub Pages。

### 方式 B：完整服务端（推荐团队使用）

```bash
npm start
# 或 node server/index.js
# 打开 http://localhost:4173
```

服务端模式：话术、截图归档写入 `server/data/db.json`，重启不丢；同一局域网/公网可多人共享。

### 可选：AI 润色

```bash
# macOS / Linux
AI_API_KEY=sk-xxx AI_BASE_URL=https://api.deepseek.com AI_MODEL=deepseek-chat npm start

# Windows PowerShell
$env:AI_API_KEY="sk-xxx"; npm start
```

未配置 Key 时，截图识别与三条回复完全可用（本地引擎）；配置后可在结果页点「AI 润色」，由服务端代理调用 OpenAI 兼容接口。也可在网页「设置」里临时填写 Key（仅存本机，随请求发送到自己的服务端）。

---

## 目录结构

```
ddp-care-desk/
├─ index.html                 # 单页应用外壳
├─ assets/
│  ├─ css/app.css             # 设计系统与全部视图样式
│  └─ js/
│     ├─ icons.js             # 内联 SVG 图标
│     ├─ engine.js            # 问题匹配、三条回复、多问题合并、变量提取
│     ├─ store.js             # 服务端 API / localStorage 双模式数据层
│     ├─ ocr.js               # Tesseract.js 截图识别（懒加载）
│     └─ app.js               # 路由与全部页面逻辑
├─ data/
│  ├─ scenarios-au.json       # 澳洲 12 条
│  ├─ scenarios-ca.json       # 加拿大 12 条
│  ├─ scenarios-us.json       # 美国 12 条
│  └─ policy-snapshot.json    # 政策速览（20 条，带官方来源）
├─ server/index.js            # 零依赖 Node 服务：静态托管 + CRUD + 归档 + AI 代理
├─ tools/static-server.js     # 纯静态预览服务（验证 GitHub Pages）
├─ spec/CONTENT-BRIEF.md      # 数据 Schema 与写作规范（新增话术必读）
├─ research/                  # 2025–2026 政策事实底座与审校报告
├─ render.yaml                # Render 一键部署
└─ README.md
```

## 数据模型（摘要）

```json
{
  "country": "AU", "lane": "中澳", "updated_at": "2026-11-04",
  "scenarios": [{
    "id": "au-customs-inspection",
    "stage": "清关", "category": "清关异常", "severity": "high",
    "title_zh": "澳洲海关查验扣关（ABF Inspection）",
    "title_en": "Shipment held for ABF inspection",
    "summary_zh": "……",
    "customer_signals": ["Why is my container still in customs?"],
    "keywords": ["customs", "inspection", "查验", "扣关"],
    "framework": {
      "empathy": ["……"], "facts": ["……"], "plan": ["……"],
      "sync": ["……"], "reassure": ["……"]
    },
    "scripts": [
      { "phase": "first", "tone": "standard", "text": "Hi {{customer_name}}…" },
      { "phase": "followup", "tone": "warm", "text": "…" },
      { "phase": "close", "tone": "supervisor", "text": "…" }
    ],
    "alts": [
      { "tone": "warm", "text": "…" },
      { "tone": "concise", "text": "…" }
    ],
    "internal": {
      "common_causes": [], "resolution_path": [], "sla_hint": "",
      "fee_policy": "", "guardrails": ["……"]
    },
    "authorities": [{ "name": "Australian Border Force", "url": "https://www.abf.gov.au/" }]
  }]
}
```

字段规范、写作红线、36 个场景 ID 见 [`spec/CONTENT-BRIEF.md`](spec/CONTENT-BRIEF.md)。

## 截图改话工作流

1. 在「截图改话」页按 **Ctrl / ⌘ + V** 粘贴客户截图（也可拖拽/选择文件）。
2. 浏览器内 Tesseract.js 识别中英文（首次需联网下载语言包，之后走缓存），识别结果可编辑。
3. 自动判断国家（可手动改），按关键词 + 客户信号 + 国家匹配话术场景。
4. 提取柜号、提单号、港口、金额、客户时间点，自动回填变量。
5. 如果客户一条消息里问了第二件事（例如“谁付仓储费”），把对应口径合并进三条回复。
6. 生成 3 条英文（标准 / 共情 / 简洁），一键复制。
7. **自动归档**：形成带标题的归档记录；在「我的回复 → 截图话术库」搜索、复制、导出。

> 隐私：OCR 在浏览器本地完成，截图不会上传。只有你主动使用「AI 润色」时，文字才会发送到你自己的 AI 接口。归档缩略图保存在本浏览器或你的服务端数据库。

## 新增 / 维护话术

- 网页「新增话术」：完整表单，保存后立即出现在话术库；服务端模式写入 `server/data/db.json`，静态模式写入本浏览器。
- 直接编辑 `data/scenarios-*.json`：适合批量维护。改完刷新页面即可。**修改前先看内容规范**，保持 3 条 scripts + 2 条 alts + 五段 framework。
- 备份：「设置 → 数据备份」导出 JSON（含自定义话术、归档、我的回复、设置）。换设备/清浏览器前先导一份。

## 部署

### GitHub Pages（纯静态，免费）

1. 在 GitHub 新建仓库（例如 `ddp-care-desk`）。
2. 推送本项目到 `main`。
3. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选 **Deploy from a branch**；
   - Branch 选 `main`，目录选 `/ (root)`，保存。
4. 等待 1–3 分钟，访问 `https://<用户名>.github.io/ddp-care-desk/`。

根目录已带 `.nojekyll`，Pages 会直接托管静态文件；每次 push 后会自动重新发布。

静态模式限制：新增话术和截图归档只保存在当前浏览器；多人共享请用下面的 Node 部署。

### Render（完整服务端，推荐团队）

1. 把仓库推到 GitHub。
2. Render → **New → Blueprint**，选择仓库（自动读取 `render.yaml`）。
3. 设置环境变量：
   - `ADMIN_TOKEN`：写入接口口令（Render 可自动生成；生成后到网页「设置」里填同一个值）。
   - `AI_API_KEY`（可选）：AI 润色。
4. 部署完成后访问 Render 分配的域名。

也可以部署到 Railway / Fly.io / 自己的 VPS：

```bash
PORT=8080 ADMIN_TOKEN=your-token node server/index.js
```

### 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `4173` | 服务端口 |
| `ADMIN_TOKEN` | 空 | 设置后，新增/修改/删除话术与归档需要口令（网页设置里填同一个） |
| `AI_API_KEY` | 空 | OpenAI 兼容接口 Key，不配置则只用本地引擎 |
| `AI_BASE_URL` | `https://api.deepseek.com` | 必须是 https |
| `AI_MODEL` | `deepseek-chat` | 模型名 |

生产环境务必设置 `ADMIN_TOKEN`；不要把服务端 `server/data/db.json` 提交到仓库（已在 `.gitignore`）。

## 合规与边界

- 本库话术用于**沟通参考**，不构成法律、税务、清关或保险建议。具体税率、查验时效、费用承担以官方最新公告与报关行确认为准。
- 任何情况下不得建议客户低报货值、修改品名/HS 编码、拆单避税或提供虚假单证；不得承诺「一定放行」「保证赔付」。
- DDP 不改变法定纳税人：澳洲关注 owner/持牌代理，加拿大关注 importer + CARM 授权，美国关注 IOR 与 5 年记录保存。
- 税基三国不同：澳洲 CIF + 关税（VoTI），加拿大按口岸交付完税价，美国按 FOB（国际运保费不计入）——跨国比价时不要混用。
- 政策会变：建议每季度对照 ABF / DAFF / CBSA / CBP 官方更新复核一次；`research/clearance-brief.md` 记录了本轮核实的来源与待核实项。

## 设计说明

- 无构建步骤、无前端框架依赖；直接打开静态文件服务即可运行。
- 服务端零 npm 依赖，只用 Node 内置 `http`/`fs`，方便部署和审计。
- 截图 OCR 用 Tesseract.js（CDN 懒加载）；图片只在浏览器内处理。
- AI 为可选增强，不是必需项；没有 Key 时三条回复仍由内置话术引擎生成。

## License

内部工具，未授权请勿公开分发客户数据。话术内容由 DDP 专线售后团队维护。
