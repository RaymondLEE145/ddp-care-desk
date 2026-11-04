# DDP 售后话术库 · 内容审校报告（AU / CA / US，36 场景）

- **审校对象**：`data/scenarios-au.json`、`data/scenarios-ca.json`、`data/scenarios-us.json`（36 场景 / 180 条英文文本 / 36 条中文 framework / 36 组 internal + authorities）
- **审校时点**：2026-11-04（Asia/Shanghai）
- **对照文件**：`research/clearance-brief.md`、`research/policy-snapshot.json`、`spec/CONTENT-BRIEF.md`
- **本轮核验的官方页面**（2026-11-04 打开）：ABF《GST and other taxes》（更新 2026-10-20）、ABF《Import Processing Charges》（更新 2026-10-20）、CBSA《Get started with CARM》（更新 2026-08-07）、CBP《IEEPA Duty Refunds》、USTR《China Section 301-Tariff Actions and Exclusion Process》；DAFF 页面返回 403（与 brief 记录一致）。
- **边界**：只写本报告，未改动 `data/`、`assets/`、`server/` 下任何文件。
- **词数口径**：按英文词元统计（连续的字母/数字串为 1 词，破折号、标点不计），与 Word 计数可能相差 1–2 词。
- **2026-11-04 更新**：P0 7 项、P1 14 项及 P2 指定项已在三个数据文件中修复；逐项改动、未改项与词数复算见 `research/content-fixes.md`。本报告的诊断内容保留原样，供对照。

---

## 一、总评（3–5 句）

这套话术的英文底子明显高于常规模板库：180 条文本里没有一个禁用套话、没有 emoji / Markdown 符号，绝大多数的共情点、动作承诺和下一次同步时间都落在真实业务细节上，读起来像负责这票货的人在打字，而不是客服机器人。结构合规也近乎满分：36 个 ID 与 brief 完全对上，12/12/12 分布正确，枚举值、3 条 scripts、2 条 alts、占位符白名单与正文 `{{token}}` 全部自洽，0 处不匹配。

真正的问题不在语言，而在**事实口径与跨场景一致性**：澳洲 GST 税基被写成了「不含运保费」，而 ABF 的 VoTI 明确包含 T&I；澳、加两条线各自在「DDP 含不含税」上出现了互相打脸的两套说法；加拿大 CARM 话术把 RM 号写成 15 位（官方为 6 位，如 RM0001），并把「本票以我方进口商账户申报」当作既定事实写进 5 条英文；美国 301 排除清单「11 月初到期」这一 brief 自标 medium 的说法，被当成对客事实写了出去。

这些问题的共同特点是**修复成本极低**（改 1–2 句、加一处条件限定即可），但如果不改，客服会在同一天对不同客户说出互相矛盾、且与官方口径不符的话，比文字不漂亮严重得多。

---

## 二、P0 必须改（7 项）

### P0-1 ｜ AU ｜ `au-duty-gst-dispute` ｜ `framework.facts[1]`

- **原文**：“海关价值（customs value）以成交价为基础，不含起运地到澳洲的运费与保险”
- **问题**：把「完税价 CV」与「GST 税基 VoTI」混为一谈。ABF 明确：VoTI = CV + 关税（含反倾销/反补贴税）+ 国际运输与保险费（T&I）+ WET；即 GST 是 **CIF 基础再加关税**，运保费必须计入。按现文字，客服会在税单争议里告诉客户「GST 不含运费」，直接说错，且 brief §1.3 与官方页面都与此冲突。
- **最小改法**：改为「海关完税价（CV）本身不含国际运保费；但澳洲 GST 的税基 VoTI ＝ CV＋关税＋国际运保费（CIF 基础再加关税），解释税单时必须按 VoTI 拆，不能只说 CV」。
- **来源**：ABF《GST and other taxes》（页面原文 “the value of the taxable importation is the sum of the customs value… the amount paid or payable to transport the goods to Australia and to insure the goods for that transport… and any duty payable”）。

### P0-2 ｜ AU ｜ `au-duty-gst-dispute` ｜ `scripts[0].text`、`scripts[2].text`、`alts[0].text`、`alts[1].text`

- **原文**：
  - first：“The {{amount}} is GST at 10 per cent plus customs duty, raised at the border because the customs value of this consignment is above A$1,000.”
  - close：“The {{amount}} is duty and 10 per cent GST raised at the border because the customs value is above A$1,000.”
  - warm：“…raised at the border because the customs value is above A$1,000. That threshold sits with the ATO and ABF, and above it tax is payable on import.”
  - concise：“…raised at the border because the customs value exceeds A$1,000. That's a statutory threshold, not a fee we've added.”
- **问题**：因果写反。GST/关税之所以在边境缴，是因为该票构成应税进口（taxable importation），**不是**因为货值超过 A$1,000。A$1,000 只决定申报通道（≤A$1,000 可走 SAC 自评，>A$1,000 须 N10），以及低值进口 GST 的征收机制；≤A$1,000 并不等于「没有 GST」。这句话会被客户抓住反问「那我 900 澳元的货就不用交 GST？」，也会在税单争议里削弱我方专业性。另有把 A$1,000 门槛说成“sits with the ATO and ABF”（warm 版）——门槛是海关申报规则，不是 ATO 与 ABF 共同设定的收费阈值。
- **最小改法**：四句统一改成“is 10 per cent GST plus duty, assessed at the border on this import; because the consignment is above A$1,000 it needs a full N10 entry rather than a SAC declaration.”（保留原句长度，不新增承诺）。
- **来源**：ABF《GST and other taxes》（GST 适用于 taxable importations，税率 10% of VoTI）；brief §1.1（>AUD1,000 须 N10、≤AUD1,000 用 SAC）。

### P0-3 ｜ AU ｜ `au-duty-gst-dispute` × `au-fee-dispute` ｜ DDP 含税范围自相矛盾

