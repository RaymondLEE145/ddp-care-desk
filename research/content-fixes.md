# 内容修复记录（P0 / P1 / P2）

- **执行时点**：2026-11-04（Asia/Shanghai）
- **改动文件**：`data/scenarios-au.json`、`data/scenarios-ca.json`、`data/scenarios-us.json`
- **未改动**：`assets/`、`server/`、`index.html`、`spec/`、`research/clearance-brief.md`、`research/content-audit.md`（仅在 audit 顶部加了一行“已修复”指向本文件）
- **产品口径（按主管拍板执行）**：DDP 默认含 duty/GST（澳：duty + GST；加：duty + GST/HST/PST；美：applicable duties），**除非报价单明确排除**。税单是“已含在 DDP 内的边境评税说明”，不是二次收费；报价明确排除时才另行收取。所有相关话术的 `use_when` 增加「发送前先确认报价单是否含税」，`internal.fee_policy` 同步。

---

## 一、P0（7 项，全部已改）

### P0-1 ｜ AU ｜ `au-duty-gst-dispute` ｜ `framework.facts`

- `facts[1]` 原句：「海关价值（customs value）以成交价为基础，不含起运地到澳洲的运费与保险」
- 改为：「海关完税价（customs value）本身不含国际运保费；但澳洲 GST 的税基 VoTI＝完税价＋关税＋国际运输与保险（CIF 基础再加关税），解释税单要按 VoTI 拆」
- 同步：`facts[0]` 删除「多数普货约 5%，纺织服装等品类更高」，改为「具体税率以 TAR 2026 与归类结果为准，不在话术里报固定税率」；`facts[2]` 改为「AUD 1,000 是 N10 与 SAC 的申报分界；GST 适用于所有应税进口，A$1,000 以下不等于免税」。

### P0-2 ｜ AU ｜ `au-duty-gst-dispute` ｜ `scripts[0]`、`scripts[2]`、`alts[0]`、`alts[1]`

- 新句（first）：“…The {{amount}} is 10 per cent GST plus customs duty, assessed at the border on this import. Because the consignment is above A$1,000 it needs a full N10 entry rather than a SAC declaration — GST applies to the import itself, not because of the threshold.”
- 新句（close）：“…assessed at the border on this import; above A$1,000 it needs a full N10 entry rather than a SAC declaration.”
- 新句（warm）：“…The A$1,000 line only decides between a full N10 entry and a SAC declaration; it isn't what makes the tax payable…”
- 新句（concise）：“…The A$1,000 line is about the entry type, not whether tax applies…”
- `use_when`（3 条）均加「发送前先确认报价单是否含税」。

### P0-3 ｜ AU ｜ `au-duty-gst-dispute` × `au-fee-dispute` ｜ DDP 含税范围

- 统一为「默认含税、报价明确排除才另收」。
- `au-duty-gst-dispute` first/close：DDP 含税为默认，税单是 rate 背后的评税说明，不是二次收费；`internal.fee_policy` 改为「DDP 默认含 duty 与 GST（除非报价单明确排除）；税单只作边境评税说明，不得二次收取…」。
- `au-fee-dispute` first：「the duty and GST are inside your DDP rate unless the quote explicitly excluded them…they aren't chargeable a second time」；`internal.fee_policy` 同步；`use_when`（3 条）加「发送前先确认报价单是否含税」。

### P0-4 ｜ CA ｜ `ca-duty-tax-dispute` × `ca-fee-dispute` ｜ DDP 含税范围

- `ca-duty-tax-dispute` first：「we cover duty, 5% federal GST and the provincial tax of the importing province, **unless the quote expressly excludes them**」；`fee_policy` 补「钢铝/钢衍生品附加税不在默认吸收范围」。
- `ca-fee-dispute` first：税单改为「inside your DDP rate unless the quote excluded it…the CBSA assessment behind the rate, shown for information, not a second charge」；`alt-warm`、`alt-concise` 同步；`fee_policy` 改为「DDP 默认含 duty 与 GST/HST/PST（除非报价单明确排除）…仅报价明确排除时才凭 CBSA 文件按实收取」；`use_when`（3 条）加确认报价。

### P0-5 ｜ CA ｜ `ca-carm-rpp` ｜ `scripts[1]`

- 原句：“…then a 15-digit RM account in the CARM Client Portal…”
- 改为：“…then an RM account (a 6-character program number such as RM0001) in the CARM Client Portal…”（CBSA《Get started with CARM》官方口径）。

### P0-6 ｜ CA ｜ `ca-carm-rpp` ｜ 5 条英文

