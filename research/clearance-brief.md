# DDP 散货（LCL 拼箱）清关事实底座：中澳 / 中加 / 中美

> **用途**：为「DDP 散货售后话术库」提供可核实的事实与口径边界，**不含客户话术**。
> **编制时点**：2026-11-04（Asia/Shanghai），各章末尾单列「政策截至」。标「经验值」者为行业观察区间；标「待核实」者本次未取得可访问官方正文。
> **来源分级**：`high` = 本次直接读取官方页面/公报正文；`medium` = 官方页面返回 403/未能读取，或仅二手权威转述，需报关行复核。
> **合规声明**：只写合规口径与可解释空间的**边界**，不提供降低应税义务的操作建议。DDP 是商业术语，**不改变法定纳税义务人**——海关眼中的纳税人始终是进口商记录人（IOR），DDP 约定不能对抗海关。

---

## 第一章 澳大利亚（Australia）

### 1.1 清关框架与 2025–2026 变化

ABF（隶属 Home Affairs portfolio）管关税、GST 与许可；DAFF 管生物安全与进口食品，ABF 代收其成本回收费用。现行系统仍是 **ICS**，申报以 N10（完税进口）、SAC（≤AUD1,000）、N20/N30（保税仓进出）为主。

**「ICS 会被替换吗」——2026 年的准确答案**：ABF 的 **Future Cargo Reporting Model（FCRM）** 属「简化贸易系统（STS）」改革下的**设计项目**，官方明示**不建新系统、不替换 ICS、不改《1901 年海关法》**，只重设「谁、在何阶段、报什么数据」；页面更新 2026-10-01，意见征集截止 2026-06-29。→ **2026 年内不存在「系统切换」的合规窗口**，任何「系统要换、先别报」的解释都不成立。
来源：<https://www.abf.gov.au/help-and-support/ics/future-cargo-reporting-model>（high）

**2025–2026 实际变化**：① 生物安全成本回收费用为每份 Full Import Declaration 海运 **AUD71**、空运 **AUD48**（ACN 2026/23）；DAFF 另于 2026 年调整相关监管收费（站点 403，medium）。② 进口处理费（IPC）仍按「电子/纸质 × 货值档」（见 1.3）。③ 豪华车税 2026-27 财年阈值 **AUD80,809**（节能车 AUD91,661），且自 **2025-07-01** 起「节能车」定义收紧为油耗 **≤3.5L/100km**。④ BMSB 进入 2026-27 季（见 1.6），DAFF 入口 <https://www.agriculture.gov.au/import/before/brown-marmorated-stink-bugs>（403，medium）。

### 1.2 LCL / DDP 所需单证

| 单证 | 要点 | 常见缺失点 |
|---|---|---|
| 商业发票 | 成交价、Terms、逐项品名/材质/用途、原产国 | 一票多品只写大类；DDP 含运费却未拆货值与运保费 |
| 装箱单 | 件数、毛净重、体积、唛头 | 与提单件数不一致，仓库差异无法举证 |
| 提单 / HBL | 收货人、通知方、铅封、CFS 条款 | HBL 与 MBL 主体不一致；拆箱分拨记录缺失 |
| 原产地证 | 主张 ChAFTA 零关税时必需 | 品名不符、第三方发票未标注、证书过期 |
| 许可/认证 | 食品（DAFF）、植物木材（BICON）、治疗用品（TGA）、化妆品（AICIS）、无线电（ACMA） | 未在装运前查 BICON，到港才知需处理或退运 |
| 木包装 | 实木包装须 **ISPM15** 处理并加标识 | 免熏蒸标误用于实木；托盘脚墩无标识（**待核实**） |

DAFF 转介与 ABF 税金放行是**两条并行流程**，任一卡住都不放行；DDP 只算关税 GST、漏算 DAFF 处理费与查验仓储费，是最常见的成本漏项。

### 1.3 税费口径

**GST 10%**，税基为应税进口价值（VoTI）：完税价（CV）＋关税＋反倾销/反补贴税＋国际运输与保险（T&I）＋葡萄酒平衡税（如适用）。即 **CIF 基础再加关税**，不是 FOB。GST 可与关税同时缴，或经 ATO 批准递延至下期 BAS（属账期安排、非免税）。
来源：<https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/GST-and-other-taxes>（更新 2026-10-20，high）