- **原文 A（`au-duty-gst-dispute` / `scripts[2].text`）**：“Your DDP rate covered freight, clearance and delivery — tax at the border sits outside that unless the quote said otherwise, and I've checked what yours said.”
- **原文 B（`au-fee-dispute` / `scripts[0].text`）**：“…the duty and GST were already inside your DDP rate and appear on the statement for information only; they aren't chargeable a second time.”
- **原文 C（`au-fee-dispute` / `scripts[2].text`）**：“Duty and GST stay on the statement for information only. They're not a second charge; your DDP rate covered them and the entry shows it.”
- **问题**：同一个国家、同一个 DDP 产品，A 说税在 DDP 之外，B/C 说税已在 DDP 之内。客户如果先收到 A 再收到 B（或两个客服各发一条），会直接认定我方口径混乱；这也会让「重复收费」这个核心争议无法解释。`au-fee-dispute` / `internal.common_causes` 甚至把「税费已在 DDP 内含，却在账单上被重复列示」写成既定成因，进一步坐实矛盾。
- **最小改法（二选一，建议选 1）**：
  1. **默认含税**：把 A 改为“Your DDP rate includes duty and GST unless the quote says otherwise — this statement is the border assessment behind that rate, not a second charge.”，与 B/C 对齐；
  2. **默认不含税**：把 B/C 改为“duty and GST sit outside the DDP rate unless the quote says otherwise”，并在两处 `internal.fee_policy` 同步。
  无论选哪个，都应在 `use_when` 里加一句「先确认报价单是否含税」。
- **说明**：这不是措辞问题，是产品定义问题，需要 pricing 拍板（见第七节第 1 条）。

### P0-4 ｜ CA ｜ `ca-duty-tax-dispute` × `ca-fee-dispute` ｜ DDP 含税范围自相矛盾

- **原文 A（`ca-duty-tax-dispute` / `scripts[0].text`）**：“On a DDP shipment we cover duty, 5% federal GST and the provincial tax where the goods are imported.”
- **原文 B（`ca-fee-dispute` / `scripts[0].text`）**：“The tax line is a disbursement, not a mark-up: we paid the duty and GST to clear the goods and are recovering what was assessed, and I'll send the CBSA document with it.”
- **原文 C（`ca-fee-dispute` / `internal.fee_policy`）**：“垫付的关税与 GST/HST 凭 CBSA 文件按实报实销”。
- **问题**：与 AU 同类。A 说 DDP 覆盖 duty/GST；B、C 说税是代垫、要向客户实报实销。加拿大 DDP 的现金流压力本来就集中在「谁垫税、谁挂担保」，这两套口径会让客户在税单和账单两个场景得到相反答案。
- **最小改法**：与 P0-3 同一决策。若默认含税，B 改为“The tax line is already inside your DDP rate; it's shown for information, and the CBSA document is attached so your accountant can see what was assessed.”，并把 C 改为「DDP 已含项目不得二次收取；仅报价明确排除时才可凭 CBSA 文件实报实销」。

### P0-5 ｜ CA ｜ `ca-carm-rpp` ｜ `scripts[1].text`

- **原文**：“…the order is Business Number from the CRA, then a 15-digit RM account in the CARM Client Portal, then financial security.”
- **问题**：RM 号不是 15 位。CBSA 官方注册页明确：“The RM is a 6-digit number (example: RM0001)”。对客户说 15 位会让财务在门户里找不到对应字段，直接损害可信度；也会让 followup 这条「给步骤」的消息变成错误指引。
- **最小改法**：改为“then an RM account — a 6-character program number such as RM0001 — in the CARM Client Portal”。
- **来源**：CBSA《Get started with CARM》“Import-export program (RM) account”（页面更新 2026-08-07）。

### P0-6 ｜ CA ｜ `ca-carm-rpp` ｜ `scripts[0].text`、`scripts[1].text`、`scripts[2].text`、`alts[0].text`、`alts[1].text`

- **原文（first）**：“The good news is that on this shipment the entry is filed under our importer account, so {{bill_no}} moves on our financial security and you don't need to register anything.”
- **原文（close）**：“To close the loop: you don't need a CARM account where the entry is filed under our importer account.”
- **问题**：5 条英文把「以我方进口商账户申报」写成既定事实，而同一场景的 `internal.guardrails[0]` 明确要求「发送话术前必须确认本票的进口商归属：若申报使用客户 BN，话术里不得说『以我方进口商账户申报』」。两者直接冲突。更严重的是，DDP 是商业术语，**不改变法定纳税义务人**（brief 合规声明与 §3.3），把「IOR 是我们」当成对客承诺，一旦本票实际用客户 BN 申报，就是错误陈述，且会让客户以为 CARM 责任已转移。另 `close` 句法也错（“where the entry is filed” 应为 “as long as the entry is filed”）。
- **最小改法**：把断言改成「先确认、再告知」的条件句，例如：“I'm confirming the importer of record on this entry today. If it sits under our account you need to do nothing; if it's under yours, I'll send the two steps and handle the filing with you.”；并在 `use_when` 标注「仅当本票 IOR 为我方时可直接发送 first，否则用上面条件版」。
- **说明**：这是法务/报关行必须拍板的结构问题（见第七节第 2 条），不是文案能单独解决的。

### P0-7 ｜ US ｜ `us-tariff-dispute` ｜ `scripts[1].text`

- **原文**：“One possible angle is an exclusion — the current Section 301 exclusion window is due to close in early November, so our broker is checking whether any of your lines were covered before it lapses.”
- **问题**：brief §3.1 把「301 排除清单 2026 年 11 月到期」标为 **medium/待核实**（“据二手报道”）；数据内部也写「据报 2026-11-09 到期，待 USTR 核实」。对客话术却写成 “due to close in early November”，等于把二手信息升级为确定日期，并制造「赶在失效前」的紧迫感。USTR 该页（本轮已核验）仍是 2018–2020 清单与旧排除流程索引，并未给出 2025–2026 排除窗口的到期日，无法支撑这句话。
- **最小改法**：改为“our broker is checking whether any Section 301 exclusion still applies to your codes; the exclusion lists have changed repeatedly, so I'll confirm the current position rather than rely on the last date we heard.”
- **来源**：brief §3.1（medium/待核实）；USTR 页面本轮核验无 2026 到期表述。

