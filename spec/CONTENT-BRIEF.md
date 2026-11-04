# DDP 散货售后话术库 · 内容生产规范（v1.0）

> 面向中国货代售后客服。产品是「中澳 / 中加 / 中美」DDP 拼箱（LCL）专线的售后话术工具，
> 每条话术同时服务三件事：**安抚情绪、讲清事实、推进处理**。
> 交付物是**英文 WhatsApp 可直接发送的话术** + **中文内部口径**。

---

## 0. 总原则：五段式

每条英文话术必须能拆解出五段（顺序可微调，但不能缺）：

| 段 | 作用 | 一句话要求 |
|---|---|---|
| 共情 Empathy | 先接住情绪 | 承认对方的处境/损失，不套模板 |
| 事实 Facts | 讲我们已核实的事实 | 区分「已知」与「正在核实」，不甩锅 |
| 方案 Plan | 说清我们正在做什么 | 动作 + 责任人 + 时间点 |
| 同步 Sync | 给客户确定的沟通节奏 | 下次更新时间，主动而非被动 |
| 安抚 Reassure | 给确定性与兜底 | 承诺跟进/升级路径，不承诺结果 |

**五段式不是五段模板文字**，要自然融进 3–4 个短段落里，像真人打字，不能像公告。

---

## 1. 数据结构（严格 JSON）

每个国家一个文件：`data/scenarios-au.json` / `data/scenarios-ca.json` / `data/scenarios-us.json`

```json
{
  "country": "AU",
  "lane": "中澳",
  "updated_at": "2026-11-04",
  "scenarios": [ { ...场景对象... } ]
}
```

单个场景对象：