**关税**：按完税价（成交价格法，调整运保费、协助、特许权使用费）适用税率。ChAFTA 下多数中国原产货物已零关税，但**须有有效原产地证明并符合原产地规则**，不能凭「中国发货」主张（**medium**：DFAT 页面 403）。

**IPC 与生物安全费（现行表）**：N10/N20 电子 ≤AUD1,000 为 0、>1,000–<10,000 为 50、≥10,000 为 152；纸质 90 / 192；N30 电子 23、纸质 63；生物安全 FID 海运 71、空运 48。
来源：<https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge/>（high）

**DDP 下谁承担**：ABF 只认货物所有人或其持牌报关代理，税金放行前须结清（除非获批递延）；DDP 下货代垫付，法律义务未转移，客户拒付时 ABF 仍向进口主体追缴。

**争议点（合规口径）**：运保费须计至「澳大利亚最终目的港」；买方提供的模具、无偿料件（assists）、必付特许权使用费应计入完税价。**可解释空间的边界**＝真实申报＋归类依据（可申请归类裁定）＋原产地实质改变判断；**低报、拆票、虚报原产地属违法**，ABF 可追缴、罚息并处罚款。

### 1.4 查验与时效

| 类型 | 触发 | 时效（经验值） |
|---|---|---|
| ABF 文件审 / 归类估价质疑 | 品名笼统、价格异常 | 1–5 个工作日 |
| ABF 实物查验（拆箱/整箱） | 风险评分、情报、随机 | 2–7 个工作日 |
| NII / X-ray 后开箱 | 整柜扫描异常 | 1–3 个工作日 |
| DAFF 生物安全查验 | 木包装、土壤、种子、食品、BMSB 季 | 3–10 个工作日；需处理再加 3–7 天 |
| 禁限货物扣留 | 无许可证、仿牌、电子烟 | 常 30 天以上 |

正常 LCL **2–5 个工作日**放行；抽中实物查验 **+3–7 天**；DAFF 处理 **+5–14 天**；BMSB 季高风险品类再叠加。**扣关不是「已放行但慢」，而是「未作放行决定」**，此时堆存与箱使仍在累计。

### 1.5 港口 / 堆场 / 滞港滞箱

主要口岸：悉尼（Port Botany）、墨尔本、布里斯班、弗里曼特尔；LCL 多在承运人 CFS 拆箱后派送。码头/CFS **免堆 3–7 天**，船司 **demurrage 免费期约 5–7 天**、**detention 约 5–10 天**（经验值）。悉尼/墨尔本受码头作业窗口、拖车预约与铁路衔接影响，布里斯班与弗里曼特尔受农产品出口高峰影响。**具体天数以当期码头公告与船司 tariff 为准**。

### 1.6 高风险品类与禁限运

① **木包装/木制品**：ISPM15 处理加标识。② **BMSB 高风险**：2026-27 季（通常 **9 月 1 日–次年 4 月 30 日**）对高风险国家的金属制品、石材、机械、车辆等实施季节处理要求（**medium**：DAFF 页面 403，须按当期公告复核）。③ **食品**：DAFF 进口食品要求＋澳新标准标签。④ **植物/种子/土壤**：极高查验与退运风险，装运前查 BICON。⑤ **化妆品/化学品**：AICIS 框架。⑥ **电子烟/尼古丁**：2024 年起严格管制，零售进口基本禁止（**待核实** TGA 现行规定）。⑦ **锂电池**：IMDG 约束，「未申报电池」为拒载/罚款高发点。⑧ **仿牌/武器/管制刀具**：ABF 与权利人协作查扣，没收后 DDP 垫付税金无法追回。

### 1.7 客户最常见争议 Top 8（澳洲）

1. **时效**：承诺「3 天放行」遇 DAFF 转介即失约 → 报「正常 2–5 工作日＋查验另计」。
2. **税费**：以 DDP 一口价比对税单 → 列明 VoTI 构成与 IPC/生物安全费。
3. **查验**：「为何只查我」→ 由风险模型决定，货代无法干预。
4. **货损**：CFS 拆箱重装易损 → 装箱照、铅封号、CFS 收货记录、签收单。
5. **短少**：一票多件高发 → 以 HBL 件数＋理货报告为界，签收前提异议。
6. **派送**：偏远/无卸货设备地址二次派送 → 报价写明「含派送至门、不含卸货等待」。
7. **地址**：改址、地址不完整致派送失败 → 费用按实际发生，派送前书面确认。
8. **索赔**：要求全损全赔 → 承运人责任限制与货代过失责任分离，走保单索赔。