---

## 三、P1 建议改（14 项）

### P1-1 ｜ 三国 ｜ 4 条 close ｜ 放行即断言「无补税 / 无复议」

- **原文**：
  - `au-customs-inspection` / `scripts[2].text`：“No penalty, no extra duty, and the entry is now finalised.”
  - `ca-cbsa-exam` / `scripts[2].text`：“No penalty, no re-assessment, and the entry is at final accounting.”
  - `us-cbp-exam` / `scripts[2].text`：“…no penalties, no additional duty.”
  - `us-pga-hold` / `scripts[2].text`：“No reconditioning, no refusal, and no additional duty from the agency review.”
- **问题**：放行不等于终局。澳洲可后续改单/追缴，加拿大 CBSA 有 4 年重新评估期，美国要走到 liquidation/reliquidation 才算定。把「no re-assessment / no additional duty」写死，一旦后续评税调整，客户会拿这句话反诉我方承诺。这不是大错，但正好踩在 brief「不承诺结果」的红线上。
- **最小改法**：统一改为「放行时未加征」的时点表述，如 “Nothing additional was raised at release” / “No penalty was raised on the exam”，删掉 “finalised / final accounting / no re-assessment”。

### P1-2 ｜ AU ｜ `au-demurrage-storage` ｜ `scripts[0].text`、`scripts[1].text`、`scripts[2].text`

- **原文（first）**：“The first three days fall inside the free period, so the chargeable portion is the balance.” / “the DAFF hold on the timber packaging ran for six days, and the container wasn't collected until the day after release.”
- **原文（followup）**：“It confirms the free days were consumed during the biosecurity hold, not on our side, and the chargeable window starts after release.”
- **原文（close）**：“The remaining {{amount}} covers the window after release, when collection was arranged but the container wasn't picked up.”
- **问题**：三段时间线互相对不上。first 说免费期吃掉 3 天、其余在扣货期内计费；followup 说免费期在扣货期间被消耗、**计费窗口从放行后开始**；close 又把剩余金额说成放行后「已安排提货但没提走」的窗口。若计费从放行后开始，扣货期内就不该有可计费天数；若扣货期内已有可计费天数，close 的说法又缺依据。另外 3 天/6 天都是硬编码，brief 明确「免堆 3–7 天，以码头公告为准」，模板里写死会与真实账单冲突。
- **最小改法**：first 删掉 “The first three days…” 与 “six days”，改为「免费期在扣货期间被耗尽（具体起算与免费天数以码头 statement 为准），我先按放行后计费向码头核对」；followup 保留「免费期被扣货消耗」，删掉“not on our side”；close 点明放行后延迟的**具体归属**（谁没提走），不要用被动句含糊。

### P1-3 ｜ CA ｜ `ca-storage-demurrage` ｜ `scripts[1].text`

- **原文**：“Short version: four days were terminal backlog and the examination, which we're absorbing; two days fell after release, when delivery couldn't be booked because of the address change.”
- **问题**：4 天/2 天是硬编码；更关键的是「address change（改址）」这个成因只在 followup 出现，first 的成因清单是「terminal backlog / examination / waiting on documents」，没有改址。三条消息连起来看，客户会觉得我方在换说法。close 又写 “the terminal credited the four days”，把硬编码数字固定成事实。
- **最小改法**：first 的成因句补上 address change，或 followup 改成「放行后那两天是改址导致无法预约」并在 close 用「码头核对后的实际天数」而非 4 天；模板中尽量不写死天数。

### P1-4 ｜ AU ｜ `au-port-congestion` ｜ `scripts[0].text`

- **原文**：“Both Sydney and Melbourne have been working through heavy berth congestion, and when a vessel misses its window the queue behind it shifts with it.”
- **问题**：本条 `{{port}}` 可能是布里斯班或弗里曼特尔（brief §1.5 明确列出四个口岸），但话术固定说「悉尼和墨尔本都拥堵」。若客户货在布里斯班，这句话会立刻穿帮；authorities 又只给了 Port Authority of NSW，也只覆盖悉尼。
- **最小改法**：改为“Berth congestion has been heavy across the east coast this month, {{port}} included”，或直接“the terminal at {{port}} has been working through a berth backlog”；authorities 换成覆盖该口岸的港务局或保留 ABF。

### P1-5 ｜ CA ｜ `ca-delivery-failed` ｜ `scripts[0].text`、`scripts[1].text`

- **原文（first）**：“The driver attempted at the time on the sheet, couldn't get an answer at the unit…”
- **原文（followup）**：“The depot has confirmed the cartons are intact and that no storage charge has started accruing yet.”
- **问题**：第一句 “at the time on the sheet” 是病句/指代不清，应为 “at the time recorded on the run sheet”。第二句「还没开始计仓储费」是未证实的断言——派送失败货回 depot 后，仓储费是否起算取决于 depot 政策与免费期，客服不应替 depot 保证。
- **最小改法**：“The driver attempted at the time recorded on the run sheet…”；“The depot has confirmed the cartons are intact. I'll flag any storage charge before it starts, and query it if it does.”

### P1-6 ｜ US ｜ `us-delivery-failed` ｜ `scripts[2].text`

- **原文**：“The address correction cost {{amount}}, which is the carrier's standard fee, and I've absorbed half of it because we should have caught the missing suite when we confirmed the order.”
- **问题**：逻辑与内部政策冲突。既然承认「我们确认订单时应该发现缺 suite」，就是我方责任；而 `internal.fee_policy` 写的是「因我方地址录入错误产生的费用由我方承担」。只吸收一半，等于让客户为我方过错付一半，且 `{{amount}}` 无法表达「一半」，客服无法正确填数。也与 guardrail「不指责客户地址写错」的善意口径不协调。
- **最小改法**：二选一——(a) 全额承担：“I've absorbed the address correction — the missing suite should have been caught when we confirmed the order.”；(b) 若确属客户提供地址错误，则明确“the carrier charged {{amount}} for the address correction; here's the document”，不要用「吸收一半」这种中间态。

### P1-7 ｜ CA ｜ `ca-cfia-health` ｜ `scripts[0].text`