- first 改为：「we're checking which importer account this entry sits under. If it's ours, {{bill_no}} moves on our financial security and you need to register nothing; if it's your BN, I'll send the two steps and file with you.」
- followup：「I'm confirming which importer account the entry sits under — if it's ours, no registration is needed from you; if it's yours, I'll send the two steps.」
- close：删掉 `where the entry is filed`，改为「you don't need a CARM account **as long as** the entry is filed under our importer account. If it turns out to be under your BN, I'll send the two steps and file with you.」
- 两条 alts 同步改为条件句；`use_when` 加「发送前先确认本票 IOR 归属」。

### P0-7 ｜ US ｜ `us-tariff-dispute` ｜ `scripts[1]`、`internal.resolution_path`

- 删掉 “the current Section 301 exclusion window is due to close in early November…before it lapses”。
- 新句：「our broker is checking whether any of your lines are covered, and the exclusion lists have changed repeatedly, so we'll confirm the current position rather than rely on a date.」
- `internal.resolution_path` 的「据报 2026-11-09 到期，待 USTR 核实」改为「以 USTR 当期公告为准，不对客报具体到期日」。

---

## 二、P1（14 项，全部已改）

1. **P1-1 ｜ 4 条 close 的绝对表述**：`au-customs-inspection` 改为 “Nothing additional was raised at release — no penalty and no extra duty”；`ca-cbsa-exam` 改为 “No penalty was raised and nothing additional was assessed at release; the entry stands as filed”；`us-cbp-exam` 改为 “No penalty was raised and nothing additional was assessed at release”；`us-pga-hold` 改为 “FDA released it without requiring reconditioning or refusing the goods, and nothing additional was assessed at release”。
2. **P1-2 ｜ AU `au-demurrage-storage`**：删掉 first 的 3 天/6 天与 followup 的 “not on our side”；改为「免费期起算与扣货占用比例以码头 statement 为准、按放行前后拆分」；两条 alts 里的 “six-day / six-day hold / a day past release” 一并删除。
3. **P1-3 ｜ CA `ca-storage-demurrage`**：first 改为「I have the CBSA release timestamp」；followup 删掉 4 天/2 天与 address change 的硬编码，改为「按 before/after release 拆分，放行后天数先谈再开票」；close 改为「terminal credited the pre-release days…remaining {{amount}} for the days after release」。
4. **P1-4 ｜ AU `au-port-congestion`**：删掉 “Both Sydney and Melbourne”，改为 “The terminal at {{port}} has been working through a berth backlog”；authorities 保留 ABF/港务局（见未改项）。
5. **P1-5 ｜ CA `ca-delivery-failed`**：“at the time on the sheet” → “at the time recorded on the run sheet”；“no storage charge has started accruing yet” → “I'll flag any storage charge before it starts, and query it if it does”。
6. **P1-6 ｜ US `us-delivery-failed`**：close 的 “absorbed half” 改为全额 “I've absorbed it”，与 `fee_policy`「我方录入错误由我方承担」一致。
7. **P1-7 ｜ CA `ca-cfia-health`**：first 不再四类并列，改为「Tell me which line is held — food, cosmetics, a medical device or the wood packaging — and I'll confirm only that requirement」；四类具体要求移入 `internal.resolution_path` 新增步骤；alt-warm 删除木包装段落；`use_when` 加「先问清被扣类别，只讲命中项」。
8. **P1-8 ｜ US `us-pga-hold`**：first 改为「The hold is with FDA on the prior notice and product code… If the hold turns out to be with CPSC, FCC or USDA instead, tell me…」，删掉 “not the goods” 断言；两条 alts 加「FDA hasn't raised a product issue so far」；`use_when` 标注「本条仅适用 FDA prior notice / product code 类扣留」。
9. **P1-9 ｜ CA `ca-duty-tax-dispute`**：followup 加「A 25% line, if present, is the steel/aluminium surtax; I'll verify the list and the melt-and-pour declaration.」；`fee_policy` 明确「差额吸收不含钢铝/钢衍生品附加税；附加税按合同与报价约定承担」。
10. **P1-10 ｜ AU `au-restricted-goods`**：first 改为「disposable nicotine vapes are prohibited imports — only limited therapeutic products can come in under Therapeutic Goods Administration arrangements」；两条 alts 同步；`guardrails[0]` 加「电子烟/TGA 口径待核实，发送前先向报关行复核」。
11. **P1-11 ｜ 缩写首现展开**：IEEPA（3 条）、CAPE（1 条）、NII（2 条）、CET（1 条）、CROSS（3 条）、CARM（3 条独立首响）、FMC（1 条）已展开；ChAFTA 在 AU followup 改为全称 “China–Australia Free Trade Agreement”。同线程的 followup/close 不再重复展开。
12. **P1-12 ｜ US `us-tariff-dispute`**：`alt-concise` 补 de minimis：「since 29 August 2025 the US$800 de minimis exemption has been suspended for all countries…the statutory end date is 1 July 2027」，不承诺退税。
13. **P1-13 ｜ AU `au-duty-gst-dispute`**：first 对账清单加「import processing charge and the biosecurity cost-recovery fee, which sit outside duty and GST」；`internal.resolution_path` 对账表补 IPC/FID，并新增核对项「IPC 档位（0/50/152）与 FID（海运 71 / 空运 48），与 duty/GST 分列」。
14. **P1-14 ｜ US `us-pga-hold` / `internal.facts[1]`**：改为「CPSC 儿童产品需 CPC、其他受规则约束的消费品需 GCC，2026-07-08 起强制 eFiling」；删除「审查通常 5 个工作日，扣留决定常见 45–60 天」，改为「PGA 审查时长以通知为准，不对客报固定天数」。