**官方来源（澳）**：FCRM <https://www.abf.gov.au/help-and-support/ics/future-cargo-reporting-model>；申报 <https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/how-to-import/import-declaration>；GST/税 <https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/GST-and-other-taxes>；IPC <https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/charges/import-processing-charge/>；DAFF BMSB（403）<https://www.agriculture.gov.au/import/before/brown-marmorated-stink-bugs>。

**政策截至：2026-11-04**（ABF 页面更新至 2026-10-20；DAFF 未直接读取）

---

## 第二章 加拿大（Canada）

### 2.1 清关框架与 2025–2026 变化

CBSA 负责关税与 GST/HST；**CARM 自 2024-10-21 起为征税的系统记录（system of record）**。

**两个关键节点**：① **CAD 取代 B3/B2**——Commercial Accounting Declaration（CAD）是唯一进口记账文件，由 CBSA 依其数据自动计税；报关行**必须先取得进口商在 CARM 门户的授权**才能代为申报，自清关者用 CAD C 型并随附运单、发票、许可证到口岸。② **RPP（先放行后付税）过渡期结束**——原定 2025-04-19，经法规修订延长 30 天，**实际于 2025-05-20 03:00:01 EDT 结束**；此后进口商须**自行在 CARM 挂担保**，额度＝过去 12 个月**最高月度应收（含 GST）**；未挂者放行时须提交 CAD C 型并当场付税。迟延记账罚则（LAP）过渡豁免已于 **2025-01-19** 结束；计费为每月 25 日出 SOA、次月 17 日后 **10 个工作日**到期。
来源：CN 25-22 <https://www.cbsa-asfc.gc.ca/publications/cn-ad/cn25-22-eng.html>；CARM <https://www.canada.ca/en/border-services-agency/services/carm/schedule.html>（更新 2026-08-07）（均 high）

**对 LCL 影响最大的新增关税**（钢铝采**非叠加 non-stackable**，按优先级只适用一项）：

| 措施 | 生效 | 税率/范围 |
|---|---|---|
| 中国原产钢/铝 | 2024-10-22 | 25%（清单内） |
| 含「中国熔炼浇铸」钢 / 「中国冶炼铸造」铝的非美进口 | 2025-07-31 | 25%；**同批次完税价累计 ≤C$5,000 豁免** |
| 钢铁衍生品（任何国家） | 2025-12-26 | 25%，按**全额货值** |
| 非 CUSMA 国家钢铁超配额 | 2025-12-26 | 配额＝2024 年进口量的 20%（FTA 国 75%），超额 **50%** |

来源：<https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-tariff-responses/canadas-tariffs-steel-aluminum.html>（更新 2026-09-24，high）

→ 五金件、工具、含钢铝结构件的家具/器材，即使不是「钢材」也可能落入「钢衍生品」按全额货值加征 25%；「是否含中国熔炼浇铸钢铝」需供应商书面溯源，**这是 2026 年加拿大线最易爆的争议点**。

### 2.2 LCL / DDP 所需单证

| 单证 | 要点 | 常见缺失点 |
|---|---|---|
| 商业发票 | 成交价、Terms、逐项描述、原产国、HS | 未写「是否含中国熔炼浇铸钢铝」 |
| 装箱单 / B/L / HBL | 件数、重量、体积、收货人 | 与 CAD 数据不一致 |
| CAD 数据 | 进口商在 CARM 授权后由报关行提交 | 未授权 → 无法申报（最常见「卡关」原因） |
| 原产地 | 中加无 FTA，通常适用 MFN | 误以为有自贸协定可免税 |
| 食品/农产品 | CFIA 许可与预通知（肉类、乳制品、蔬果、宠物食品） | 未提前办理 |
| 化妆品/器械/玩具/电子 | Health Canada、CCPSA、**英法双语标签** | 双语标签缺失为高频扣货原因 |
| 木包装 | ISPM15 标识 | 无标识托盘 |

（**medium**：CFIA/Health Canada 品类清单未逐条读取，须按 inspection.gc.ca 当期要求复核。）

### 2.3 税费口径