- **原文**：“What I've confirmed: the shipment is held because the goods fall under CFIA or Health Canada requirements… Food needs an importer licence and preventive controls under the Safe Food for Canadians Regulations. Cosmetics need a notification. Medical devices need a licence for their class. Solid wood packaging needs ISPM 15 treatment and the IPPC mark…”
- **问题**：一条首响把四种监管制度并列，客户只可能命中其中一种；读起来像合规手册，不像在回应「我的化妆品为什么被扣」。这也是全库最明显的「模板感」段落。另 `use_when` 仍写「客户第一次被告知 CFIA 或 Health Canada 要求补件」，没有限定品类。
- **最小改法**：首响只讲命中那一类（例如化妆品：notification + ingredient/label），其余三类移入 `internal.resolution_path` 或作为客服分支；或在首响加一句“Tell me which line is held — food, cosmetics, a device or the pallets — and I'll confirm only the requirement that applies, instead of listing all four.”

### P1-8 ｜ US ｜ `us-pga-hold` ｜ `scripts[0].text`、`scripts[2].text`

- **原文**：“The hold is with FDA, and the issue is the prior notice and product code on the entry, not the goods.”
- **问题**：两处越界。其一，在 FDA 尚未完成审查前断言「不是货物本身的问题」，如果后续转 Detention/抽样，就是我方误导；其二，本条场景覆盖 FDA / FCC / CPSC / USDA，但三条 scripts 与两条 alts 全部写死 FDA，遇到 CPSC 或 FCC 扣留时整条话术不可用。`use_when` 也没限定 FDA。
- **最小改法**：改为“The hold is with FDA on the prior notice and product code — that's the part we can fix now; FDA hasn't raised a product-compliance issue so far.”；并在 `summary_zh` / `use_when` 标注「本条仅适用 FDA prior notice / product code 类扣留，CPSC/FCC/USDA 另建场景」。

### P1-9 ｜ CA ｜ `ca-duty-tax-dispute` ｜ `scripts[0..2].text`、`internal.fee_policy`

- **问题**：`customer_signals[3]` 明确是“为什么这批多收了 25%？之前从没有过”，`keywords` 含「钢铝 / 附加税」，但三条 scripts 没有一句解释 25% 附加税（含中国熔炼浇铸钢/铝、钢衍生品）。同时 `internal.fee_policy` 写「实际评税高于预估且申报口径一致的，差额由我方吸收」——若真按此执行，25% 附加税会被 DDP 默认吸收，这是重大成本敞口，不太可能是本意。
- **最小改法**：在 followup（有据可依那条）加一句“If there's a 25% line, it's the steel/aluminium surtax, not a GST error — I'll show you which list and rate applies and whether your supplier's melt-and-pour declaration supports it.”；`fee_policy` 补「附加税按合同/报价约定承担，不在默认吸收范围」。

### P1-10 ｜ AU ｜ `au-restricted-goods` ｜ `scripts[0].text`、`alts[1].text`

- **原文**：“…a carton of disposable vapes containing nicotine… nicotine vapes can't be imported without a Therapeutic Goods Administration permit.”
- **问题**：brief §1.6 把澳洲电子烟/TGA 现行规定标为 **待核实**；而「没有 TGA permit 就不能进口」这句暗示「有 permit 就能进」，对一次性非治疗性电子烟并不成立（这类产品本身属禁止进口范畴，TGA 通路只覆盖有限的治疗性产品）。对客户说错这一点，可能诱导供应商去办一个根本不适用的许可。
- **最小改法**：改为“disposable nicotine vapes are prohibited imports; only limited therapeutic products may come in under TGA arrangements — I'll confirm the current rule with our broker before we advise your supplier.”；同步在 `internal.guardrails` 标注「TGA 口径待核实」。

### P1-11 ｜ 三国 ｜ 15 条文本 ｜ 缩写首次出现未展开

- **清单**：`us-tariff-dispute` first / alt-warm / alt-concise（IEEPA、CAPE、CBP、HTS）；`us-cbp-exam` first / followup（NII、CET）；`us-hs-classification` first / alt-warm / alt-concise（CROSS）；`ca-carm-rpp` 5 条（CARM）；`au-duty-gst-dispute` followup（ChAFTA）；`us-demurrage-detention` followup（FMC）。
- **问题**：`spec/CONTENT-BRIEF.md §2.4` 明确要求「缩写首次出现给全称」，并点名 ABF / CBSA / CBP / ISF / PGA。现在 ABF、CBSA、CBP（多数场景）、ISF、PGA 做得很好，但 IEEPA、CAPE、NII、CET、CROSS、CARM、ChAFTA、FMC 在各自消息里都是裸缩写。尤其 IEEPA 是客户退税诉求的核心概念，不展开会影响理解。
- **最小改法**：每条消息内首次出现时展开一次，例如 “IEEPA (International Emergency Economic Powers Act)”、“CAPE (the Consolidated Administration and Processing of Entries)”、“NII (non-intrusive inspection)”、“CET (Contraband Enforcement Team)”、“CROSS (Customs Rulings Online Search System)”、“CARM (CBSA Assessment and Revenue Management)”、“ChAFTA (China–Australia Free Trade Agreement)”、“FMC (Federal Maritime Commission)”。同一线程后续可继续用缩写。

### P1-12 ｜ US ｜ `us-tariff-dispute` ｜ `scripts[0..2].text`、`summary_zh`、`keywords`（de minimis 缺位）

- **问题**：场景标题、`summary_zh`、`keywords` 都含 de minimis，`internal.common_causes` 也写「de minimis 暂停后低值货也要缴税，客户不知情」，但三条 scripts 与两条 alts 没有一句解释 de minimis 暂停。brief 把 de minimis 列为「本章最重要事实」，而本场景恰恰是客户问「为什么小额货也要交税」时最该用的一条。现在客服只能回答 301/IEEPA，答不了 de minimis。
- **最小改法**：在 followup 或某一 alt 里补一句事实（不新增承诺）：“Since 29 August 2025 the US$800 de minimis exemption has been suspended for all countries, so even small consignments are entered and duty applies; the statutory end date is 1 July 2027.” 若不想改 scripts 结构，可在 `use_when` 增加「客户问低值免税时改用 alt-concise，并口头补此句」。