---

## 三、P2（指定项已改）

- **拼写/英美混用（US 线）**：`cancelled` → `canceled`（5 处：us-demurrage 的 first/followup/close/两条 alts）；`prioritise` → `prioritize`（us-damage close）。
- **10 条病句**：全部按 `research/content-audit.md` 4.4 表修完——
  - `au-shortage` first：“I've started properly.” → “I've started the checks.”
  - `au-demurrage-storage` followup：删 “…not on our side…”
  - `ca-delivery-failed` first：“at the time on the sheet” → “at the time recorded on the run sheet”
  - `ca-carm-rpp` close：“where” → “as long as”
  - `ca-fee-dispute` first：“nothing gets suspended” → “nothing is put on hold”（alt-concise 同步）
  - `ca-fee-dispute` followup：“three lines are ours and undisputed” → “three lines are ours to absorb”
  - `ca-cfia-health` first：“and it isn't” → “It isn't new”
  - `us-cbp-exam` first：“the lighter of the two” → “the lightest of the three”
  - `us-shortage` close：“short-landed cartons stayed at the warehouse” → “the cartons were left behind at the warehouse”
  - `ca-storage-demurrage` first：“on the date our broker has on file” → “I have the CBSA release timestamp”
- **其他已修的小句**：`us-delivery-failed` first“I can see the delivery failed” → “I've seen the failed delivery attempt”；`au-biosecurity-hold` first“I know this sounds worse than it is” → “I know how alarming a biosecurity hold looks”；`au-urgent-chase` close 删掉「My direct number is on this message…」（正文无号码，属悬空承诺）；`au-urgent-chase` first“at {{port}}” → “out of {{port}}”；`us-hs-classification` internal“19 USC 1592” → “19 U.S.C. § 1592”。
- **中文坏句**：`au-docs-missing` / `framework.facts[1]`「FCL 含非硬冻结冷柜同样需要」→「FCL 含实木包装或木托盘的同样需要」。
- **authorities（只换明显不对题、且新链接已实测 200）**：
  - AU `au-delivery-failed`、`au-damage`、`au-shortage`、`au-urgent-chase`：ABF → **ASBFEO**（<https://www.asbfeo.gov.au/>，官方，实测 200）。
  - AU `au-duty-gst-dispute`、`au-fee-dispute`：ATO 低值进口页 → **ABF GST/VoTI 页**（实测 200）。
  - US `us-damage`、`us-shortage`：FMC complaint + CBP 页 → **46 U.S.C. ch. 307（COGSA）govinfo 页**（实测 200）。
  - US `us-fba-appointment`：删除 Amazon 卖家页，保留 CBP 电商页（1 条）。
  - CA `ca-urgent-chase`：CBSA 联系页 → **Canadian Transportation Agency（Canada.ca 页，实测 200）**。

---

## 四、未改项及原因