联邦 **GST 5%**；HST 省份合并征收：**安大略 13%**、**新斯科舍 14%**（2025-04-01 起由 15% 下调）。非参与省份为 GST 5%＋省税：**BC 7% PST、曼尼托巴 7% RST、萨斯喀彻温 6% PST**；魁北克 GST 5%＋**QST 9.975%**。进口按**进口省份**适用税率。
来源：<https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html>（更新 2026-04-08，high；省税按省级机关复核，medium）

**税基**为完税价格（value for duty），通常按「在加拿大口岸交付」的成交价格调整（运费、保险、佣金、协助、特许权使用费）；附加税在此之上按全额货值或清单税率叠加。

**DDP 下谁承担**：记账与付税义务在进口商，报关行需其 CARM 授权；**未挂 RPP 担保时货物放行前必须完成付税**——DDP 货代在加现金流压力大于澳洲。

**争议点（合规口径）**：核心是「是否在清单内＋是否含中国熔炼浇铸钢铝」；合规做法为取得供应商熔炼/浇铸地声明与材质证明，**不能靠改品名规避**。C$5,000 豁免是**同批次完税价累计**口径，不得拆票。合法路径包括 HS 预裁定、原产地判断与财政部 **remission/退税** 程序（中国货物专页 <https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-tariff-responses/tariff-relief-canadian-importing-goods-china.html>，high）；低报、拆票、伪报熔炼地属违法。

### 2.4 查验与时效

| 类型 | 触发 | 时效（经验值） |
|---|---|---|
| CBSA 文件审（归类/估价/原产地） | 品名笼统、价格异常 | 1–5 个工作日 |
| CBSA 实物查验（NII/拆箱） | 风险评分、随机 | 2–7 个工作日 |
| PGA 转介（CFIA/Health Canada） | 食品、化妆品、器械、玩具 | 5–15 个工作日（检测更久） |
| 无 CARM 授权 / 无 RPP 担保 | 进口商未完成 CARM 设置 | 直至补齐，无上限 |

正常 LCL 放行 **2–5 个工作日**；查验 **+3–7 天**；PGA 转介 **+1–3 周**。**2026 年加拿大线的主要滞留来自 CARM 授权/担保缺失，而非海关查验**。

### 2.5 港口 / 堆场 / 滞港滞箱

主要口岸：**温哥华**、**鲁珀特王子港**、蒙特利尔、多伦多（内陆 CFS）。温哥华受锚地等泊、铁路衔接（CN/CPKC）与码头预约影响，旺季（9–12 月）堆存压力明显；鲁珀特王子港瓶颈在铁路运力。码头/CFS **免堆 3–5 天**；demurrage 与 detention 分开计费，船司免费期约 **5–7 天**；CFS 仓储按天/按立方（经验值，以码头公告与船司 tariff 为准）。

### 2.6 高风险品类与禁限运

① **含钢铝及钢衍生品**（见 2.1），钢衍生品 25% 是新增风险。② **食品/农产品**：CFIA 许可与预通知，肉类、乳制品、蛋品、蔬果、宠物食品高敏感。③ **化妆品/天然健康产品/医疗器械**：Health Canada＋英法双语标签。④ **儿童玩具/消费品**：CCPSA 与《玩具法规》，小零件、邻苯二甲酸盐、铅含量为抽查重点。⑤ **木包装**：ISPM15。⑥ **锂电池**：TDG＋IMDG。⑦ **仿牌/武器/管制刀具**：CBSA 与权利人协作查扣。⑧ **大麻/THC 产品、电子烟**：受《大麻法》与《烟草和电子烟产品法》严格限制，跨境寄递基本禁止。

### 2.7 客户最常见争议 Top 8（加拿大）

1. **时效**：CARM 未授权/未挂担保致无法放行 → 先查 CARM 门户（BN15/RPP/担保），不是「海关扣货」。
2. **税费**：「这次多了 25%」→ 说明附加税类别与非叠加优先级。
3. **查验**：PGA 转介时间长 → 排期由主管部门定，可提供转介编号。
4. **货损**：铁路段与 CFS 拆箱 → 证据链同澳洲。
5. **短少**：拼箱件数差异 → 以 HBL 件数与 CFS 理货为界。
6. **派送**：温哥华港口与多伦多内陆分离 → DDP 写明是否含内陆段。
7. **地址**：偏远地区附加费、无卸货平台。
8. **索赔**：承运人责任限制＋保险索赔路径。