### P1-13 ｜ AU ｜ `au-duty-gst-dispute` ｜ `scripts[0].text`、`internal.resolution_path`

- **问题**：first 承诺 “itemised reconciliation”，`internal.resolution_path` 也写「逐项对账表（运费、清关、duty、GST、其他费用）」，但全程没有提 **IPC（进口处理费）** 与 **DAFF 生物安全 FID 费**。brief §1.3 明确这两项是最常见的成本漏项（海运 FID AUD71；IPC 50/152 分档），客户看到税单比「duty+GST」高，第一反应就是被多收；我方却无法在话术里解释这两行。
- **最小改法**：在 first 的 reconciliation 清单里加“the import processing charge and the biosecurity cost-recovery fee, which are separate from duty and GST”，并在 `internal.resolution_path` 补「核对 IPC 档位与 FID 71/48」。authorities 可加 ABF IPC 页面。

### P1-14 ｜ US ｜ `us-pga-hold` ｜ `internal.facts[1]`

- **原文**：“CPSC 消费品需 CPC，2026-07-08 起强制 eFiling，审查通常 5 个工作日，扣留决定常见 45–60 天”
- **问题**：两处事实不严谨。① CPC（Children's Product Certificate）只适用于**儿童产品**；其他受 CPSC 规则约束的消费品需要 GCC（General Certificate of Conformity），不能一概说「CPSC 消费品需 CPC」。②「扣留决定常见 45–60 天」没有来源，且与 brief §3.4 的「PGA hold 5–30 个工作日（FDA 更久）」不在一个量级，客服拿去承诺时间会出事。
- **最小改法**：改为「CPSC 管制的儿童产品需 CPC，其他受规则约束的消费品需 GCC；2026-07-08 起强制 eFiling」；删掉 45–60 天，或改为「实际时长以 PGA 通知为准，不对客报固定天数」。

---

## 四、P2 润色建议（合并同类）

### 4.1 authorities：11 条明显不对题，2 条链接风险

brief 要求 authorities 为「与场景相关的真实官方链接」。结构上都合规（1–2 条、官方域名），但以下 11 条与场景无关，属于「为填字段而填」：

| 场景 | 现有 authority | 问题 | 建议 |
|---|---|---|---|
| `au-delivery-failed` | ABF — Importing goods | 派送失败与海关无关 | 换澳洲公路/派送行业规范或保留但标注“参考” |
| `au-damage` | ABF — Importing goods | 货损与海关无关 | 换保险/海事责任相关官方说明（如 AMSA 或保险条款） |
| `au-shortage` | ABF — Importing goods | 短少与海关无关 | 同上 |
| `au-urgent-chase` | ABF 首页 | 情绪升级与海关无关 | 可留空或换公司投诉流程页 |
| `ca-delivery-failed` | Canada Post | 我方是卡派/仓配，不是 Canada Post | 换承运商条款或删 |
| `ca-urgent-chase` | CBSA — Contact | 与情绪升级无关 | 换公司投诉/升级流程 |
| `us-delivery-failed` | FMC — Filing a complaint | FMC 不管末端派送 | 换承运商索赔条款或删 |
| `us-damage` | FMC complaint + CBP cargo security | 两条都不对题 | 换 COGSA/承运人责任说明 |
| `us-shortage` | FMC complaint + CBP exam | 两条都不对题 | 同上 |
| `us-urgent-chase` | FMC complaint | 不对题 | 换公司升级流程 |
| `us-fba-appointment` | CBP e-commerce + Amazon 卖家页 | Amazon 不是官方机构；CBP 页与 FBA 预约无关 | 删 Amazon，保留 CBP 并说明“仅关务背景” |

另有 3 组链接风险（本轮无法完全验证）：
- `au-biosecurity-hold` / `au-docs-missing` 的 `www.agriculture.gov.au/import/goods/timber-packaging` 与 BMSB 页面：本轮访问均 403（与 brief 记录一致），无法确认是否仍为现行路径；建议在 QA 环境实测 200 后固定，或改用 BICON 入口 <https://bicon.agriculture.gov.au/>。
- `us-tariff-dispute` 的 USTR `section-301-investigations/tariff-actions`：页面可访问，但内容仍是 2018–2020 清单索引，未覆盖 2025–2026 排除窗口；不能作为「11 月到期」的依据。
- `ca-docs-missing` 的 D17-1-10、`ca-fee-dispute` 的 D17-2-1：页面均存活（Date modified 2024-10-21），但只剩「CARM 是 system of record」+ PDF 外壳，信息量低；`ca-docs-missing` 更贴题的应是 D1-4-1（已在列表中）。

### 4.2 英美拼写混用（US 线 6 条文本）

- `us-demurrage-detention` first / followup / close / alt-warm / alt-concise：`cancelled`、`cancellation` → 美式 `canceled`、`cancellation`（AP 风格）。
- `us-damage` close：“I'll prioritise the booking” → `prioritize`。
- 澳线 `finalised`、加线 `licence`（名词）都是对的，不要改。

### 4.3 标点与句式偏好（风格，不违反规范）

- 180 条文本中 **149 条含破折号「—」**（83%），已经形成明显的“house style”。破折号不是错，但连续 3–4 条消息都用同一个节奏，客户会感到模板化。建议每条首响最多 1 个破折号，其余改用句号或逗号。
- 高频签名句：`I know…` 27 条、`straight/honest` 27 条、`won't give/put/quote/promise` 9 条。尤其 “I won't give you a date I can't stand behind”（CA first）与 “I won't put a date on it”（AU first）是同一句的两种写法，建议保留 2–3 处、其余换表达。
- 开头全部是 “Hi {{customer_name}}, I know / I can see / I understand / I'm sorry…”，36/36 一致。WhatsApp 场景可以接受，但 alt 版本可以尝试 “Thanks for flagging this — …” / “Quick one on …” 之外的开场（已有部分 followup 这样做）。

