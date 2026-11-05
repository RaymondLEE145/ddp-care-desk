/* CareDesk — local reply engine: intent matching + 3 English variations */
(function () {
  'use strict';

  var CN_RE = /[\u4e00-\u9fa5]/;

  var CATEGORY_HINTS = [
    { re: /refund|compensat|money back|chargeback|claim|退款|赔偿|索赔|理赔/i, boost: '费用争议', extra: 2.2 },
    { re: /lawyer|legal action|sue |court|投诉|曝光|起诉|律师/i, boost: '客户情绪', extra: 3.2 },
    { re: /damage|broken|wet|crush|dented|torn|破损|损坏|水湿|压坏|变形/i, boost: '货损短少', extra: 2.6 },
    { re: /missing|shortage|short shipped|stolen|lost|少箱|短少|丢件|丢失|缺货/i, boost: '货损短少', extra: 2.6 },
    { re: /held|detained|inspection|exam|customs|clearance|查验|扣关|清关|海关/i, boost: '清关异常', extra: 1.8 },
    { re: /delay|late|eta|when will|arrive|delay|congestion|延误|晚|几时到|什么时候到|船期/i, boost: '时效延误', extra: 1.6 },
    { re: /delivery|deliver|address|driver|re-delivery|派送|地址|送货|快递/i, boost: '派送异常', extra: 1.4 },
    { re: /tax|duty|gst|vat|tariff|fee|charge|税|关税|费用|账单/i, boost: '税费争议', extra: 1.6 },
    { re: /fda|fcc|cpsc|cfia|health canada|biosecurity|bmsb|ispm|合规|认证|扣留/i, boost: '合规风险', extra: 2.4 }
  ];

  var COUNTRY_HINTS = [
    { c: 'AU', re: /abf|daff|bicon|bmsb|ispm|australia|sydney|melbourne|brisbane|fremantle|aud|gst 10|澳洲|澳大利亚|悉尼|墨尔本|布里斯班/i, w: 2 },
    { c: 'CA', re: /cbsa|carm|rpp|canada|vancouver|prince rupert|toronto|montreal|calgary|hst|pst|加国|加拿大|温哥华|多伦多/i, w: 2 },
    { c: 'US', re: /cbp|isf|hts|section 301|ieepa|de minimis|fda|fcc|cpsc|los angeles|long beach|new york|savannah|usa|u\.s\.|america|美国|洛杉矶|长滩|纽约/i, w: 2 }
  ];

  var PORT_HINTS = [
    [/port botany|sydney|syd\b|悉尼/i, 'Port Botany, Sydney'],
    [/melbourne|mel\b|墨尔本/i, 'Melbourne'],
    [/brisbane|bne\b|布里斯班/i, 'Brisbane'],
    [/fremantle|perth|弗里曼特尔|珀斯/i, 'Fremantle'],
    [/vancouver|van\b|温哥华/i, 'Vancouver'],
    [/prince rupert|鲁珀特王子港/i, 'Prince Rupert'],
    [/toronto|yyz|多伦多/i, 'Toronto'],
    [/montreal|yul|蒙特利尔/i, 'Montreal'],
    [/calgary|卡尔加里/i, 'Calgary'],
    [/los angeles|lax\b|洛杉矶/i, 'Los Angeles'],
    [/long beach|lgb\b|长滩/i, 'Long Beach'],
    [/new york|newark|nyc\b|纽约|纽瓦克/i, 'New York / Newark'],
    [/savannah|萨凡纳/i, 'Savannah'],
    [/seattle|tacoma|西雅图|塔科马/i, 'Seattle / Tacoma'],
    [/houston|休斯顿/i, 'Houston'],
    [/chicago|芝加哥/i, 'Chicago (IPI)']
  ];

  var BRIDGES = {
    customs: {
      label: '清关 / ISF',
      skipCategory: '清关异常',
      re: /isf|importer security filing|entry status|customs|clearance|held at (?:customs|the port)|清关|报关|查验|扣关/i,
      text: "On the customs side, I'm checking the ISF and entry status with our broker and will confirm whether release is affected and what, if anything, we need from you."
    },
    fees: {
      label: '费用 / 仓储',
      skipCategory: '费用争议',
      re: /storage|demurrage|detention|who pays|who covers|cost|fee|charge|仓储|堆存|滞箱|滞港|费用|谁付|谁承担/i,
      text: "On the cost point: I'm checking what caused the charge and how it sits under your DDP terms. I'll send the breakdown in writing before anything is billed."
    },
    reference: {
      label: '柜号口径',
      skipCategory: '',
      re: /container number|container no\.?|which container|container\s*#|柜号|集装箱号/i,
      text: "On the container number: for DDP consolidated shipments we don't release it as standard — the container carries several customers' cargo, so we manage visibility at shipment level. I'll give you the booking reference and milestone updates instead, and if you need the container number for a specific claim or document, tell me the purpose and I'll check what the carrier permits."
    },
    delivery: {
      label: '派送 / 地址',
      skipCategory: '派送异常',
      re: /delivery|deliver|address|redeliver|last mile|派送|送货|地址|改址|收货/i,
      text: "On the delivery side, I've asked our last-mile team to keep a slot open so we can move as soon as the shipment is released. If the address or contact needs updating, send it through and I'll amend it now."
    },
    damage: {
      label: '货损 / 短少',
      skipCategory: '货损短少',
      re: /damage|damaged|broken|wet|crush|missing|shortage|claim|破损|损坏|水湿|少箱|短少|索赔/i,
      text: "On the condition of the goods, I'll arrange a survey and send you our photo checklist, so the evidence is complete from day one and nothing slows the claim down."
    },
    tax: {
      label: '税费 / 税单',
      skipCategory: '税费争议',
      re: /tax|duty|gst|vat|tariff|税|关税|税单/i,
      text: "On the duty figure, I'll send you the entry summary and a line-by-line breakdown so you can see exactly what was assessed, on what basis, and what was included in your DDP price."
    },
    docs: {
      label: '单证 / 资料',
      skipCategory: '清关异常',
      re: /document|invoice|packing list|paperwork|declaration|单证|资料|发票|装箱单|申报/i,
      text: "On the documents, I'll send you the exact list we still need, pre-filled wherever possible, so you only have to confirm rather than start from scratch."
    },
    compliance: {
      label: '合规 / 认证',
      skipCategory: '合规风险',
      re: /fda|fcc|cpsc|cfia|health canada|bmsb|ispm|biosecurity|certificate|认证|合规|生物安全/i,
      text: "On the compliance side, I'm checking the specific requirement against the current official rules, and I'll come back with the precise document or test report needed rather than a general list."
    }
  };

  function detectBridge(text, primaryCategory) {
    var keys = ['customs', 'fees', 'reference', 'delivery', 'damage', 'tax', 'docs', 'compliance'];
    for (var i = 0; i < keys.length; i++) {
      var b = BRIDGES[keys[i]];
      if (b.skipCategory === primaryCategory) continue;
      if (!b.re.test(text)) continue;
      // 只在客户原话里确实把该问题当作一个诉求时才补
      if (keys[i] === 'tax' && /tax refund|refund the tax|退税/i.test(text)) continue;
      return { key: keys[i], label: b.label, text: b.text };
    }
    return null;
  }

  function injectBridge(text, bridge) {
    var parts = String(text || '').split(/\n\n/);
    if (parts.length > 1) {
      parts.splice(parts.length - 1, 0, bridge.text);
      return parts.join('\n\n');
    }
    return String(text || '') + '\n\n' + bridge.text;
  }

  var GENERIC = {    AU: {
      standard: "Hi {{customer_name}}, thanks for flagging this — I've asked our clearance team to pull the latest status on {{container_no}} with ABF and the terminal. I'd rather come back to you with the confirmed position than a guess, so I'll update you by {{next_update_time}} today.\n\nIf you can send the bill number or a screenshot of the latest tracking update, I'll use it to chase the right queue. If it turns out to be a routine clearance step, I'll walk you through what happens next and when release is realistically expected.",
      warm: "Hi {{customer_name}}, I can hear how frustrating this is — especially when you're working to a deadline. I've picked this up personally and asked our clearance team to confirm exactly where {{container_no}} sits right now.\n\nI don't want to give you a vague answer, so here's my commitment: I'll come back to you by {{next_update_time}} with what we know, what's still being checked, and the next action. If you have the latest tracking screenshot, send it over — it helps me chase the right person at the terminal.",
      concise: "Hi {{customer_name}} — I'm checking {{container_no}} with our clearance team now. I'll come back to you by {{next_update_time}} with the confirmed status and next step, not a guess.\n\nIf you have the bill number or latest tracking screenshot, send it through so I can chase the right queue."
    },
    CA: {
      standard: "Hi {{customer_name}}, thanks for getting in touch — I've asked our broker to confirm the current status of {{container_no}} with CBSA and the terminal. I'd rather give you the verified position than a guess, so I'll update you by {{next_update_time}} today.\n\nIf you can share the bill number or a screenshot of the latest tracking, I'll use it to chase the right queue. If it's a normal clearance step, I'll explain what happens next and when release is realistically expected under the current CBSA process.",
      warm: "Hi {{customer_name}}, I completely understand the worry — this timing is not what you planned for. I've taken this on personally and asked our broker to confirm exactly where {{container_no}} is in the CBSA process right now.\n\nI won't leave you guessing: I'll come back to you by {{next_update_time}} with the confirmed position and the next action. If you have the latest tracking screenshot, send it over — it helps me follow up with the right team.",
      concise: "Hi {{customer_name}} — I'm checking {{container_no}} with our broker and CBSA now. I'll come back to you by {{next_update_time}} with the verified status and next step.\n\nIf you have the bill number or a tracking screenshot, send it through so I can chase the right queue."
    },
    US: {
      standard: "Hi {{customer_name}}, thanks for reaching out — I've asked our broker to confirm the current status of {{container_no}} with CBP and the terminal. I'd rather come back with the verified position than a guess, so I'll update you by {{next_update_time}} today.\n\nIf you can send the bill number or a screenshot of the latest tracking, I'll use it to chase the right queue. If it's a routine clearance step, I'll explain what happens next and when release is realistically expected.",
      warm: "Hi {{customer_name}}, I understand how stressful this is — especially when your plans depend on this shipment. I've picked it up personally and asked our broker to confirm exactly where {{container_no}} sits with CBP right now.\n\nI won't leave you chasing me: I'll come back to you by {{next_update_time}} with what we know, what's still being checked, and the next action. If you have the latest tracking screenshot, send it over.",
      concise: "Hi {{customer_name}} — I'm checking {{container_no}} with our broker and CBP now. I'll update you by {{next_update_time}} with the verified status and next step.\n\nIf you have the bill number or tracking screenshot, send it through so I can chase the right queue."
    }
  };

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function normalizeCJK(text) {
    var s = String(text || '');
    for (var i = 0; i < 3; i++) {
      s = s.replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1')
           .replace(/([\u4e00-\u9fa5])\s+([，。！？、；：（）《》“”‘’])/g, '$1$2')
           .replace(/([，。！？、；：（）《》“”‘’])\s+(?=[\u4e00-\u9fa5])/g, '$1');
    }
    return s;
  }

  function detectLang(text) {
    var cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    return cn >= Math.max(2, text.length * 0.08) ? 'zh' : 'en';
  }

  function suggestCountry(text) {
    var best = null, bestScore = 0;
    COUNTRY_HINTS.forEach(function (h) {
      var m = text.match(new RegExp(h.re.source, 'gi'));
      var score = m ? m.length * h.w : 0;
      if (score > bestScore) { bestScore = score; best = h.c; }
    });
    return bestScore >= 2 ? best : null;
  }

  function detectPort(text) {
    for (var i = 0; i < PORT_HINTS.length; i++) {
      if (PORT_HINTS[i][0].test(text)) return PORT_HINTS[i][1];
    }
    return '';
  }

  function extractContext(text) {
    var container = (text.match(/\b[A-Z]{4}\d{7}\b/) || [])[0] || '';
    var bm = text.match(/\b(?:B\/L|BL|HBL|MBL|BILL OF LADING)[\s:#-]*([A-Z0-9][A-Z0-9-]{3,})/i);
    var om = text.match(/\b(?:order|PO|SO|invoice)[\s:#-]*([A-Z0-9][A-Z0-9-]{3,})/i);
    var am = text.match(/(?:US\$|A\$|C\$|USD|AUD|CAD|\$)\s?[\d,]+(?:\.\d{1,2})?/i);
    var dm = text.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\bnext\s+(?:mon|tues|wednes|thurs|fri|satur|sun)[a-z]*\b|\bthis\s+(?:week|weekend|month)\b|\btomorrow\b/i);
    return {
      container_no: container,
      bill_no: bm ? bm[1] : '',
      order_no: om ? om[1] : '',
      amount: am ? am[0].trim() : '',
      port: detectPort(text),
      deadline: dm ? dm[0] : ''
    };
  }

  function extractEntities(text) {
    var out = [];
    function push(type, val) {
      if (val && !out.some(function (e) { return e.value === val; })) out.push({ type: type, value: val });
    }
    (text.match(/\b[A-Z]{4}\d{7}\b/g) || []).forEach(function (v) { push('柜号', v); });
    (text.match(/\b(?:1Z[0-9A-Z]{16}|[0-9]{12,22})\b/g) || []).forEach(function (v) { push('运单号', v); });
    (text.match(/\b(?:BL|B\/L|BILL)[\s:#-]*([A-Z0-9-]{5,})/gi) || []).forEach(function (v) {
      var m = v.match(/([A-Z0-9-]{5,})$/i); if (m) push('提单号', m[1]);
    });
    (text.match(/(?:US\$|A\$|C\$|USD|AUD|CAD|\$)\s?[\d,]+(?:\.\d{1,2})?/gi) || []).forEach(function (v) { push('金额', v.trim()); });
    (text.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g) || []).forEach(function (v) { push('日期', v); });
    (text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).forEach(function (v) { push('邮箱', v); });
    (text.match(/(?:order|po|so|invoice)[\s#:-]*([A-Z0-9-]{4,})/gi) || []).forEach(function (v) {
      var m = v.match(/([A-Z0-9-]{4,})$/i); if (m) push('单号', m[1]);
    });
    return out.slice(0, 8);
  }

  function scoreScenario(s, text) {
    var score = 0, lower = text.toLowerCase();
    var acronymRe = /^(ABF|DAFF|CBSA|CARM|CBP|ISF|HTS|PGA|FDA|FCC|CPSC|CFIA|BMSB|ISPM|IEEPA|CAPE|FMC|ATL|RPP|IOR|LCL|DDP|GST|HST|PST)$/i;
    var strongAcronym = /^(CARM|ISF|RPP|BMSB|ISPM|PGA|IEEPA|CAPE|CFIA|FMC|ATL|CROSS|NII|CET)$/i;
    (s.keywords || []).forEach(function (k) {
      var raw = String(k || '').trim();
      var kk = raw.toLowerCase();
      if (!kk) return;
      if (CN_RE.test(kk)) {
        if (lower.indexOf(kk) !== -1) score += 2.4;
      } else {
        var re = new RegExp('(^|[^a-z0-9])' + escRe(kk) + '(?=$|[^a-z0-9])', 'g');
        var m = lower.match(re);
        if (m) score += Math.min(3, m.length) * 1.7;
        if (acronymRe.test(raw) && new RegExp('(^|[^A-Za-z0-9])' + escRe(raw) + '(?=$|[^A-Za-z0-9])', 'i').test(text)) {
          score += strongAcronym.test(raw) ? 3.4 : 1.2;
        }
      }
    });
    var titleWords = (s.title_en || '').toLowerCase().split(/[^a-z]+/).filter(function (w) { return w.length > 3; });
    var hit = 0;
    titleWords.forEach(function (w) { if (lower.indexOf(w) !== -1) hit++; });
    score += Math.min(3, hit) * 0.8;
    CATEGORY_HINTS.forEach(function (h) {
      if (h.boost === s.category && h.re.test(text)) score += h.extra;
    });
    (s.customer_signals || []).forEach(function (sig) {
      var words = String(sig).toLowerCase().split(/[^a-z\u4e00-\u9fa5]+/).filter(function (w) { return w.length > 3; });
      var n = 0;
      words.forEach(function (w) { if (lower.indexOf(w) !== -1) n++; });
      if (n >= 3) score += 1.2;
    });
    return score;
  }

  function analyze(text, opts) {
    opts = opts || {};
    text = normalizeCJK(text);
    var country = opts.country && opts.country !== 'ALL' ? opts.country : null;
    var pool = (opts.scenarios || []).filter(function (s) { return !country || s.country === country; });
    var scored = pool.map(function (s) { return { scenario: s, score: scoreScenario(s, text) }; })
      .filter(function (x) { return x.score >= 2.2; })
      .sort(function (a, b) { return b.score - a.score; });
    var top = scored[0];
    return {
      language: detectLang(text),
      country: country || suggestCountry(text) || (opts.fallbackCountry || 'AU'),
      entities: extractEntities(text),
      context: extractContext(text),
      matches: scored.slice(0, 3).map(function (x) {
        return {
          scenario: x.scenario,
          score: Math.round(x.score * 10) / 10,
          confidence: Math.min(0.97, 0.52 + x.score * 0.035)
        };
      }),
      confidence: top ? Math.min(0.97, 0.52 + top.score * 0.035) : 0
    };
  }

  function fillDefaults(text, opts) {
    opts = opts || {};
    var settings = opts.settings || {};
    return String(text || '')
      .replace(/\{\{agent_name\}\}/g, settings.agentName || '{{agent_name}}')
      .replace(/\{\{company_name\}\}/g, settings.companyName || '{{company_name}}');
  }

  function mkReply(script, source, scenario) {
    return {
      tone: script.tone || 'standard',
      label: script.label_zh || script.tone || '标准版',
      phase: script.phase || 'first',
      use_when: script.use_when || '',
      text: script.text || '',
      placeholders: script.placeholders || [],
      scenarioId: scenario ? scenario.id : null,
      source: source
    };
  }

  function genericReplies(country) {
    var pack = GENERIC[country] || GENERIC.AU;
    return [
      { tone: 'standard', label: '标准版 · 首次回复', phase: 'first', text: pack.standard, placeholders: ['customer_name', 'container_no', 'next_update_time'], source: 'generic' },
      { tone: 'warm', label: '共情版 · 更柔和', phase: 'first', text: pack.warm, placeholders: ['customer_name', 'container_no', 'next_update_time'], source: 'generic' },
      { tone: 'concise', label: '简洁版 · 少寒暄', phase: 'first', text: pack.concise, placeholders: ['customer_name', 'container_no', 'next_update_time'], source: 'generic' }
    ];
  }

  function riskFlags(text, kind) {
    var flags = [];
    if (kind === 'quote') {
      if (/\bddp\b|duty|tax|gst|关税|税/i.test(text)) {
        flags.push({ level: 'medium', label: '客户提到 DDP / 税费：报价前先确认报价单是否含税，避免二次收费争议' });
      }
      if (/battery|liquid|food|cosmetic|brand|电池|液体|食品|化妆品|品牌/i.test(text)) {
        flags.push({ level: 'medium', label: '可能涉及敏感货：先确认电池 / 液体 / 食品 / 品牌授权与目的国准入' });
      }
      flags.push({ level: 'low', label: '询价阶段不要先报一个“大概价格”；先收齐 CBM、毛重、地址、DDP/DDU 再给书面报价' });
      return flags;
    }
    if (kind === 'reference') {
      flags.push({ level: 'medium', label: '柜号属于 DDP 拼箱内部信息：按公司口径解释，不承诺一定提供；先问清用途' });
      return flags;
    }
    if (/refund|compensat|chargeback|money back|退款|赔偿|索赔|理赔/i.test(text)) {
      flags.push({ level: 'high', label: '客户提到退款 / 赔偿：先确认责任与保险状态，不在第一条消息里承诺金额' });
    }
    if (/lawyer|sue\b|legal|court|律师|起诉|曝光|投诉到|平台投诉/i.test(text)) {
      flags.push({ level: 'high', label: '涉及法律或公开投诉：升级主管，避免书面承认责任' });
    }
    if (/angry|unacceptable|ridiculous|terrible|垃圾|太差|生气|无语/i.test(text)) {
      flags.push({ level: 'medium', label: '情绪较强：先接情绪，再给时间点；不要先解释流程' });
    }
    if (/deadline|launch|opening|promise date|开业|上线|活动|赶时间/i.test(text)) {
      flags.push({ level: 'medium', label: '客户有硬性时间节点：同步可替代方案（分批/改派/延迟函）' });
    }
    if (!extractEntities(text).length) {
      flags.push({ level: 'low', label: '未识别到提单 / 订舱号：回复前尽量补全，或先向客户索取 reference' });
    }
    return flags;
  }

  var INTENT_LABELS = {
    quote: '售前询价',
    booking: '订舱 / 入仓',
    status: '在途查询',
    reference: '柜号与追踪口径',
    aftersales: '售后处理',
    general: '其他咨询'
  };

  var ORIGIN_CITIES = [
    [/yiwu|义乌/i, 'Yiwu'], [/shenzhen|深圳/i, 'Shenzhen'], [/guangzhou|广州/i, 'Guangzhou'],
    [/shanghai|上海/i, 'Shanghai'], [/ningbo|宁波/i, 'Ningbo'], [/xiamen|厦门/i, 'Xiamen'],
    [/qingdao|青岛/i, 'Qingdao'], [/foshan|佛山/i, 'Foshan'], [/dongguan|东莞/i, 'Dongguan'],
    [/hangzhou|杭州/i, 'Hangzhou']
  ];
  var DEST_CITIES = [
    [/toronto|多伦多/i, 'Toronto'], [/vancouver|温哥华/i, 'Vancouver'], [/montreal|蒙特利尔/i, 'Montreal'],
    [/calgary|卡尔加里/i, 'Calgary'], [/sydney|悉尼/i, 'Sydney'], [/melbourne|墨尔本/i, 'Melbourne'],
    [/brisbane|布里斯班/i, 'Brisbane'], [/fremantle|弗里曼特尔|perth|珀斯/i, 'Fremantle'],
    [/los angeles|洛杉矶|lax\b/i, 'Los Angeles'], [/long beach|长滩/i, 'Long Beach'],
    [/new york|纽约|newark|纽瓦克/i, 'New York'], [/savannah|萨凡纳/i, 'Savannah'],
    [/seattle|西雅图|tacoma|塔科马/i, 'Seattle'], [/houston|休斯顿/i, 'Houston'], [/chicago|芝加哥/i, 'Chicago']
  ];

  function findCity(text, list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i][0].test(text)) return list[i][1];
    }
    return '';
  }

  function numberWord(n) {
    var map = { '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten' };
    var cn = { '一': 'one', '二': 'two', '两': 'two', '三': 'three', '四': 'four', '五': 'five', '六': 'six', '七': 'seven', '八': 'eight', '九': 'nine', '十': 'ten' };
    return map[String(n)] || cn[String(n)] || String(n);
  }

  function quoteDetails(text) {
    var m = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\s+(?:different\s+)?suppliers?\b/i);
    var count = m ? numberWord(m[1].toLowerCase()) : '';
    if (!count) {
      var cn = text.match(/([一二三四五六七八九十\d]+)\s*(?:家|个)\s*(?:供应商|工厂|卖家)/);
      if (cn) count = numberWord(cn[1]);
    }
    return {
      origin: findCity(text, ORIGIN_CITIES) || 'China',
      dest: findCity(text, DEST_CITIES) || '',
      supplierCount: count,
      ready: /\bready\b|货好|备好|可出运|可发货/i.test(text),
      warehouseToWarehouse: /warehouse\s*(?:to|→|->)\s*(?:my\s+)?warehouse|仓到仓|门到门/i.test(text),
      ddpMentioned: /\bddp\b|\bddu\b|duty|tax|关税|税/i.test(text)
    };
  }

  function detectIntent(text) {
    var strongProblem = /(\bhold\b|\bheld\b|customs hold|on hold|detained|inspection|\bexam(?:ination)?\b|delayed|\blate\b|damaged|broken|wet|missing|shortage|refund|compensation|claim|failed|reschedule|rejected|stuck|storage|demurrage|detention|tax bill|duty bill|扣关|查验|延误|破损|少件|赔偿|退款|索赔|卡住|退件|滞港|仓储费)/i.test(text);
    if (strongProblem) return 'aftersales';
    if (/\bprice\b|\bquote\b|quotation|\brate\b|how much|\bcost\b|运费|报价|价格|多少钱/i.test(text)) return 'quote';
    if (/container number|container no\.?|which container|container\s*#|柜号|集装箱号/i.test(text)) return 'reference';
    if (/\bbook(?:ing)?\b|place\s+(?:an\s+)?order|下单|订舱|订柜|安排出货|入仓|收货/i.test(text)) return 'booking';
    if (/where is|\bstatus\b|tracking|\beta\b|when will|arrive|到哪|进度|几时到|什么时候到|船期/i.test(text)) return 'status';
    return 'general';
  }

  function r(tone, label, text, source) {
    return { tone: tone, label: label, phase: 'first', text: text, source: source || 'presales' };
  }

  function quoteReplies(details, country) {
    var origin = details.origin || 'China';
    var dest = details.dest || '';
    var suppliers = details.supplierCount ? details.supplierCount + ' suppliers' : 'your suppliers';
    var destPhrase = dest ? 'your warehouse in ' + dest : 'your destination warehouse';
    var destAddr = dest ? 'full ' + dest + ' address' : 'full destination address';
    var ready = details.ready ? ', cargo ready' : '';
    var clearance = { AU: 'Australian border clearance', CA: 'Canadian border clearance', US: 'US border clearance' }[country] || 'destination clearance';

    var standard = "Hi {{customer_name}}, thanks for the details — " + suppliers + " in " + origin + ready + ", consolidated at our warehouse and delivered to " + destPhrase + ". That's a warehouse-to-warehouse LCL move I can quote.\n\n"
      + "To give you a rate that holds, I need five things: carton count, CBM and gross weight per supplier; when the cargo will be at our " + origin + " warehouse; the " + destAddr + " and postal code, including loading-dock access; whether you want DDP (duty and tax included) or DDU; and the goods description with declared value.\n\n"
      + "Send those over and I'll come back with a written quote within one business day, with every line shown — consolidation, ocean freight, " + clearance + ", duty and tax if DDP, and final delivery. If the suppliers need pickup, add their addresses and I'll include it.";

    var warm = "Hi {{customer_name}}, keeping " + suppliers + " in " + origin + " together is very workable — we can receive all of them at our " + origin + " warehouse, consolidate them into one LCL booking and deliver to " + destPhrase + ". You get one set of documents and one point of contact instead of chasing every supplier.\n\n"
      + "To price it properly, send me the CBM and gross weight per supplier, the cargo ready date, your " + destAddr + " and postal code, and whether you'd like DDP with duty and tax included. If the suppliers need pickup, give me their addresses and I'll build that in.\n\n"
      + "I'll come back within one business day with a quote that shows every cost line, so you can compare it properly rather than guess what's inside.";

    var concise = "Hi {{customer_name}} — got it: " + suppliers + " in " + origin + ready + ", consolidated at our warehouse, delivered to " + destPhrase + ". For an accurate all-in rate, send me: CBM and gross weight per supplier, ready date, " + destAddr + " and postal code, and whether it's DDP or DDU. I'll send the warehouse-to-warehouse quote within one business day.";

    return [
      r('standard', '标准版 · 询价回复', standard),
      r('warm', '顾问版 · 集货建议', warm),
      r('concise', '简洁版 · 直接问数', concise)
    ];
  }

  function bookingReplies(details, country) {
    var origin = details.origin || 'China';
    var dest = details.dest || '';
    var destPhrase = dest ? 'your warehouse in ' + dest : 'your destination warehouse';
    var standard = "Hi {{customer_name}}, happy to book this. To confirm the sailing and cut-off I need: the supplier or pickup address (or the warehouse you'll drop off at), cargo description, carton count / CBM / gross weight, cargo ready date, " + destPhrase + " address and postal code, and whether this is DDP or DDU. Send those and I'll confirm the booking, documents and cut-off within one business day.";
    var warm = "Hi {{customer_name}}, glad to take this on. I'll set up the booking from " + origin + " to " + destPhrase + " once I have the cargo details — pickup or drop-off address, carton count / CBM / gross weight, ready date, destination address and DDP or DDU. Send them in one message if that's easier; I'll turn it into a booking confirmation and flag anything missing.";
    var concise = "Hi {{customer_name}} — happy to book. Send me: pickup/drop-off address, cargo description, CBM and gross weight, ready date, " + destPhrase + " address and postal code, DDP or DDU. I'll confirm sailing, cut-off and documents within one business day.";
    return [
      r('standard', '标准版 · 订舱确认', standard),
      r('warm', '共情版 · 承接需求', warm),
      r('concise', '简洁版 · 订舱清单', concise)
    ];
  }

  function statusReplies() {
    return [
      r('standard', '标准版 · 查在途', "Hi {{customer_name}}, thanks for checking in. Send me the booking, bill or order reference and I'll confirm the latest milestone with the carrier and terminal, then update you by {{next_update_time}}. If you have a tracking screenshot, send it through so I chase the right queue.", 'service'),
      r('warm', '共情版 · 主动跟进', "Hi {{customer_name}}, I can see why you want a clear answer. Send me the reference on the booking and I'll go straight to the carrier for the latest position, not a copy of the tracking page — then message you by {{next_update_time}} with what's confirmed and what's still moving.", 'service'),
      r('concise', '简洁版 · 少寒暄', "Hi {{customer_name}} — send me the booking or bill reference and I'll confirm the latest status with the carrier, then update you by {{next_update_time}}.", 'service')
    ];
  }

  function referenceReplies() {
    return [
      r('standard', '标准版 · 柜号口径', "Hi {{customer_name}}, on DDP consolidated shipments we don't release the container number as standard. One container carries several customers' cargo, so we manage visibility at shipment level: I can give you the booking or HAWB reference, the vessel and departure/arrival milestones, and the delivery plan. If you need the container number for a specific claim or document, tell me what it's for and I'll check what the carrier permits.", 'service'),
      r('warm', '共情版 · 解释清楚', "Hi {{customer_name}}, I know it's easier when you can follow a container number. For DDP LCL we don't hand it out as standard because the box is shared by several customers and our control is at shipment level, not container level. What I can give you is the booking reference, the vessel, the departure and arrival milestones, and the delivery plan — the same visibility, just at the right level. If you need the number for a claim or a specific document, tell me the purpose and I'll see what the carrier allows.", 'service'),
      r('concise', '简洁版 · 一图流', "Hi {{customer_name}} — for DDP LCL we don't release the container number; it's a consolidated box carrying multiple customers' cargo. I'll give you the booking/HAWB reference and milestone updates instead. If you need it for a claim or document, tell me the purpose and I'll check what can be shared.", 'service')
    ];
  }

  function generalReplies() {
    return [
      r('standard', '标准版 · 先问清楚', "Hi {{customer_name}}, thanks for the message. So I give you a precise answer rather than a generic one: tell me what you're shipping, from where to where, whether it's ready, and what you need from us — a price, a booking, a status or a document. I'll come back with the right next step.", 'service'),
      r('warm', '共情版 · 承接需求', "Hi {{customer_name}}, happy to help — I just want to point you to the right person first time. Send me the origin, destination, cargo details, ready date and what you need (price, booking, status or paperwork), and I'll take it from there.", 'service'),
      r('concise', '简洁版 · 直接问', "Hi {{customer_name}} — tell me what you're shipping, from where to where, whether it's ready, and whether you need a price, booking, status or document. I'll come back with the next step.", 'service')
    ];
  }

  function clarifyReplies() {
    return [
      r('standard', '标准版 · 先确认问题', "Hi {{customer_name}}, I want to make sure I answer the actual issue rather than a template. Send me the booking, bill or order reference and one line on what's happening — held, delayed, damaged or a charge — and I'll confirm the facts and the next step by {{next_update_time}}.", 'service'),
      r('warm', '共情版 · 不猜', "Hi {{customer_name}}, I'd rather ask than guess and give you the wrong answer. Send me the reference and a sentence on what's gone wrong; I'll check with the right team and come back to you by {{next_update_time}} with the facts.", 'service'),
      r('concise', '简洁版 · 要信息', "Hi {{customer_name}} — send me the reference and one line on what's happening, and I'll confirm the facts and next step by {{next_update_time}}.", 'service')
    ];
  }

  function checklistFor(kind, country) {
    if (kind === 'quote') {
      return [
        '确认起运地 / 提货地址，或供应商送货入仓',
        '确认件数、CBM、毛重（按供应商拆分）',
        '确认目的仓地址、邮编与卸货条件',
        '确认 DDP 还是 DDU，以及申报货值',
        '确认是否含电池 / 液体 / 品牌等敏感属性'
      ];
    }
    if (kind === 'booking') {
      return [
        '确认提货 / 送货入仓方式与地址',
        '确认 CBM、毛重、件数与货好日期',
        '确认目的仓地址与联系人',
        '确认 DDP / DDU 与单证需求',
        '确认截关 / 开船时间后再回复客户'
      ];
    }
    if (kind === 'status') {
      return ['核对 booking / bill / order reference', '确认最新节点与 ETA 口径', '确认下一次主动同步时间'];
    }
    if (kind === 'reference') {
      return ['确认客户索要柜号的用途（清关 / 索赔 / 内部追踪）', '核对 booking / HAWB reference 与节点', '按公司口径只提供可披露的追踪信息'];
    }
    if (kind === 'general') {
      return ['确认客户具体要什么（价格 / 订舱 / 在途 / 文件）', '确认起运地、目的地、货好时间', '再决定转给哪个岗位'];
    }
    return [
      '核对提单 / 订舱号与系统记录一致（DDP 拼箱一般不向客户提供柜号）',
      '确认最新节点时间与 ETA 口径（不要凭记忆）',
      '确认费用承担方：DDP 已含 / 需另行书面确认',
      '涉及金额、赔付、时效承诺时，先走内部审批'
    ];
  }

  function generate(text, opts) {
    opts = opts || {};
    text = normalizeCJK(text);
    var scenarios = opts.scenarios || [];
    var forcedCountry = opts.country && opts.country !== 'ALL' ? opts.country : null;
    var analysis = analyze(text, { scenarios: scenarios, country: forcedCountry });
    var picked = forcedCountry || analysis.country || 'AU';
    var forcedIntent = opts.intent && opts.intent !== 'auto' ? opts.intent : null;
    var intent = forcedIntent || detectIntent(text);
    var details = quoteDetails(text);
    var replies = [];
    var scenario = null;
    var bridge = null;
    var kind = intent;

    if (intent === 'quote') {
      replies = quoteReplies(details, picked);
    } else if (intent === 'booking') {
      replies = bookingReplies(details, picked);
    } else if (intent === 'status') {
      replies = statusReplies();
    } else if (intent === 'reference') {
      replies = referenceReplies();
    } else if (intent === 'general') {
      replies = generalReplies();
    } else {
      if (analysis.matches.length && analysis.matches[0].score >= 4.0) {
        scenario = analysis.matches[0].scenario;
        var scripts = scenario.scripts || [];
        var first = scripts.find(function (s) { return s.phase === 'first'; }) || scripts[0];
        if (first) replies.push(mkReply(first, 'library', scenario));
        (scenario.alts || []).forEach(function (a) {
          if (replies.length < 3) replies.push(mkReply(a, 'library', scenario));
        });
        scripts.forEach(function (s) {
          if (replies.length < 3 && (!first || s !== first)) replies.push(mkReply(s, 'library', scenario));
        });
        bridge = detectBridge(text, scenario.category);
      } else {
        replies = clarifyReplies();
        intent = 'aftersales';
      }
    }

    if (replies.length < 3) {
      replies = replies.concat(clarifyReplies()).slice(0, 3);
    }
    replies = replies.slice(0, 3).map(function (r, i) {
      r.rank = i + 1;
      r.text = fillDefaults(r.text, opts);
      r.placeholders = missingTokens(r.text);
      return r;
    });

    if (bridge) {
      replies = replies.map(function (r) {
        return Object.assign({}, r, { text: injectBridge(r.text, bridge), placeholders: missingTokens(injectBridge(r.text, bridge)) });
      });
    }

    var ctx = analysis.context || {};
    var vars = {};
    ['container_no', 'bill_no', 'order_no', 'amount', 'port'].forEach(function (k) {
      if (ctx[k]) vars[k] = ctx[k];
    });
    if (ctx.deadline) vars.deadline = ctx.deadline;
    vars.next_update_time = (opts.settings && opts.settings.nextUpdateTime) || '6pm';

    return {
      analysis: analysis,
      country: picked,
      scenario: scenario,
      kind: kind,
      intent: intent,
      intentLabel: INTENT_LABELS[intent] || INTENT_LABELS.aftersales,
      details: details,
      replies: replies,
      vars: vars,
      bridge: bridge,
      risks: riskFlags(text, kind),
      checklist: checklistFor(kind, picked),
      generatedAt: new Date().toISOString()
    };
  }

  function missingTokens(texts) {
    var set = [];
    (Array.isArray(texts) ? texts : [texts]).forEach(function (t) {
      var re = /\{\{(\w+)\}\}/g, m;
      while ((m = re.exec(t || ''))) {
        if (set.indexOf(m[1]) === -1) set.push(m[1]);
      }
    });
    return set;
  }

  function applyVars(text, vars) {
    vars = vars || {};
    return String(text || '').replace(/\{\{(\w+)\}\}/g, function (full, key) {
      var v = vars[key];
      return v !== undefined && String(v).trim() !== '' ? String(v) : full;
    });
  }

  window.DDCEngine = {
    analyze: analyze,
    generate: generate,
    suggestCountry: suggestCountry,
    detectLang: detectLang,
    extractEntities: extractEntities,
    missingTokens: missingTokens,
    applyVars: applyVars,
    fillDefaults: fillDefaults,
    riskFlags: riskFlags,
    checklistFor: checklistFor,
    detectIntent: detectIntent,
    INTENT_LABELS: INTENT_LABELS,
    CATEGORY_HINTS: CATEGORY_HINTS
  };
})();