**官方来源（加）**：CARM <https://www.canada.ca/en/border-services-agency/services/carm/schedule.html>；CN 25-22 <https://www.cbsa-asfc.gc.ca/publications/cn-ad/cn25-22-eng.html>；RPP 担保 <https://www.canada.ca/en/border-services-agency/news/2025/02/cbsa-reminds-importers-to-submit-financial-security-before-carm-transition-measure-ends-in-april.html>；钢铝 <https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-tariff-responses/canadas-tariffs-steel-aluminum.html>；GST/HST <https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate.html>。

**政策截至：2026-11-04**（财政部页面更新至 2026-09-24）

---

## 第三章 美国（United States）

### 3.1 清关框架与 2025–2026 变化

CBP 通过 **ACE** 完成归类、估价、征税与放行；FDA、CPSC、FCC、USDA、DOT 等以 **PGA 消息集**参与，形成「PGA hold」。报关分**正式**（>US$2,500，需 bond 与 Entry Summary 7501）与**非正式**（≤US$2,500）；**Entry Type 86 自 2025-08-29 起不得使用**。

**de minimis：两段式变化（本章最重要事实）**
① **2025-08-29（EDT 00:01）起全面暂停**：依 EO 14324 与 CBP 公告（90 FR 42418），US$800 以下**所有国家**免税待遇暂停，除国际邮政网络外须在 ACE 以适当 entry type 申报；邮政渠道过渡期可按件定额（$80/$160/$200），仅 6 个月，之后只能从价。② **2026-06-24 起无限期暂停写入法规**：CBP 临时最终规则（CBP Dec. 26-12，USCBP-2026-0760）修订 **19 CFR 10.151**，非邮政渠道 ≤US$800 须走正式或非正式报关；规则明确其**独立依据 CBP 自身 19 U.S.C. 1321 权限**；并载明依 2025-07-04 生效的 One Big Beautiful Bill Act，该豁免**自 2027-07-01 法定终止**。
来源：90 FR 42418 <https://www.govinfo.gov/content/pkg/FR-2025-09-02/html/2025-16802.htm>；2026 规则 <https://www.federalregister.gov/documents/full_text/html/2026/06/24/2026-12670.html>（均 high）

**IEEPA 关税被推翻及后续**：**2026-02-20** 最高法院在 *Learning Resources, Inc. v. Trump*（607 U.S. ___，2026）判定 **IEEPA 不授权总统加征关税**；同日 **EO 14389** 终止依 IEEPA 加征的附加税，**EO 14388** 继续维持 de minimis 暂停。CBP 随后启用 **CAPE** 处理退税：由 IOR 或授权报关行在 ACE 门户提交 CSV（单份上限 9,999 条），有效退税一般 **60–90 天**到账，受清算与抵扣规则约束。来源：<https://www.cbp.gov/trade/programs-administration/trade-remedies/ieepa-duty-refunds>（high）

**2026-02-24 起**美国另以 **Section 122** 加征 **10% 临时进口附加税**（法定上限 15%、最长 150 天）（**medium**：仅白宫 Fact Sheet 与二手权威转述，未读联邦公报正文）。对华 **Section 301**（清单 1–4A 的 7.5%/25% 及 2024 年起提高品类）与 **Section 232**（钢铝铜、汽车、半导体、多晶硅等 2026 年新增公告）继续有效；**301 排除清单据二手报道于 2026 年 11 月到期（medium/待核实）**。→ **美国关税栏必须以报关行在装运日按 HTSUS 与 ACE 现行税率复核的结果为准**。

### 3.2 LCL / DDP 所需单证

| 单证 | 要点 | 常见缺失点 |
|---|---|---|
| ISF（10+2） | 装船前 **24 小时**；10 项进口商＋2 项承运人数据；须 ISF bond | NVOCC 代报时信息与 HBL 不一致；迟报/错报可处 **US$5,000/次**（19 CFR 149） |
| 商业发票 | 成交价、Terms、逐项描述、原产国、HTS | 描述笼统（「gifts」「parts」）直接触发查验 |
| 装箱单 / B/L | 件数、重量、体积、收货人 | 与 ISF/HBL 不一致 |
| Entry Summary 7501 | 归类、估价、税率、MPF/HMF | 归类争议、assist/royalty 未计入 |
| PGA 单证 | FDA（Prior Notice＋FSVP）、FCC（射频授权）、**CPSC 合规证书 eFiling**、USDA（农产品/ISPM15）、DOT/NHTSA | CPSC 数据未提交 → 直接 hold |
| Bond | 正式报关 bond＋ISF bond | 额度不足或过期 |

