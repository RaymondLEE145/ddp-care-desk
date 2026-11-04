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
    [/port botany|sydney|syd\b/i, 'Port Botany, Sydney'],
    [/melbourne|mel\b/i, 'Melbourne'],
    [/brisbane|bne\b/i, 'Brisbane'],
    [/fremantle|perth/i, 'Fremantle'],
    [/vancouver|van\b/i, 'Vancouver'],
    [/prince rupert/i, 'Prince Rupert'],
    [/toronto|yyz/i, 'Toronto'],
    [/montreal|yul/i, 'Montreal'],
    [/calgary/i, 'Calgary'],
    [/los angeles|lax\b/i, 'Los Angeles'],
    [/long beach|lgb\b/i, 'Long Beach'],
    [/new york|newark|nyc\b/i, 'New York / Newark'],
    [/savannah/i, 'Savannah'],
    [/seattle|tacoma/i, 'Seattle / Tacoma'],
    [/houston/i, 'Houston'],
    [/chicago/i, 'Chicago (IPI)']
  ];

  var BRIDGES = {
    fees: {
      label: '费用 / 仓储',
      skipCategory: '费用争议',
      re: /storage|demurrage|detention|who pays|who covers|cost|fee|charge|仓储|堆存|滞箱|滞港|费用|谁付|谁承担/i,
      text: "On the cost point: I'm checking what caused the charge and how it sits under your DDP terms. I'll send the breakdown in writing before anything is billed."
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
    var keys = ['fees', 'delivery', 'damage', 'tax', 'docs', 'compliance'];
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
    (s.keywords || []).forEach(function (k) {
      var kk = String(k || '').toLowerCase().trim();
      if (!kk) return;
      if (CN_RE.test(kk)) {
        if (lower.indexOf(kk) !== -1) score += 2.4;
      } else {
        var re = new RegExp('(^|[^a-z0-9])' + escRe(kk) + '(?=$|[^a-z0-9])', 'g');
        var m = lower.match(re);
        if (m) score += Math.min(3, m.length) * 1.7;
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

  function riskFlags(text) {
    var flags = [];
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
      flags.push({ level: 'low', label: '未识别到柜号/单号：回复前尽量补全，或先向客户索取提单号' });
    }
    return flags;
  }

  function checklist(country) {
    var base = [
      '核对柜号 / 提单号与系统记录一致',
      '确认最新节点时间与 ETA 口径（不要凭记忆）',
      '确认费用承担方：DDP 已含 / 需另行书面确认',
      '涉及金额、赔付、时效承诺时，先走内部审批'
    ];
    if (country === 'AU') base.push('涉及生物安全/木包装时，先确认 BICON 与 ISPM15 状态');
    if (country === 'CA') base.push('涉及放行时，先确认 CARM / RPP 与进口商资料是否就绪');
    if (country === 'US') base.push('涉及税费时，先确认 HTS 归类与 301/IEEPA 适用口径');
    return base;
  }

  function generate(text, opts) {
    opts = opts || {};
    var scenarios = opts.scenarios || [];
    var country = opts.country && opts.country !== 'ALL' ? opts.country : null;
    var analysis = analyze(text, { scenarios: scenarios, country: country });
    var picked = country || analysis.country || 'AU';
    var replies = [];
    var scenario = null;

    if (analysis.matches.length) {
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
    }
    if (replies.length < 3) {
      replies = replies.concat(genericReplies(picked));
    }
    replies = replies.slice(0, 3).map(function (r, i) {
      r.rank = i + 1;
      r.text = fillDefaults(r.text, opts);
      return r;
    });

    var bridge = detectBridge(text, scenario ? scenario.category : '');
    if (bridge) {
      replies = replies.map(function (r) {
        return Object.assign({}, r, { text: injectBridge(r.text, bridge) });
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
      replies: replies,
      vars: vars,
      bridge: bridge,
      risks: riskFlags(text),
      checklist: checklist(picked),
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
    checklist: checklist,
    CATEGORY_HINTS: CATEGORY_HINTS
  };
})();