### 4.4 逐句小修（按 id + 字段定位）

| 场景 | 字段 | 原句 | 建议 |
|---|---|---|---|
| `au-shortage` | `scripts[0].text` | “I've started properly.” | “I've started the checks.”（原句歧义，像在说“我开始得很得体”） |
| `au-demurrage-storage` | `scripts[1].text` | “…not on our side…” | 删掉。免费期被扣货消耗与“我们这边”无关，逻辑上多此一举 |
| `ca-carm-rpp` | `scripts[2].text` | “you don't need a CARM account where the entry is filed under our importer account” | “as long as the entry is filed under our importer account” |
| `ca-fee-dispute` | `scripts[0].text` | “Nothing is due while we review, and nothing gets suspended.” | “Nothing is due while we review, and nothing is put on hold.” |
| `ca-fee-dispute` | `scripts[1].text` | “three lines are ours and undisputed” | “three lines are ours to absorb” 或 “three lines are ours, and I'm not disputing them”（原句歧义：到底是我们承担，还是我们主张？） |
| `ca-cfia-health` | `scripts[0].text` | “I know this feels like a rule appearing out of nowhere, and it isn't — but that doesn't help you today.” | “I know this feels like a rule appearing out of nowhere. It isn't new, but that doesn't help you today.”（“and it isn't”指代不明） |
| `us-cbp-exam` | `scripts[0].text` | “which is the lighter of the two” | 前文列了 NII、tailgate、CET 三类；“the lightest of the three” 或 “lighter than a tailgate or CET exam” |
| `us-shortage` | `scripts[2].text` | “the short-landed cartons stayed at the warehouse” | short-landed 指“卸船短卸”，不是“留在仓库”；改为 “the cartons were left behind at the deconsolidation warehouse” |
| `us-delivery-failed` | `scripts[0].text` | “I can see the delivery failed” | “I've seen the failed delivery attempt”（原句像在陈述系统状态） |
| `au-biosecurity-hold` | `scripts[0].text` | “I know this sounds worse than it is” | 略居高临下；改 “I know how alarming a biosecurity hold looks” |
| `ca-storage-demurrage` | `scripts[0].text` | “CBSA released it on the date our broker has on file” | 含糊；改 “CBSA released it, and I have the release timestamp” |
| `au-urgent-chase` | `scripts[2].text` | “My direct number is on this message.” | 正文没有号码占位符，客户找不到；加 `{{agent_name}}` 不够，建议补电话字段或删掉此句 |
| `au-urgent-chase` | `scripts[0].text` | “…waiting on a delivery booking at {{port}}” | 已放行的柜子在派送环节，不再“at port”；改 “waiting on a delivery booking out of {{port}}” |
| `au-delivery-failed` | `scripts[0].text` / `scripts[2].text` | 首响与 close 都没有任何单号 | 补 `{{order_no}}` 或 `{{container_no}}`，否则多票客户无法对应 |
| `us-hs-classification` | `internal.facts[0]` | “19 USC 1592” | 统一为 “19 U.S.C. § 1592”（brief 与美式引用规范） |

### 4.5 中文 framework 病句/错字

- `au-docs-missing` / `framework.facts[1]`：“LCL 拼箱必须提供包装声明；FCL 含非硬冻结冷柜同样需要。”——**“非硬冻结冷柜”是坏句**（疑为“FCL 含实木包装同样需要”或“FCL 中的非硬质包装”）。必须重写，否则客服看不懂。
- `au-duty-gst-dispute` / `framework.facts`：“大多数普货约 5%，纺织服装等品类更高”——“纺织服装更高”未见依据（澳洲 TCF 多数税目在 5% 档，实际须按 TAR 2026 与归类结果核实），建议改为“以 TAR 2026 与归类结果为准”，不要写“更高”。
- `au-demurrage-storage` / `framework.facts`：“免费堆存期通常从卸船或可提柜起算”——建议补“各码头不同，以免堆期公告为准”，与 `internal.guardrails` 已有的提示一致。
- 其余 framework 的五段结构、条数（2–4 条）与可执行性均达标，无需逐条改。

### 4.6 词数越界（7/180，3.9%）

| 场景 | 字段 | 实测 | 上限 | 超出 |
|---|---|---|---|---|
| `ca-storage-demurrage` | `scripts[0].text` | 154 | 150 | +4 |
| `ca-urgent-chase` | `scripts[0].text` | 152 | 150 | +2 |
| `ca-carm-rpp` | `scripts[0].text` | 152 | 150 | +2 |
| `us-tariff-dispute` | `scripts[0].text` | 152 | 150 | +2 |
| `ca-storage-demurrage` | `alts[0].text` | 134 | 130 | +4 |
| `ca-shortage` | `alts[0].text` | 132 | 130 | +2 |
| `ca-carm-rpp` | `alts[0].text` | 132 | 130 | +2 |

其余 173 条全部在区间内：first 90–150（最短 123，`us-pga-hold`）、followup 50–90（最短 52，`us-fba-appointment`）、close 60–110（最短 78，`us-shortage`）、alts 80–130（最短 84，`au-delivery-failed-alt-concise`）。上述 7 条只需删 2–4 个词（多为形容词或重复状语），不必重写。

### 4.7 占位符与可追溯性

- 全部 180 条文本的 `{{token}}` 与 `placeholders` 数组 **逐字一致，0 处不匹配**；token 全部在白名单内，无自造 token。这是本库做得最好的一项。
- 可优化：`ca-storage-demurrage` / `scripts[1].text` 与 `ca-urgent-chase` / `scripts[1].text` 的 `placeholders` 为空数组，虽然正文没有 token，但 followup 不带任何单号/柜号，客服在多线程里容易发错对象；建议各补一个 `{{container_no}}` 或 `{{order_no}}`。
- `au-delivery-failed`（first/close）、`ca-damage`（first/followup）、`us-damage`（first）等没有柜号/单号，属同一类可追溯性问题，非必须改。

---

## 五、事实与 brief 的冲突清单