（ISF 规则见 19 CFR 149；**CBP 官网改版后多个 ISF 路径 404**，条文请按 eCFR 现行文本核对。）

### 3.3 税费口径

**税基**：美国以**成交价格**为基础，通常以 **FOB 出口地**为起点——**国际运费与保险不计入关税税基**。这与澳洲 CIF 口径相反，是中美线最常见的口径误解。

**主要税费**：关税（HTSUS 归类税率）＋对华 301/232 附加税；**MPF** 正式报关按货值 **0.3464%**，设最低/最高限额（**每财年 10 月 1 日调整**，由 ACE 自动计算，本文不给固定数字以免过期）；**HMF** 海运进口按货值 **0.125%**。来源：<https://www.cbp.gov/document/guidance/merchandise-processing-fee-mpf-table>（CBP 出版物 5267-1125，high）

**DDP 下谁承担**：**IOR 承担全部关税与合规责任，且须保存进口记录 5 年**（19 CFR 163）。货代或其美国关联公司做 IOR 时即成为法律上的进口商，承担归类、估价、PGA 合规与罚款风险——中美 DDP **风险最高**的结构性事实。CBP 允许外国公司作为 IOR（需 CBP Form 5106 建立编号并提供 bond），但**「谁是 IOR」必须在合同中写明**。

**争议点（合规口径）**：运保费不计入（与澳洲相反）；买方提供的模具、无偿料件、必付特许权使用费**应计入**成交价格；美国允许 **first sale（首次销售价格）** 作为完税价，但须满足独立交易与完整单据链——属**合法估价技术空间，不是申报时可选项**。**低报、拆分、伪报原产地、借用他人 IOR 编号属违法**，可触发 19 U.S.C. 1592 罚款甚至刑事。

### 3.4 查验与时效

| 类型 | 触发 | 时效（经验值） |
|---|---|---|
| NII（VACIS / X-ray） | 风险评分、随机 | 1–3 个工作日 |
| CET 查验 | 情报、扫描异常 | 3–7 个工作日 |
| Intensive exam（送 CES） | 高风险、PGA 要求 | 7–21 个工作日（旺季更久） |
| PGA hold（FDA/CPSC/USDA/FCC） | 单证缺失、抽样检测 | 5–30 个工作日（FDA 更久） |
| ISF hold | 迟报、与 HBL 不符 | 1–5 个工作日，严重者退运 |

正常 LCL **1–5 个工作日**放行；NII/CET **+2–7 天**；intensive **+1–3 周**。美国线的「扣关」往往是**多个 PGA 串联**，任一家未放行都不放行。

### 3.5 港口 / 堆场 / 滞港滞箱

主要口岸：**LA/LB**、**NY/NJ**、**萨凡纳**、休斯顿、西雅图/塔科马。LA/LB 码头 free time 通常 **3–5 天**（工作日计），chassis 短缺与铁路衔接是主要瓶颈；NY/NJ 为预约制、闸口拥堵；萨凡纳看铁路与堆场周转。**demurrage**（码头堆存）与 **detention**（离港未还箱）分开计费，另有 per diem、chassis fee、CFS storage（经验值）。

**监管框架（2024–2025）**：FMC 依 OSRA 2022 制定的 **46 CFR Part 541** 于 **2024-05-28** 生效，要求 D&D 发票含准确充分信息、**开票期限 30 天**，不符者被开票方**无付款义务**；**2025-09-23** D.C. 巡回上诉法院**仅撤销 46 CFR 541.4**（可向谁开票），其余条款继续有效。来源：<https://www.fmc.gov/articles/u-s-court-of-appeals-issues-decision-in-case-on-demurrage-and-detention-billing-practices/>（high）

→ 客户质疑 D&D 时，先核对**发票要素是否完整、是否在 30 天内开出**——这是有法规依据的抗辩点。

### 3.6 高风险品类与禁限运