```json
{
  "id": "au-customs-inspection",
  "country": "AU",
  "lane": "中澳",
  "stage": "清关",
  "category": "清关异常",
  "severity": "high",
  "title_zh": "澳洲海关查验扣关（ABF Inspection）",
  "title_en": "Shipment held for ABF inspection",
  "summary_zh": "货物到港后被 ABF 抽中查验，客户催进度、担心错过销售窗口。",
  "customer_signals": [
    "Why is my container still in customs?",
    "海关查验要多久？客户一直催",
    "It's been 5 days, is something wrong?"
  ],
  "keywords": [
    "customs", "inspection", "held", "ABF", "clearance delay",
    "查验", "扣关", "清关慢", "海关", "放行"
  ],
  "framework": {
    "empathy": ["先承认客户的时间损失与商业影响", "避免说「这是海关的事我们也没办法」"],
    "facts": ["ABF 可在到港后实施查验，属常规边境监管", "查验本身不代表申报有问题，也不等于罚款"],
    "plan": ["确认查验类型与排队位置", "报关行每日跟进两次", "准备放行后立即安排派送"],
    "sync": ["承诺当天下班前给一次书面进度", "状态变化第一时间告知"],
    "reassure": ["明确我方持续跟进、不把客户晾着", "提供可落地的替代方案（延迟函/分批派送）"]
  },
  "scripts": [
    {
      "id": "au-customs-inspection-first",
      "phase": "first",
      "tone": "standard",
      "label_zh": "首次回复 · 标准",
      "use_when": "客户第一次问查验进度，情绪尚可控",
      "text": "Hi {{customer_name}}, thanks for flagging this — I can see {{container_no}} is still showing as held, and I know that's frustrating when you're working to a deadline.\n\nI've checked with our clearance team. What we know: the container is at {{port}} and has been selected for an ABF inspection. This is a standard border check, and it does not mean there's a problem with your declaration or that a penalty is coming.\n\nWhat we're doing: our broker has the entry lodged and is chasing the terminal and the inspection queue twice a day. Once ABF completes the inspection, release is normally within 1–3 business days, though I won't promise a date until they finish.\n\nI'll send you an update by {{next_update_time}} today, and straight away if anything changes. If it helps, I can also draft a short delay letter for your landlord or fit-out team.",
      "placeholders": ["customer_name", "container_no", "port", "next_update_time"]
    },
    {
      "id": "au-customs-inspection-followup",
      "phase": "followup",
      "tone": "warm",
      "label_zh": "跟进 · 短消息",
      "use_when": "已回复过一次，客户再次追问；或当日无实质进展时主动同步",
      "text": "Quick update on {{container_no}} — still in the inspection queue at {{port}}, no change in status yet. I know 'no change' isn't what you want to hear, so here's what I've done today: our broker has re-confirmed the booking with the inspection team and we've got the delivery slot pencilled in for right after release.\n\nI'll come back to you by {{next_update_time}} even if there's nothing new. You won't have to chase me for it.",
      "placeholders": ["container_no", "port", "next_update_time"]
    },
    {
      "id": "au-customs-inspection-close",
      "phase": "close",
      "tone": "supervisor",
      "label_zh": "收口 · 主管口径",
      "use_when": "查验放行后说明结果、或客户情绪升级需要主管出面",
      "text": "Hi {{customer_name}}, good news — {{container_no}} has cleared the ABF inspection and was released this morning. No penalties, no additional duty raised.\n\nWe've already booked the delivery for {{delivery_date}} and will send you the driver details the day before. I'm sorry this one sat longer than we'd both like; the inspection queue was heavier than usual this week.\n\nIf anything else comes up on this shipment, message me directly — I'll keep owning it until it's signed for.",
      "placeholders": ["customer_name", "container_no", "delivery_date"]
    }
  ],
  "internal": {
    "common_causes": ["ABF 随机布控", "申报要素与实物不符", "同柜其他货主触发查验", "木包装/生物安全风险"],
    "resolution_path": ["确认查验类型（文件/尾门/X光）", "报关行预约并跟进", "查验完成→缴税→放行", "放行后优先安排派送"],
    "sla_hint": "首次响应 2 小时内；查验期间每 24 小时主动同步一次；放行后 24 小时内给出派送计划",
    "fee_policy": "DDP 项下查验产生的常规查验费由我方承担；如产生客户原因导致的滞箱/改址费用，另行书面确认后再收取",
    "guardrails": [
      "不承诺具体放行日期，只给区间与条件",
      "不暗示查验是「海关故意刁难」，不评价海关",
      "不向客户保证「一定不查」或建议拆分/改品名规避"
    ]
  },
  "alts": [
    {
      "id": "au-customs-inspection-alt-warm",
      "tone": "warm",
      "label_zh": "替代表达 · 共情版",
      "text": "Hi {{customer_name}}, I'm really sorry your shipment is caught up in this — I know a hold like this puts your whole launch plan at risk.\n\nI've just been through it with our clearance team. {{container_no}} is at {{port}} and has been picked for an ABF inspection. That is a routine border check, and there's no indication of a problem with your paperwork or a penalty.\n\nOur broker is monitoring the inspection queue twice a day, and I'll personally come back to you by {{next_update_time}} with a real update — even if it's just to say we're still in the queue. If you need to reassure your landlord or your team in the meantime, I can put a short note together for you.",
      "placeholders": ["customer_name", "container_no", "port", "next_update_time"]
    },
    {
      "id": "au-customs-inspection-alt-concise",
      "tone": "concise",
      "label_zh": "替代表达 · 简洁版",
      "text": "Hi {{customer_name}} — quick status on {{container_no}}: it's at {{port}} and selected for an ABF inspection. That's a standard border check, not a finding against your shipment.\n\nOur broker is chasing the inspection queue twice a day. Release normally follows within 1–3 business days after ABF attends, but I won't give you a hard date until they finish.\n\nI'll message you by {{next_update_time}} today either way. If you need a delay note for your shop opening, say the word and I'll draft one.",
      "placeholders": ["customer_name", "container_no", "port", "next_update_time"]
    }
  ],
  "authorities": [
    { "name": "Australian Border Force", "url": "https://www.abf.gov.au/" },
    { "name": "DAFF Biosecurity Import Conditions (BICON)", "url": "https://www.agriculture.gov.au/biosecurity-trade/import" }
  ],
  "updated_at": "2026-11-04"
}
```

### 字段硬性要求