> 判定说明：“口径错”＝与官方或 brief 的明确事实冲突；“升格”＝brief 标 medium/待核实，话术当既定事实用；“库内矛盾”＝同一事实在两处给出相反说法。

| # | 国家 | 场景 / 字段 | 数据说法 | brief / 官方口径 | 判定 |
|---|---|---|---|---|---|
| 1 | AU | `au-duty-gst-dispute` / `framework.facts[1]` | 海关价值“不含起运地到澳洲的运费与保险” | brief §1.3：VoTI = CV + 关税 + T&I + WET，**CIF 基础再加关税**；ABF 页面同 | 口径错（CIF vs FOB 混用） |
| 2 | AU | `au-duty-gst-dispute` / `scripts[0]`、`[2]`、`alts[0]`、`[1]` | GST/duty 因货值“above A$1,000”而在边境缴 | brief §1.1：A$1,000 是 N10/SAC 申报分界；GST 适用于所有 taxable importations | 口径错（因果倒置） |
| 3 | AU | `au-duty-gst-dispute` / `scripts[2]` vs `au-fee-dispute` / `scripts[0]`、`[2]` | 前者：税在 DDP 之外；后者：税已在 DDP 之内、不得二次收 | 需产品定义统一；brief §1.3 只说明 DDP 不转移法定纳税义务，未替产品定含税范围 | 库内矛盾 |
| 4 | CA | `ca-duty-tax-dispute` / `scripts[0]`、`[2]` vs `ca-fee-dispute` / `scripts[0]`、`internal.fee_policy` | 前者：DDP 覆盖 duty/GST；后者：税是代垫、实报实销 | 同上；brief §2.3 只讲现金流与 IOR 义务 | 库内矛盾 |
| 5 | CA | `ca-carm-rpp` / `scripts[1]` | “15-digit RM account” | CBSA：RM 是 **6-digit**（例 RM0001） | 口径错（已官方核实） |
| 6 | CA | `ca-carm-rpp` / 5 条英文 | “entry is filed under our importer account”为既定事实 | brief 合规声明：DDP 不改变法定纳税义务人；内部 guardrail[0]：须先确认 IOR | 越界陈述 / 未确认事实 |
| 7 | US | `us-tariff-dispute` / `scripts[1]` | 301 排除窗口“due to close in early November” | brief §3.1：medium/待核实；USTR 页面无此表述 | 升格（medium→确定） |
| 8 | US | `us-tariff-dispute` / `internal.resolution_path` | 301 排除“据报 2026-11-09 到期” | brief：仅“据二手报道于 2026 年 11 月到期” | 无源精确化 |
| 9 | US | `us-tariff-dispute` / `framework.facts[1]` | Section 122 自 2026-02-24 起 10% 临时附加税 | brief §3.1 标 medium（仅白宫 Fact Sheet 与二手转述） | 升格（medium→既定） |
| 10 | US | `us-pga-hold` / `internal.facts[1]` | “CPSC 消费品需 CPC”；“扣留决定常见 45–60 天” | CPC 仅儿童产品（其他为 GCC）；brief §3.4 PGA hold 5–30 个工作日 | 口径不完整 / 数值无源 |
| 11 | AU | `au-restricted-goods` / `scripts[0]`、`alts[1]` | 尼古丁电子烟“没有 TGA permit 就不能进口” | brief §1.6：TGA 现行规定 **待核实**；一次性非治疗性电子烟属禁止进口 | 升格（待核实→确定） |
| 12 | AU | `au-duty-gst-dispute` / `framework.facts[0]` | “多数普货约 5%，纺织服装等品类更高” | brief 未给该结论；“更高”未见依据（须按 TAR 2026 与归类核实） | 存疑，建议核实后删“更高” |

**关于 brief 本身**：本轮抽查的 5 个官方页面（ABF GST、ABF IPC、CBSA CARM 注册、CBP IEEPA 退款、USTR 301）与 brief 的对应表述**没有发现冲突**；ABF 的 IPC 费率、FID 71/48、LCT 80,809/91,661、3.5L 门槛均与 brief 完全一致。因此本轮**没有“brief 可能过时”的判定**。需要提醒的是：brief 自标 medium 的三项里，Section 122 与 301 排除到期在数据中被当成更硬的事实使用（第 7、9 行），BMSB 在 `au-biosecurity-hold` 的 framework 里被写成判定规则（按 B/L shipped-on-board 日期）但未标注置信度——这是**数据升格**，不是 brief 过时。

---

## 六、英文质量统计

| 指标 | 数值 | 说明 |
|---|---|---|
| 英文文本总数 | 180（36×5） | 3 scripts + 2 alts |
| 平均词数 | 103 | — |
| 词数区间合规 | 173 / 180（96.1%） | 7 条超上限 2–4 词（见 4.6） |
| **明显语法/搭配/逻辑问题** | **10 条（5.6%）** | 见下 |
| 轻微不自然/可优化 | 约 8 条 | 不逐一列，典型如 `au-biosecurity-hold` first “sounds worse than it is” |
| 英美拼写混用 | 6 条 | 全在 US 线：`cancelled/cancellation` ×5、`prioritise` ×1 |
| 缩写首现未展开 | 15 条 | IEEPA/CAPE/NII/CET/CROSS/CARM/ChAFTA/FMC |
| 禁用词（Dear Sir、kindly note、as per、hereby、pursuant to 等） | 0 | 180 条全查 |
| emoji / Markdown 符号 / 项目符号 | 0 / 0 / 0 | — |
| 过度绝对表述（no re-assessment / no additional duty 等） | 4 条 close | 见 P1-1 |
| 破折号使用 | 149 / 180（83%） | 风格标记，非错误 |
| “I know” 开头式共情 | 27 / 180 | — |
| “straight/honest” 自证诚恳 | 27 / 180 | — |
| “won't give/put/quote/promise” | 9 / 180 | 同类句重复 |
| 首句统一为 “Hi {{customer_name}}, …” | 144 / 180 | 余 36 条为 followup 短消息 |

**有明显问题的 10 条**（定位到 id + 字段）：