① **CPSC 管制消费品**（玩具、儿童用品、电器、家具）：**2026-07-08 起强制 eFiling**，须在进入美国商业前提交合规证书数据，FTZ 货物适用 **2027-01-08**；不合规直接 hold。来源：<https://www.cpsc.gov/Newsroom/News-Releases/2026/CPSC-Implements-Mandatory-eFiling-for-Certificates-of-Compliance-Targeting-Dangerous-Foreign-Imports>（high）② **FDA**：食品（Prior Notice、FSVP）、药品、器械、化妆品（MoCRA）、辐射类电子产品。③ **FCC**：无 FCC ID 的蓝牙/WiFi 产品是高频扣货点。④ **USDA/APHIS**：农产品、木包装 ISPM15。⑤ **锂电池**：49 CFR＋IMDG。⑥ **仿牌**：可经 e-recordation 直接扣留。⑦ **武器/管制刀具/防弹衣**：ATF/EAR/ITAR 交叉管辖。⑧ **电子烟/尼古丁**：FDA PMTA＋各州法，无授权即「掺假/标签错误」。

### 3.7 客户最常见争议 Top 8（美国）

1. **时效**：de minimis 暂停后小包直发路径消失 → 所有 ≤US$800 亦须报关。
2. **税费**：以「以前 800 美元以下免税」比对税单 → 出示 90 FR 42418、2026-06-24 规则与 2027-07-01 终止时间表。
3. **IEEPA 退税**：客户要求货代先退 → 退税主体是 **IOR**，须由 IOR/授权报关行提交 CAPE，一般 60–90 天。
4. **查验**：PGA hold 时间长 → 提供 case 号与补件清单。
5. **货损**：多次转运＋CES 拆箱 → 证据链＋保险索赔。
6. **短少**：查验后重装差异 → 以 HBL 件数、CFS 理货、查验报告为界。
7. **派送**：住宅附加费、预约送货、无卸货平台。
8. **索赔**：关税是**法定由 IOR 承担**的义务，商业追偿看合同，不能向 CBP 主张「这是客户该付的」。

**官方来源（美）**：de minimis 暂停 <https://www.govinfo.gov/content/pkg/FR-2025-09-02/html/2025-16802.htm>；无限期暂停 <https://www.federalregister.gov/documents/full_text/html/2026/06/24/2026-12670.html>；IEEPA 退税 <https://www.cbp.gov/trade/programs-administration/trade-remedies/ieepa-duty-refunds>；MPF <https://www.cbp.gov/document/guidance/merchandise-processing-fee-mpf-table>；FMC D&D <https://www.fmc.gov/articles/u-s-court-of-appeals-issues-decision-in-case-on-demurrage-and-detention-billing-practices/>；CPSC <https://www.cpsc.gov/Newsroom/News-Releases/2026/CPSC-Implements-Mandatory-eFiling-for-Certificates-of-Compliance-Targeting-Dangerous-Foreign-Imports>。

**政策截至：2026-11-04**（de minimis 规则 2026-06-24；CPSC 2026-07-08；301/232 税率须按装运日复核）

---

## 附：2026 年 11 月关键风险点

1. **美国对华关税处于「判决后重建期」**：IEEPA 已终止（2026-02-20），Section 122 属临时，301/232 为主要长期工具——**超过 30 天的税率承诺都不可靠**。
2. **CPSC eFiling 已强制**（2026-07-08），消费品 LCL 报关数据要求实质提高。
3. **加拿大钢衍生品 25% 与「含中国熔炼钢铝」25%** 是新爆点（2025-12-26 / 2025-07-31），C$5,000 豁免不得拆票。
4. **澳洲 BMSB 2026-27 季**进行中，木包装与高风险品类须提前处理。
5. **税基差异是跨国比价误判主因**：澳 CIF＋关税、加口岸交付价、**美 FOB 运保费不计**；IEEPA 退税（2025-08-29 至 2026-02-20 征收部分）可走 CAPE，单据完整性决定能否退成。

**待核实 / medium 清单**：DAFF BMSB 季起止与品类（403）；DAFF ISPM15 正文（403）；ChAFTA 原产地规则（DFAT 403）；澳洲电子烟 TGA 规定；加拿大 BC/SK/QC 省税；CFIA/Health Canada 品类清单；美国 301 排除清单 2026-11 到期；Section 122 现行状态；CBP ISF 官方页面（404）；三国港口免堆期具体天数（经验值）。