- `id`：kebab-case，必须以国家码开头（`au-` / `ca-` / `us-`），与文件名一致，不得重复。
- `stage`：只能取 `下单 | 提货 | 报关 | 开船 | 到港 | 清关 | 派送 | 签收后 | 全程`。
- `category`：只能取 `清关异常 | 税费争议 | 时效延误 | 货损短少 | 派送异常 | 合规风险 | 费用争议 | 客户情绪`。
- `severity`：`high | medium | low`。
- `customer_signals`：2–4 条，中英混合，模拟真实客户原话（不是书面语）。
- `keywords`：≥ 8 个，中英都有，覆盖客户可能用的词（含拼写变体/缩写）。
- `framework`：五段每段 2–4 条**中文操作要点**（不是英文话术），要能指导客服思考，不要空话。
- `scripts`：**恰好 3 条**，`phase` 分别为 `first` / `followup` / `close`，`tone` 从 `standard | warm | firm | supervisor` 中选，三条语气要有差异。
- `alts`：**恰好 2 条**「同一封客户首次询问」的替代表达，`tone` 分别为 `warm`（共情版）和 `concise`（简洁版），每条 80–130 词，必须与 `scripts[0]` 回答同一件事、使用同一组事实与占位符，但措辞、句式、开场完全不同（供客服三选一直接发送）。
- 每条英文话术词数：first 90–150、followup 50–90、close 60–110、alts 80–130。
- `placeholders`：只能从下面白名单取，且必须与正文中的 `{{token}}` 完全一致：
  `customer_name, container_no, bill_no, port, eta_date, delivery_date, next_update_time, amount, agent_name, company_name, order_no`
- `internal.common_causes`：≥ 3 条真实成因。
- `internal.resolution_path`：≥ 4 步可执行动作。
- `internal.sla_hint`：内部时效标准，要具体（小时/天）。
- `internal.fee_policy`：DDP 项下费用由谁承担、什么情况另收，写清楚边界。
- `internal.guardrails`：**恰好 3 条**「绝不能说的话/不能做的事」，要针对该场景。
- `authorities`：1–2 个真实可访问的**官方**链接（ABF/DAFF/CBSA/CBP/FDA/CFIA/ATO 等），不得用百科/新闻聚合。
- `updated_at`：`2026-11-04`。

---

## 2. 三条英文话术的写作规范

### 2.1 首响（first）
- 90–150 词，4 段以内。
- 第 1 句必须**接情绪/接处境**，不要 "We apologize for the inconvenience"。
- 必须出现 1 句「我们已核实到的事实」+ 1 句「我们正在做的动作 + 时间」。
- 结尾给下一次同步时间。
- 不承诺结果，只承诺动作与节奏。

### 2.2 跟进（followup）
- 50–90 词，2–3 段。
- 用于「暂时没有实质进展」或「客户再次追问」。要有**新增信息**（今天做了什么、卡在哪、下一步），不能只说 "still waiting"。
- 结尾再次给时间点。

### 2.3 收口（close）
- 60–110 词。
- 用于放行/签收/赔付结论/升级主管。
- 结论 + 已安排的下一步 + 一句真诚的复盘/致歉 + 后续兜底联系人。
- 不甩锅给海关/船司/客户。

### 2.4 英文红线
- **禁止**：Dear Sir/Madam、We regret any inconvenience caused、Please be patient、kindly note、as per、hereby、aforementioned、pursuant to。
- **禁止**承诺具体放行日、承诺一定赔付、承诺「不会产生额外费用」。
- **禁止**建议低报货值、改品名/HS、拆单避税、修改发票。
- **禁止**把责任推给客户（即使客户地址写错，也先解决问题）。
- 少用 emoji（最多 1 个，优先不用）；不要 Markdown 符号、不要项目符号列表。
- 用国际通用表达，缩写首次出现给全称：ABF (Australian Border Force)、CBSA (Canada Border Services Agency)、CBP (U.S. Customs and Border Protection)、ISF (Importer Security Filing)、PGA (Partner Government Agency)。
- 数字/金额用 `{{amount}}` 等占位符，不要编造具体金额。
- 语气：专业、平等、有温度；像「负责这件事的人」在说话，不像客服机器人。