1. `au-shortage` / `scripts[0].text` — “I've started properly.”
2. `au-demurrage-storage` / `scripts[1].text` — “…not on our side…”
3. `ca-delivery-failed` / `scripts[0].text` — “attempted at the time on the sheet”
4. `ca-delivery-failed` / `scripts[1].text` — “no storage charge has started accruing yet”
5. `ca-carm-rpp` / `scripts[2].text` — “where the entry is filed…”
6. `ca-fee-dispute` / `scripts[0].text` — “nothing gets suspended”
7. `ca-fee-dispute` / `scripts[1].text` — “three lines are ours and undisputed”
8. `ca-cfia-health` / `scripts[0].text` — “and it isn't — but that doesn't help you today”
9. `us-cbp-exam` / `scripts[0].text` — “the lighter of the two”
10. `us-shortage` / `scripts[2].text` — “short-landed cartons stayed at the warehouse”

**结论**：语言层面过关，问题总量约 10 条（5.6%），且都是「一句话换 3–8 个词」即可修好，不需要整篇重写；真正拉低质量的是 P0 的事实口径（尤其 P0-3/P0-4 的跨场景矛盾）与 P1 的绝对表述。

---

## 七、需要报关行 / 主管确认的 5 条

1. **AU：DDP 报价到底含不含 duty 与 GST？**（pricing + 主管）
   直接决定 `au-duty-gst-dispute` 与 `au-fee-dispute` 哪一套口径为准，以及 `use_when` 是否要加「先看报价单」。若存在两种合同版本，应在数据层拆成两个场景，而不是让客服临场判断。
2. **CA：本票的 IOR 到底是谁？我方加拿大实体是否具备 IOR 资格与 RPP 担保？**（报关行 + 法务）
   决定 `ca-carm-rpp` 五条英文能否保留「entry under our importer account」。同时确认：我方作 IOR 时客户无法申请 GST 进项抵扣，话术不能暗示可以。
3. **US：Section 301 排除清单的现行窗口与 Section 122 附加税的现行状态**（报关行，按装运日 HTSUS / CSMS 复核）
   在拿到书面结论前，`us-tariff-dispute` 的 followup 不得出现 “early November” 或 “lapses”；Section 122 只能写「可能另有临时附加税，按装运日税率复核」。
4. **AU：BMSB 2026-27 季的适用基准与品类**（报关行；DAFF 页面本轮 403，无法复核）
   需要确认：是否按 B/L shipped-on-board 日期判定；LCL/FAK 柜是否按整柜或分票适用；金属制品、石材、机械、车辆的具体清单。这直接影响 `au-biosecurity-hold` 的 `framework.facts[2]` 与 `use_when`。
5. **CA：钢铝 / 钢衍生品 25% 附加税在 DDP 下的承担口径**（主管 + 财务）
   `ca-duty-tax-dispute` 的 `internal.fee_policy` 现在写「实际评税高于预估且申报口径一致的，差额由我方吸收」，若照此执行，25% 附加税会被默认吸收。需明确是「合同另有约定」还是「我方承担上限」，并据此改写 fee_policy 与 followup。

（补充待核实，不占 5 条名额：澳洲电子烟/TGA 路径（brief 待核实）；CBSA `RM` 号已确认 6 位，但 CARM 注册的 BAM/PAM 授权细节需报关行口头确认；DAFF 木包装页面是否仍为现行 URL。）

---

## 八、结构与规范自检（正面结论）

以下逐项用脚本核过 3 个 JSON，均通过：

- 36 场景，AU/CA/US 各 12；ID 与 `spec/CONTENT-BRIEF.md §3` 完全一致，无重复、无自创。
- `country` / `lane` / `stage` / `category` / `severity` 全部在枚举内；`updated_at` 全部 `2026-11-04`。
- 每场景 `scripts` 恰好 3 条，phase 顺序为 first/followup/close，tone 三条互不相同；`alts` 恰好 2 条，tone 为 warm/concise。
- 180 条英文文本的 `{{token}}` 与 `placeholders` **0 处不匹配**；token 全部在 11 个白名单内。
- `customer_signals` 3–4 条；`keywords` 12–18 个，中英兼有；`authorities` 1–2 条；`internal.guardrails` 恰好 3 条；`framework` 每段 2–4 条；`resolution_path` 4–7 步。
- 禁用词 0；emoji 0；Markdown 符号 0；三连空行 0。
- 词数：173/180 在规范区间，7 条仅超 2–4 词。

**唯一未达“完全合规”的是 7 条词数**，属轻微；其余结构项满分。

---

## 九、附：本轮核验来源

- ABF, *GST and other taxes when importing*（updated 20/10/2026）：<https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/GST-and-other-taxes> — 用于确认 VoTI = CV + T&I + duty + WET，以及 LCT 80,809/91,661。
- ABF, *Import Processing Charges*（updated 20/10/2026）：<https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge/> — IPC 0/50/152、纸质 90/192、N30 23/63、FID 海运 71 / 空运 48。
- CBSA, *Get started with CARM*（updated 2026-08-07）：<https://www.canada.ca/en/border-services-agency/services/carm/register.html> — “The RM is a 6-digit number (example: RM0001)”；BN9 为 9 位。
- CBP, *IEEPA Duty Refunds*：<https://www.cbp.gov/trade/programs-administration/trade-remedies/ieepa-duty-refunds> — CAPE 由 IOR/授权报关行提交 CSV、单份上限 9,999 条、一般 60–90 天；与 brief §3.1 一致。
- USTR, *China Section 301-Tariff Actions and Exclusion Process*：<https://ustr.gov/issue-areas/enforcement/section-301-investigations/tariff-actions> — 页面仍为 2018–2020 清单索引，无 2026 排除到期表述，不能支撑 `us-tariff-dispute` followup。
- DAFF（403，未能读取）：<https://www.agriculture.gov.au/import/goods/timber-packaging>、<https://www.agriculture.gov.au/import/before/brown-marmorated-stink-bugs> — 与 brief 记录的 403 一致，建议 QA 时实测。

---

*本报告只做审校，不替代报关行/法务的最终意见；P0 中涉及税基与 IOR 的条目，请以第七节确认结果为准再改数据。*