| 项 | 未改原因 |
|---|---|
| `au-delivery-failed` / `ca-damage` / `us-damage` 等少数文本没有柜号/单号 | 硬约束「新增句子不得引入新 token」，因此不添加 `{{order_no}}`；已在 audit 中列为可选优化。 |
| `ca-storage-demurrage` followup、`ca-urgent-chase` followup 的 `placeholders: []` | 同上，补 token 属新增占位符，本次不做。 |
| `ca-delivery-failed` 的 Canada Post 链接 | 该场景是卡派/仓配，Canada Post 只是派送规则参考；没有可实测的、更对口的官方链接，按“不确定的保留并注明”处理。 |
| `us-delivery-failed`、`us-urgent-chase` 仍保留 FMC complaint 链接 | 末端卡车派送与客户情绪升级没有对口联邦监管机构；唯一可落地的官方升级路径仍是 FMC（若我方为 NVOCC）。按“不塞入无法验证的新链接”保留并注明。 |
| `us-port-rail-delay` 保留 FMC D&D 链接 | 港口拥堵无统一联邦页面；Port of LA 等链接未实测，不新增。 |
| `au-port-congestion` 保留 Port Authority NSW + ABF | Port Authority NSW 只覆盖悉尼，但 {{port}} 变量可能为其他口岸；已把文案改为不点名悉尼/墨尔本，authorities 留待 QA 按实际口岸替换。 |
| `us-tariff-dispute` 的 USTR 页面 | 页面可访问但为 2018–2020 清单索引，未覆盖 2025–2026 排除窗口；因无更好官方页，保留并在本文件标注。 |
| `au-biosecurity-hold` / `au-docs-missing` 的 DAFF 链接 | 本轮访问 403（与 brief 一致），无法确认是否仍为现行路径；不换未验证链接，留待 QA 实测。 |
| `us-tariff-dispute` framework 里 Section 122 的表述 | 按 brief 标 medium，本次未把话术写死；保留「以 CBP CSMS 为准」的 hedge，不动 framework 事实行。 |
| `us-demurrage-detention` close 的「two days」 | 属模板硬编码，但不在本次 P1-2 范围（P1-2 只点 AU/CA storage）；留待下一轮。 |

---

## 五、校验结果

> **工具限制说明**：本会话的 pwsh 在 workspace-write 沙箱下无法启动（exit 3221225794），因此无法执行 Node 脚本。改用 DSH 文件编辑工具以 UTF-8 直接修改 JSON，并用浏览器 `fetch` + `JSON.parse` 对三份文件做全量校验（与 Node 的 JSON.parse 等价）；结构、词数、占位符用同一页面脚本复算。

1. **JSON.parse**：`data/scenarios-au.json`、`-ca.json`、`-us.json` 全部通过。
2. **场景数与 ID**：36 条（AU/CA/US 各 12）；ID 与 `spec/CONTENT-BRIEF.md §3` 完全一致，无重复、无新增/删除。
3. **结构**：每场景 3 条 scripts（first/followup/close）、2 条 alts（warm/concise），phase/tone 未变；`guardrails` 恰好 3 条；`authorities` 1–2 条；`customer_signals`、`keywords` 未动。
4. **占位符**：180 条英文文本的 `{{token}}` 与 `placeholders` **0 处不匹配**；未新增/删除任何 token。
5. **禁用词/emoji/Markdown**：0。
6. **词数**：**180/180 全部在规范区间**（first 90–150、followup 50–90、close 60–110、alts 80–130）。改动后仍贴上限的条目：`au-duty-gst-dispute` first 150 / followup 90、`ca-carm-rpp` first 150 / followup 90、`ca-urgent-chase` first 150、`ca-fee-dispute` first 150、`us-tariff-dispute` first 150；alts 贴 130 的：`au-restricted-goods` warm 130、`ca-rail-port-delay` warm 130、`ca-damage` warm 130、`ca-urgent-chase` warm 130、`us-tariff-dispute` warm 130。均未越界。
7. **拼写**：US 线已无 `cancelled/prioritise`；AU `finalised`、CA `licence` 保留（正确）。

---

## 六、仍需人工拍板 / 复核

1. **AU DDP 含税条款落地**：话术已按“默认含税、报价明确排除才另收”统一，但报价单模板/合同是否真的写了“除非明确排除”这一条，需 pricing 确认；否则客服仍会遇到“报价确实没写含税”的旧合同。
2. **CA IOR 与 RPP 担保**：`ca-carm-rpp` 已改成条件句，但本票 IOR 归属、我方加拿大实体是否可作 IOR、RPP 担保额度是否覆盖，仍需报关行+法务确认后才能最终定稿。
3. **US 301 排除窗口与 Section 122**：需报关行按装运日 HTSUS/CSMS 复核；在本轮修复中已删除具体到期日，不再对客写死。
4. **DAFF 403**：BMSB 2026-27 季品类与木包装链接仍无法验证，需 QA 环境实测后再决定是否替换；`au-biosecurity-hold` 的 `framework.facts[2]`（按 B/L shipped-on-board 判定）也需报关行确认。
5. **AU 电子烟/TGA 路径**：已按「一次性尼古丁电子烟属禁止进口、仅有限治疗性产品可走 TGA 安排」改写，但 TGA 现行口径 brief 标“待核实”，对外发送前仍需报关行确认。