### 2.5 五段式在英文里的落点
- 共情：`I can see why this is frustrating…` / `I know timing matters for your launch…`
- 事实：`What we know right now is…` / `I've checked with our clearance team…`
- 方案：`What we're doing is…` / `Our broker has…`
- 同步：`I'll update you by {{next_update_time}}…` / `You won't have to chase me…`
- 安抚：`I'm keeping this with me until it's delivered…` / `If it slips, here's the backup plan…`

---

## 3. 每个国家的场景清单（共 36 条，每条都要写）

> 以下 ID 必须使用，不得自创替代；标题可润色。

### 澳大利亚 · `data/scenarios-au.json`（12 条）
| ID | category / stage | severity | 场景核心 |
|---|---|---|---|
| au-customs-inspection | 清关异常 / 清关 | high | ABF 查验、排队、放行慢 |
| au-biosecurity-hold | 合规风险 / 清关 | high | DAFF 生物安全查验：木包装 ISPM15、BMSB 季节措施、食品/植物/土壤风险 |
| au-duty-gst-dispute | 税费争议 / 清关 | high | 关税 5% 左右 + GST 10%、AUD 1000 申报门槛、DDP 已含税却收到税单 |
| au-docs-missing | 清关异常 / 清关 | high | 发票/装箱单/提单/包装声明缺失或信息不符 |
| au-port-congestion | 时效延误 / 到港 | medium | 悉尼/墨尔本/布里斯班拥堵、船期跳港、ETA 反复 |
| au-demurrage-storage | 费用争议 / 到港 | high | 滞港费/仓储费产生，客户不愿承担 |
| au-delivery-failed | 派送异常 / 派送 | medium | 地址错、无人收货、ATL（Authority to Leave）、偏远地区 |
| au-damage | 货损短少 / 签收后 | high | 外箱破损/水湿/挤压，客户要赔偿 |
| au-shortage | 货损短少 / 签收后 | high | 少箱、短装、丢件、签收后发现短少 |
| au-restricted-goods | 合规风险 / 清关 | high | 禁限运：仿牌、武器、电子烟、部分食品/药品、石棉、锂电池 |
| au-urgent-chase | 客户情绪 / 全程 | high | 客户频繁催件、情绪升级、威胁差评/投诉 |
| au-fee-dispute | 费用争议 / 签收后 | medium | 垫付税费/末端附加费/改址费账单争议 |

### 加拿大 · `data/scenarios-ca.json`（12 条）
| ID | category / stage | severity | 场景核心 |
|---|---|---|---|
| ca-cbsa-exam | 清关异常 / 清关 | high | CBSA 查验（文件/实物）、放行慢 |
| ca-carm-rpp | 清关异常 / 清关 | high | CARM 强制化、Release Prior to Payment、进口商注册/保证金导致无法放行 |
| ca-duty-tax-dispute | 税费争议 / 清关 | high | 关税 + GST 5% + 省税 PST/HST、DDP 已含税争议 |
| ca-docs-missing | 清关异常 / 清关 | high | 商业发票要素不全、原产地、B3/报关资料问题 |
| ca-rail-port-delay | 时效延误 / 到港 | medium | 温哥华/鲁珀特王子港拥堵、铁路舱位紧张、内陆点延误 |
| ca-storage-demurrage | 费用争议 / 到港 | high | 滞港/堆存/滞箱费 |
| ca-delivery-failed | 派送异常 / 派送 | medium | 地址错、公寓无人、偏远附加费 |
| ca-damage | 货损短少 / 签收后 | high | 破损、水湿、托盘倾覆 |
| ca-shortage | 货损短少 / 签收后 | high | 少箱、丢件、短装 |
| ca-cfia-health | 合规风险 / 清关 | high | CFIA / Health Canada：食品、化妆品、医疗器械、木包装 |
| ca-urgent-chase | 客户情绪 / 全程 | high | 催件、情绪升级、要求赔偿/退款 |
| ca-fee-dispute | 费用争议 / 签收后 | medium | 税费垫付、末端费用、改址费争议 |

### 美国 · `data/scenarios-us.json`（12 条）
| ID | category / stage | severity | 场景核心 |
|---|---|---|---|
| us-cbp-exam | 清关异常 / 清关 | high | CBP 查验（VACIS/X-ray/CET）、放行慢 |
| us-isf-late | 清关异常 / 报关 | high | ISF 10+2 迟报/漏报、可能的罚金（$5,000 量级，需谨慎表述） |
| us-tariff-dispute | 税费争议 / 清关 | high | 301 关税、IEEPA 对等关税、2025-08-29 起 de minimis 全面暂停、DDP 税负争议 |
| us-hs-classification | 清关异常 / 清关 | high | HS/HTS 归类争议、海关改归类补税 |
| us-pga-hold | 合规风险 / 清关 | high | FDA / FCC / CPSC / USDA 等 PGA 扣留或需要额外资料 |
| us-port-rail-delay | 时效延误 / 到港 | medium | 洛杉矶/长滩/纽约拥堵、IPI 铁路延误、船期跳港 |
| us-demurrage-detention | 费用争议 / 到港 | high | demurrage / detention / storage 计费与争议 |
| us-delivery-failed | 派送异常 / 派送 | medium | 地址错、住宅附加费、无人签收、UPS/FedEx 退件 |
| us-damage | 货损短少 / 签收后 | high | 破损、水湿、挤压 |
| us-shortage | 货损短少 / 签收后 | high | 少箱、丢件、短装 |
| us-urgent-chase | 客户情绪 / 全程 | high | 催件、情绪升级、退款/赔偿诉求 |
| us-fba-appointment | 派送异常 / 派送 | medium | 亚马逊 FBA 预约/入仓、FC 拒收、箱规标签问题 |

---

## 4. 事实核验要求

- 任何具体政策/税率/时效/罚款数字，必须能指向**官方来源**，并写进 `authorities`。
- 优先使用同事 `research/clearance-brief.md`（若已生成）与 `research/policy-snapshot.json`；没有就自己用 web_search 核实。
- 今天 2026-11，**必须搜索 2025–2026 最新变化**，尤其是：
  - AU：BMSB 2025–26 季措施、ABF 系统迁移/海 cargo 报告、GST 10%、AUD 1000 门槛
  - CA：CARM 强制化与 RPP、GST 5% + 省税、CFIA 要求
  - US：de minimis 全面暂停（2025-08-29）、301/IEEPA 税率、ISF 24 小时规则、PGA 要求
- 找不到官方依据的，不要写死数字，用「通常/区间/以最新公告为准」，并在 `internal.guardrails` 里提示复核。
- 不要虚构「某客户案例」「某柜号」「某罚款金额」。

---

## 5. 合规红线（全库统一）

以下内容任何场景都不得出现：
1. 建议或暗示低报货值、改品名/HS 编码、拆单、改发票规避税费。
2. 承诺「100% 清关」「一定不查验」「保证赔偿」。
3. 承诺具体放行日期、具体退税/赔付金额。
4. 把责任推给海关/船司/客户，或评价他国执法。
5. 索要与清关无关的客户敏感信息（护照、银行密码等）。
6. 以「内部关系」「特殊渠道」暗示可以影响查验结果。

---

## 6. 输出与自检

1. 只写你负责的那个 JSON 文件（路径见任务），不要动别的文件。
2. 写完后必须用 node 校验：
   ```bash
   node -e "const d=require('./data/scenarios-au.json'); if(d.scenarios.length!==12) throw new Error('count'); const ids=new Set(); for(const s of d.scenarios){ if(ids.has(s.id)) throw new Error('dup '+s.id); ids.add(s.id); if(s.scripts.length!==3) throw new Error('scripts '+s.id); for(const sc of s.scripts){ for(const p of sc.placeholders||[]){ if(!sc.text.includes('{{'+p+'}}')) throw new Error('placeholder '+s.id+' '+p); } } } console.log('OK', d.scenarios.length)"
   ```
3. 检查每条英文话术词数（可用 node 统计），first 90–150、followup 50–90、close 60–110。
4. 用 send_message 向 lead 汇报：文件路径、条数、自检结果、哪些政策点标了「以最新公告为准」、还有哪些不确定。

**质量优先于速度。** 每条都要像真实货代售后主管会发出去的话，而不是模板拼接。
