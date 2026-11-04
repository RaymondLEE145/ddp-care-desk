/* =========================================================
   CareDesk — application shell
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var COUNTRIES = {
    ALL: { code: 'ALL', name: '全部专线', lane: '中澳 · 中加 · 中美', en: 'All lanes' },
    AU: { code: 'AU', name: '澳大利亚', short: '澳洲', lane: '中澳专线', en: 'China → Australia' },
    CA: { code: 'CA', name: '加拿大', short: '加拿大', lane: '中加专线', en: 'China → Canada' },
    US: { code: 'US', name: '美国', short: '美国', lane: '中美专线', en: 'China → United States' }
  };

  var CATEGORIES = ['清关异常', '税费争议', '时效延误', '货损短少', '派送异常', '合规风险', '费用争议', '客户情绪'];
  var STAGES = ['下单', '提货', '报关', '开船', '到港', '清关', '派送', '签收后', '全程'];
  var SEV = { high: '高', medium: '中', low: '低' };
  var TONE = { standard: 'STD', warm: 'WARM', concise: 'CONCISE', firm: 'FIRM', supervisor: 'LEAD' };

  var state = {
    route: 'dashboard',
    scenarios: [],
    policy: [],
    settings: {},
    saved: [],
    archives: [],
    savedTab: 'replies',
    arcQuery: '',
    mode: 'local',
    ai: false,
    bootError: '',
    filter: { country: 'ALL', category: 'ALL', stage: 'ALL', query: '', sort: 'default' },
    detailId: null,
    detailTab: 0,
    detailVars: {},
    focusLibSearch: false,
    reply: {
      tab: 'image', file: null, dataUrl: null, text: '', country: 'AU', countryTouched: false,
      busy: false, progress: 0, status: '', result: null, vars: {}, fromOcr: false, archiveId: null
    },
    editor: { draft: null, loadedFor: null, error: '' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function highlight(text) {
    return esc(text).replace(/\{\{(\w+)\}\}/g, function (m, k) {
      return '<span class="token">{{' + k + '}}</span>';
    });
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function fmtDate(d) { return d || '—'; }
  function stripTags(s) { return String(s || '').replace(/<[^>]*>/g, ''); }
  function countWords(t) { return String(t || '').trim().split(/\s+/).filter(Boolean).length; }
  function byId(id) { return state.scenarios.filter(function (s) { return s.id === id; })[0]; }

  function toast(msg, isErr) {
    var root = $('#toastRoot');
    var el = document.createElement('div');
    el.className = 'toast' + (isErr ? ' err' : '');
    el.innerHTML = (isErr ? window.icon('alert') : window.icon('check-circle')) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      el.style.transition = 'all .2s';
      setTimeout(function () { el.remove(); }, 220);
    }, 2800);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch (e) { return false; }
  }

  function downloadFile(name, text, type) {
    var blob = new Blob([text], { type: type || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function scriptsOf(s) {
    var list = [];
    (s.scripts || []).forEach(function (sc) { list.push(Object.assign({}, sc, { group: 'flow' })); });
    (s.alts || []).forEach(function (al) { list.push(Object.assign({}, al, { group: 'alt' })); });
    return list;
  }
  function scriptCount(s) { return scriptsOf(s).length; }

  function allText(s) {
    return [
      s.id, s.title_zh, s.title_en, s.summary_zh, s.category, s.stage, s.country, s.lane,
      (s.keywords || []).join(' '), (s.customer_signals || []).join(' '),
      (s.scripts || []).map(function (x) { return x.text + ' ' + x.label_zh; }).join(' '),
      (s.alts || []).map(function (x) { return x.text + ' ' + x.label_zh; }).join(' ')
    ].join(' ').toLowerCase();
  }

  function filteredScenarios() {
    var f = state.filter, q = f.query.trim().toLowerCase();
    var list = state.scenarios.filter(function (s) {
      if (f.country !== 'ALL' && s.country !== f.country) return false;
      if (f.category !== 'ALL' && s.category !== f.category) return false;
      if (f.stage !== 'ALL' && s.stage !== f.stage) return false;
      if (q && allText(s).indexOf(q) === -1) return false;
      return true;
    });
    if (f.sort === 'recent') {
      list.sort(function (a, b) { return String(b.updated_at || '').localeCompare(String(a.updated_at || '')); });
    } else if (f.sort === 'severity') {
      var rank = { high: 0, medium: 1, low: 2 };
      list.sort(function (a, b) { return (rank[a.severity] || 9) - (rank[b.severity] || 9); });
    }
    return list;
  }

  /* ---------------- routing ---------------- */

  function parseHash() {
    var raw = location.hash.replace(/^#/, '') || '/';
    var qi = raw.indexOf('?');
    var path = (qi >= 0 ? raw.slice(0, qi) : raw);
    var query = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '');
    var parts = path.split('/').filter(Boolean);
    return { parts: parts, query: query };
  }

  function render() {
    var h = parseHash();
    var parts = h.parts;
    var route = 'dashboard';
    var detailId = null;

    if (parts[0] === 'library') { route = 'library'; detailId = parts[1] || null; }
    else if (parts[0] === 'reply') route = 'reply';
    else if (parts[0] === 'saved') route = 'saved';
    else if (parts[0] === 'new') route = 'editor';
    else if (parts[0] === 'settings') route = 'settings';

    var prevRoute = state.route;
    state.route = route;
    state.detailId = detailId;
    state.currentQuery = h.query;

    setNav(route);
    var crumb = {
      dashboard: '工作台', library: '话术库', reply: '截图改话', saved: '我的回复',
      editor: '新增话术', settings: '设置'
    }[route];
    if (route === 'library' && detailId) {
      var d = byId(detailId);
      crumb = '话术库 / ' + (d ? d.title_zh : '详情');
    }
    if (route === 'editor' && h.query.get('edit')) crumb = '编辑话术';
    $('#crumb').textContent = crumb;

    if (route === 'dashboard') { viewDashboard(); }
    else if (route === 'library') { viewLibrary(); }
    else if (route === 'reply') { viewReply(); }
    else if (route === 'saved') { viewSaved(); }
    else if (route === 'editor') { viewEditor(h.query); }
    else if (route === 'settings') { viewSettings(); }

    window.hydrateIcons(document);
    syncDrawer();
    refreshNavCounts();
    if (prevRoute !== route) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (route === 'library' && state.focusLibSearch) {
      var si = $('#libSearch');
      if (si) { si.focus(); var v = si.value; si.setSelectionRange(v.length, v.length); }
      state.focusLibSearch = false;
    }
  }

  function setNav(route) {
    var map = { dashboard: '/', library: '/library', reply: '/reply', saved: '/saved', editor: '/new', settings: '/settings' };
    $$('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === map[route]);
    });
    document.getElementById('app').classList.remove('nav-open');
  }

  function refreshNavCounts() {
    var nc = $('#navCount'); if (nc) nc.textContent = state.scenarios.length || '—';
    var ns = $('#navSaved'); if (ns) ns.textContent = state.saved.length + state.archives.length;
    var chip = $('#modeChip'), label = $('#modeLabel');
    if (chip && label) {
      chip.classList.toggle('is-server', state.mode === 'server');
      label.textContent = state.mode === 'server' ? '服务端模式 · 已持久化' : '本地模式 · 浏览器保存';
      chip.title = state.mode === 'server'
        ? '数据通过本地 Node 服务持久化到 server/data/db.json'
        : '静态部署：新增/编辑保存在本浏览器，可到设置里导出备份';
    }
  }

  /* ---------------- dashboard ---------------- */

  function viewDashboard() {
    var total = state.scenarios.length;
    var cats = new Set(state.scenarios.map(function (s) { return s.category; }));
    var recent = state.scenarios.slice().sort(function (a, b) {
      return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    }).slice(0, 5);
    var policies = state.policy.slice().sort(function (a, b) {
      return String(b.effective || '').localeCompare(String(a.effective || ''));
    }).slice(0, 6);

    var countryCards = ['AU', 'CA', 'US'].map(function (code) {
      var list = state.scenarios.filter(function (s) { return s.country === code; });
      var meta = COUNTRIES[code];
      var facts = {
        AU: 'ABF 查验 · DAFF 生物安全 · GST 10% · BMSB 季措施',
        CA: 'CBSA 查验 · CARM / RPP · GST + 省税 · 铁路拥堵',
        US: 'CBP 查验 · ISF 10+2 · 301 / IEEPA · de minimis 暂停'
      }[code];
      return '<a class="country-card ' + code + '" href="#/library" data-action="country-link" data-country="' + code + '">' +
        '<div class="country-card-top"><span class="flag-orb">' + code + '</span><span class="chip">' + esc(meta.lane) + '</span></div>' +
        '<h3>' + esc(meta.name) + '</h3>' +
        '<div class="lane-en">' + esc(meta.en) + ' · DDP LCL</div>' +
        '<p>' + esc(facts) + '</p>' +
        '<div class="country-card-foot"><span class="num">' + list.length + '<small>条话术</small></span>' +
        '<span class="go">进入 ' + window.icon('arrow-right') + '</span></div></a>';
    }).join('');

    var policyHTML = policies.length ? policies.map(function (p) {
      return '<div class="policy-card">' +
        '<div class="policy-top"><span class="country-chip ' + esc(p.country) + '">' + esc(p.country) + '</span><span class="tiny muted policy-date">' + esc(p.effective || '') + '</span></div>' +
        '<h4>' + esc(p.title_zh) + '</h4>' +
        '<p>' + esc(p.detail_zh) + '</p>' +
        '<div class="src"><span>' + esc(p.source_name || '官方') + '</span>' +
        (p.source_url ? '<a href="' + esc(p.source_url) + '" target="_blank" rel="noopener">原文 ↗</a>' : '') +
        '</div></div>';
    }).join('') : '<div class="notice info" style="grid-column:1/-1"><span class="ico" data-icon="info"></span><div>政策速览正在更新。研究员正在核对 2025–2026 三国最新清关要求，稍后自动出现在这里。</div></div>';

    var recentHTML = recent.length ? recent.map(function (s) {
      return '<div class="recent-item" data-action="open" data-id="' + esc(s.id) + '">' +
        '<span class="country-chip ' + esc(s.country) + '">' + esc(s.country) + '</span>' +
        '<div class="rt"><b>' + esc(s.title_zh) + '</b><span>' + esc(s.category + ' · ' + s.stage) + '</span></div>' +
        '<span class="when">' + esc(fmtDate(s.updated_at)) + '</span></div>';
    }).join('') : '<p class="hint">还没有话术数据。点「新增话术」开始，或等待内容团队导入。</p>';

    var quick = [
      ['reply', '截图改话', '客户截图 → 3 条英文回复'],
      ['new', '新增话术', '把新场景沉淀进库'],
      ['filter-tax', '税费争议', '关税 / GST / 301 口径'],
      ['filter-customs', '查验扣关', 'ABF / CBSA / CBP'],
      ['filter-delay', '时效延误', '船期 / 拥堵 / 派送'],
      ['saved', '我的回复', '收藏回复 & 截图归档'],
    ].map(function (q) {
      var href = '#/library';
      if (q[0] === 'reply') href = '#/reply';
      if (q[0] === 'new') href = '#/new';
      if (q[0] === 'saved') href = '#/saved';
      var attrs = 'href="' + href + '"';
      if (q[0].indexOf('filter-') === 0) attrs += ' data-action="quick-filter" data-cat="' + esc(q[1]) + '"';
      return '<a class="quick-item" ' + attrs + '>' +
        '<span class="qi" data-icon="' + (q[0] === 'reply' ? 'image' : q[0] === 'new' ? 'plus' : q[0] === 'saved' ? 'bookmark' : q[0] === 'filter-tax' ? 'file' : q[0] === 'filter-customs' ? 'shield' : 'clock') + '"></span>' +
        '<span><b>' + esc(q[1]) + '</b><span>' + esc(q[2]) + '</span></span></a>';
    }).join('');

    $('#view').innerHTML =
      '<section class="hero">' +
        '<div>' +
          '<div class="eyebrow">DDP AFTER-SALES · 2026 EDITION</div>' +
          '<h1>让每一句回复，<br>都撑得住客户的<span class="em">生意</span>。</h1>' +
          '<p class="hero-sub">中澳 · 中加 · 中美 DDP 散货专线的售后话术中枢。每条话术按「共情 → 事实 → 方案 → 同步 → 安抚」写成，带当地清关口径、可直接发 WhatsApp 的英文原文，还能把客户截图变成 3 条不同语气的回复。</p>' +
          '<div class="hero-actions"><a class="btn btn-accent" href="#/library">' + window.icon('book') + '进入话术库</a>' +
          '<a class="btn btn-ghost" href="#/reply">' + window.icon('sparkles') + '截图生成回复</a></div>' +
          '<div class="hero-stats">' +
            '<div class="hero-stat"><strong>' + total + '</strong><span>条场景话术</span></div>' +
            '<div class="hero-stat"><strong>3</strong><span>条专线</span></div>' +
            '<div class="hero-stat"><strong>' + (cats.size || 8) + '</strong><span>类高频问题</span></div>' +
            '<div class="hero-stat"><strong>5</strong><span>段式结构</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="route-stack">' +
          '<div class="route-card">' +
            '<div class="route-head"><span>DDP CONSOL · LIVE LANES</span><span class="live"><i></i>ACTIVE</span></div>' +
            '<div class="route-list">' +
              routeRow('CN', 'SYD · MEL', 'AU · 18–26 天') +
              routeRow('CN', 'VAN · TOR', 'CA · 22–32 天') +
              routeRow('CN', 'LAX · NYC', 'US · 16–24 天') +
            '</div>' +
            '<div class="route-foot"><span>海运拼箱 · 双清包税到门 · WhatsApp 售后</span><span class="chip">3 lanes</span></div>' +
          '</div>' +
          '<div class="bubble-float"><div class="bf-head"><i></i>WhatsApp · Customer</div>' +
            '<p>“Hi, our container has been held for 5 days — our shop opening is next Friday. What’s happening?”</p>' +
            '<div class="bf-time">' + window.icon('check') + window.icon('check') + '<span>now</span></div></div>' +
        '</div>' +
      '</section>' +
      '<div class="steps-strip">' +
        step('01', '共情', '先接住情绪与损失', 'EMPATHY') +
        step('02', '事实', '讲已核实的事实', 'FACTS') +
        step('03', '方案', '动作 + 责任人 + 时间', 'PLAN') +
        step('04', '同步', '主动给下一次更新', 'SYNC') +
        step('05', '安抚', '确定性 + 兜底路径', 'REASSURE') +
      '</div>' +
      '<div class="country-grid">' + countryCards + '</div>' +
      '<div class="dash-grid">' +
        '<section class="panel">' +
          '<div class="panel-head"><h3>政策速览 · 2025–2026</h3><a class="more" href="#/settings">数据说明 →</a></div>' +
          '<div class="policy-grid" style="margin-top:0">' + policyHTML + '</div>' +
        '</section>' +
        '<div style="display:flex;flex-direction:column;gap:24px">' +
          '<section class="panel"><div class="panel-head"><h3>快速入口</h3></div><div class="quick-grid">' + quick + '</div></section>' +
          '<section class="panel"><div class="panel-head"><h3>最近更新</h3><a class="more" href="#/library">全部 →</a></div><div class="recent-list">' + recentHTML + '</div></section>' +
        '</div>' +
      '</div>';
  }

  function routeRow(from, dest, sub) {
    return '<div class="route-row">' +
      '<span class="route-code">' + esc(from) + '</span>' +
      '<span class="route-line"><span class="node"></span><span class="track"></span>' +
        '<span class="vessel">' + window.icon('ship') + '</span><span class="node end"></span></span>' +
      '<span class="route-dest"><b>' + esc(dest) + '</b>' + esc(sub) + '</span></div>';
  }
  function step(n, title, desc, en) {
    return '<div class="step"><span class="step-n">' + n + '</span><div><b>' + esc(title) + '</b> <em>' + esc(en) + '</em></div><span>' + esc(desc) + '</span></div>';
  }

  /* ---------------- library ---------------- */

  function viewLibrary() {
    var list = filteredScenarios();
    var cards = list.map(cardHTML).join('');
    var catChips = CATEGORIES.map(function (c) {
      var n = state.scenarios.filter(function (s) { return s.category === c; }).length;
      return '<button class="chip-filter' + (state.filter.category === c ? ' on' : '') + '" data-action="set-category" data-cat="' + esc(c) + '">' + esc(c) + '<span class="n">' + n + '</span></button>';
    }).join('');
    var countrySeg = ['ALL', 'AU', 'CA', 'US'].map(function (c) {
      var label = c === 'ALL' ? '全部' : c;
      return '<button data-action="set-country" data-country="' + c + '" class="' + (state.filter.country === c ? 'on' : '') + '">' + label + '</button>';
    }).join('');
    var stageOpts = ['ALL'].concat(STAGES).map(function (v) {
      return '<option value="' + v + '"' + (state.filter.stage === v ? ' selected' : '') + '>' + (v === 'ALL' ? '全部阶段' : v) + '</option>';
    }).join('');
    var sortOpts = [['default', '推荐排序'], ['recent', '最近更新'], ['severity', '高严重度优先']].map(function (o) {
      return '<option value="' + o[0] + '"' + (state.filter.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    $('#view').innerHTML =
      '<div class="page-head"><div>' +
        '<div class="section-kicker">SCRIPT LIBRARY</div>' +
        '<h1>售后话术库</h1>' +
        '<p class="sub">按国家、问题类型、阶段筛选。每条都包含五段式内部口径、三条阶段话术与两条同题替代表达；点开即可复制英文原文，变量留空时保留 <span class="code">{{token}}</span> 提醒你替换。</p>' +
      '</div><div class="head-actions">' +
        '<a class="btn btn-ghost" href="#/new">' + window.icon('plus') + '新增话术</a>' +
        '<a class="btn btn-accent" href="#/reply">' + window.icon('sparkles') + '截图生成回复</a>' +
      '</div></div>' +
      '<div class="toolbar">' +
        '<div class="toolbar-row">' +
          '<label class="toolbar-search">' + window.icon('search') +
            '<input id="libSearch" type="search" placeholder="搜索标题、关键词、客户原话…" value="' + esc(state.filter.query) + '" autocomplete="off" />' +
          '</label>' +
          '<div class="seg" id="countrySeg">' + countrySeg + '</div>' +
          '<select class="select" id="stageSel" style="width:120px">' + stageOpts + '</select>' +
          '<select class="select" id="sortSel" style="width:132px">' + sortOpts + '</select>' +
          '<div class="toolbar-meta">共 <b class="result-count" id="libCount">' + list.length + '</b> 条</div>' +
        '</div>' +
        '<div class="toolbar-row chip-row" id="catRow">' + catChips + '</div>' +
      '</div>' +
      '<div class="lib-grid" id="libGrid">' + (cards || emptyLibrary()) + '</div>';

    var search = $('#libSearch');
    if (search) {
      var timer = null;
      search.addEventListener('input', function () {
        state.filter.query = search.value;
        clearTimeout(timer);
        timer = setTimeout(refreshLibraryGrid, 120);
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { state.filter.query = search.value; refreshLibraryGrid(); }
      });
    }
    var stageSel = $('#stageSel');
    if (stageSel) stageSel.addEventListener('change', function () { state.filter.stage = stageSel.value; viewLibrary(); window.hydrateIcons($('#view')); });
    var sortSel = $('#sortSel');
    if (sortSel) sortSel.addEventListener('change', function () { state.filter.sort = sortSel.value; viewLibrary(); window.hydrateIcons($('#view')); });
  }

  function cardHTML(s, i) {
    var sev = s.severity || 'medium';
    return '<article class="sc-card" style="--i:' + (i || 0) + '" role="button" tabindex="0" data-action="open" data-id="' + esc(s.id) + '">' +
      '<div class="sc-top"><div class="sc-tags">' +
        '<span class="country-chip ' + esc(s.country) + '">' + esc(s.country) + '</span>' +
        '<span class="chip">' + esc(s.category) + '</span>' +
      '</div><span class="sev sev-' + esc(sev) + '"><i class="dot"></i>' + esc(SEV[sev] || '中') + '</span></div>' +
      '<h3>' + esc(s.title_zh) + '</h3>' +
      '<div class="sc-en">' + esc(s.title_en) + '</div>' +
      '<p class="sc-summary">' + esc(s.summary_zh) + '</p>' +
      '<div class="sc-foot"><div class="meta"><span>' + esc(s.stage) + '</span><span>·</span><span>' + scriptCount(s) + ' 条话术</span></div>' +
      '<span class="sc-copy">查看 ' + window.icon('arrow-right') + '</span></div></article>';
  }

  function emptyLibrary() {
    return '<div class="empty" style="grid-column:1/-1"><span class="ico" data-icon="search"></span>' +
      '<b>没有匹配的话术</b><p>换个关键词，或把筛选条件放宽。也可以直接新增一条这个场景的话术。</p>' +
      '<button class="btn btn-soft btn-sm" data-action="reset-filters">重置筛选</button></div>';
  }

  function refreshLibraryGrid() {
    var list = filteredScenarios();
    var grid = $('#libGrid');
    if (!grid) return;
    grid.innerHTML = list.map(cardHTML).join('') || emptyLibrary();
    var c = $('#libCount'); if (c) c.textContent = list.length;
    window.hydrateIcons(grid);
  }

  /* ---------------- drawer ---------------- */

  function syncDrawer() {
    var root = $('#drawerRoot');
    if (!state.detailId) {
      root.innerHTML = '';
      root.removeAttribute('data-for');
      return;
    }
    var s = byId(state.detailId);
    if (!s) {
      root.innerHTML = '';
      root.removeAttribute('data-for');
      return;
    }
    if (root.getAttribute('data-for') === state.detailId) return;
    state.detailTab = 0;
    state.detailVars = {};
    root.setAttribute('data-for', state.detailId);
    root.innerHTML = drawerHTML(s);
    window.hydrateIcons(root);
  }

  function drawerHTML(s) {
    var list = scriptsOf(s);
    var tabs = list.map(function (sc, i) {
      var label = sc.phase === 'first' ? '首响' : sc.phase === 'followup' ? '跟进' : sc.phase === 'close' ? '收口' : '替代';
      return '<button class="script-tab' + (i === 0 ? ' on' : '') + '" data-action="detail-tab" data-i="' + i + '">' +
        esc(label) + ' <span class="tone">' + esc(sc.tone || '') + '</span></button>';
    }).join('');

    return '<div class="drawer-overlay" data-action="close-drawer"></div>' +
      '<aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(s.title_zh) + '">' +
        '<header class="drawer-head">' +
          '<div class="dh-top"><div class="row row-wrap">' +
            '<span class="country-chip ' + esc(s.country) + '">' + esc(s.country) + '</span>' +
            '<span class="chip">' + esc(COUNTRIES[s.country] ? COUNTRIES[s.country].lane : s.lane) + '</span>' +
            '<span class="chip">' + esc(s.category) + '</span>' +
            '<span class="sev sev-' + esc(s.severity) + '"><i class="dot"></i>' + esc(SEV[s.severity] || '中') + '</span>' +
          '</div>' +
          '<button class="icon-btn dh-close" data-action="close-drawer" aria-label="关闭">' + window.icon('close') + '</button></div>' +
          '<h2>' + esc(s.title_zh) + '</h2>' +
          '<div class="dh-en">' + esc(s.title_en) + '</div>' +
          '<p class="dh-summary">' + esc(s.summary_zh) + '</p>' +
          '<div class="d-meta">' +
            '<div>阶段<b>' + esc(s.stage) + '</b></div>' +
            '<div>严重度<b>' + esc(SEV[s.severity] || '中') + '</b></div>' +
            '<div>话术<b>' + list.length + ' 条</b></div>' +
            '<div>更新<b>' + esc(fmtDate(s.updated_at)) + '</b></div>' +
            '<div>编号<b>' + esc(s.id) + '</b></div>' +
          '</div>' +
        '</header>' +
        '<div class="drawer-body">' +
          '<section class="d-section"><div class="d-section-title">五段式 · 内部口径</div>' + fiveHTML(s) + '</section>' +
          '<section class="d-section"><div class="d-section-title">英文话术 · 可直接发送</div>' +
            '<div class="script-tabs" id="scriptTabs">' + tabs + '</div>' +
            '<div id="scriptPanel">' + scriptPanelHTML(s) + '</div>' +
          '</section>' +
          '<section class="d-section"><div class="d-section-title">处理口径 · 内部</div>' + internalHTML(s) + '</section>' +
          '<section class="d-section"><div class="d-section-title">官方依据</div>' + authorityHTML(s) + '</section>' +
          '<section class="d-section" style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn-soft btn-sm" data-action="edit-scenario">' + window.icon('edit') + '编辑这条话术</button>' +
            '<button class="btn btn-danger btn-sm" data-action="delete-scenario">' + window.icon('trash') + '删除</button>' +
            '<span class="hint" style="align-self:center">删除仅影响本库；官方依据与合规口径请由主管复核。</span>' +
          '</section>' +
        '</div>' +
      '</aside>';
  }

  function fiveHTML(s) {
    var fw = s.framework || {};
    var rows = [
      ['empathy', '共情', 'EMPATHY', 'smile', fw.empathy],
      ['facts', '事实', 'FACTS', 'file', fw.facts],
      ['plan', '方案', 'PLAN', 'wrench', fw.plan],
      ['sync', '同步', 'SYNC', 'clock', fw.sync],
      ['reassure', '安抚', 'REASSURE', 'shield', fw.reassure]
    ];
    return '<div class="five">' + rows.map(function (r) {
      var items = (r[4] || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      return '<div class="five-item ' + r[0] + '"><div class="five-label"><b>' + window.icon(r[3]) + r[1] + '</b><span>' + r[2] + '</span></div><ul>' + (items || '<li class="muted">待补充</li>') + '</ul></div>';
    }).join('') + '</div>';
  }

  function scriptPanelHTML(s) {
    var list = scriptsOf(s);
    var sc = list[state.detailTab] || list[0];
    if (!sc) return '<p class="hint">这条话术还没有英文内容。</p>';
    var tokens = DDCEngine.missingTokens(sc.text || '');
    var ph = tokens.length ? '<div class="placeholders"><div class="tiny muted">发送前替换变量（留空则保留 <span class="code">{{token}}</span>）</div><div class="placeholder-grid">' +
      tokens.map(function (t) {
        var val = state.detailVars[t] || '';
        return '<div class="field"><label>{{' + esc(t) + '}}</label><input class="input" data-var="' + esc(t) + '" value="' + esc(val) + '" placeholder="' + esc(tokenHint(t)) + '" /></div>';
      }).join('') + '</div></div>' : '';
    return '<div class="script-panel">' +
      (sc.use_when ? '<div class="script-use">' + window.icon('info') + '<span>' + esc(sc.use_when) + '</span></div>' : '') +
      '<div class="wa-bubble">' + highlight(sc.text || '') + '<div class="wa-meta">' + window.icon('check') + window.icon('check') + '<span>now</span></div></div>' +
      ph +
      '<div class="script-actions">' +
        '<button class="btn btn-accent btn-sm" data-action="copy-detail">' + window.icon('copy') + '复制英文话术</button>' +
        '<button class="btn btn-soft btn-sm" data-action="copy-detail-plain">' + window.icon('file') + '复制（保留变量）</button>' +
        '<span class="hint" style="align-self:center">' + esc(sc.label_zh || '') + ' · ' + countWords(sc.text) + ' words</span>' +
      '</div></div>';
  }

  function tokenHint(t) {
    var map = {
      customer_name: '客户名字', container_no: '柜号', bill_no: '提单号', port: '港口', eta_date: 'ETA',
      delivery_date: '派送日期', next_update_time: '下次更新时间', amount: '金额', agent_name: '你的名字',
      company_name: '公司名', order_no: '订单号'
    };
    return map[t] || '';
  }

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function archiveTitle(result) {
    var meta = COUNTRIES[result.country] || COUNTRIES.AU;
    var base = meta.short + ' · ' + (result.scenario ? result.scenario.title_zh : '通用售后咨询');
    var ctx = (result.analysis && result.analysis.context) || {};
    if (ctx.container_no) base += ' · ' + ctx.container_no;
    else if (ctx.deadline) base += ' · ' + ctx.deadline;
    else if (ctx.port) base += ' · ' + ctx.port.split(',')[0];
    return base;
  }

  function makeThumb(dataUrl) {
    return new Promise(function (resolve) {
      if (!dataUrl) return resolve('');
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, 420 / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        } catch (e) { resolve(''); }
      };
      img.onerror = function () { resolve(''); };
      img.src = dataUrl;
    });
  }

  async function autoArchive(result) {
    var text = state.reply.text.trim();
    var now = Date.now();
    var existing = state.archives.filter(function (a) {
      return a.customerText === text && a.country === result.country &&
        now - new Date(a.createdAt).getTime() < 10 * 60 * 1000;
    })[0];
    var thumb = await makeThumb(state.reply.dataUrl);
    var rec = {
      id: existing ? existing.id : DDCStore.uid('arc'),
      title: existing && existing.title ? existing.title : archiveTitle(result),
      country: result.country,
      customerText: text,
      matchedScenarioId: result.scenario ? result.scenario.id : '',
      matchedTitle: result.scenario ? result.scenario.title_zh : '通用售后咨询',
      replies: result.replies.map(function (r) {
        return { tone: r.tone, label: r.label, text: r.text, source: r.source };
      }),
      vars: Object.assign({}, state.reply.vars),
      thumbnail: thumb || (existing ? existing.thumbnail : ''),
      source: state.reply.fromOcr ? 'ocr' : 'text',
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };
    try {
      await DDCStore.saveArchive(rec);
      state.archives = await DDCStore.getArchives();
      state.reply.archiveId = rec.id;
      refreshNavCounts();
      toast('已自动归档：' + truncate(rec.title, 28), false);
    } catch (e) {
      console.warn('archive failed', e);
      toast('自动归档失败：' + (e.message || '请检查服务端管理口令'), true);
    }
  }

  function internalHTML(s) {
    var it = s.internal || {};
    return '<div class="d-grid">' +
      '<div class="info-card"><h4>常见成因</h4><ul>' + ((it.common_causes || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') || '<li class="muted">—</li>') + '</ul></div>' +
      '<div class="info-card"><h4>处理路径</h4><ol>' + ((it.resolution_path || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') || '<li class="muted">—</li>') + '</ol></div>' +
      '<div class="info-card"><h4>SLA 与费用口径</h4><ul>' +
        '<li><b>SLA：</b>' + esc(it.sla_hint || '—') + '</li>' +
        '<li><b>费用：</b>' + esc(it.fee_policy || '—') + '</li></ul></div>' +
      '<div class="guardrail"><h4>' + window.icon('alert') + '红线 · 不要这样说</h4><ul>' +
        ((it.guardrails || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') || '<li class="muted">—</li>') + '</ul></div>' +
      '</div>';
  }

  function authorityHTML(s) {
    var list = s.authorities || [];
    if (!list.length) return '<p class="hint">暂无官方链接，请在编辑页补充。</p>';
    return '<div class="auth-list">' + list.map(function (a) {
      return '<a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + window.icon('external') + esc(a.name || a.url) + '</a>';
    }).join('') + '</div>';
  }

  function updateDetailPanel() {
    var s = byId(state.detailId);
    if (!s) return;
    $$('.script-tab').forEach(function (b) {
      b.classList.toggle('on', Number(b.dataset.i) === state.detailTab);
    });
    var p = $('#scriptPanel');
    if (p) { p.innerHTML = scriptPanelHTML(s); window.hydrateIcons(p); }
  }

  /* ---------------- reply desk ---------------- */

  function viewReply() {
    var r = state.reply;
    var meta = COUNTRIES[r.country] || COUNTRIES.AU;
    var result = r.result;

    var imageArea = '';
    if (r.dataUrl) {
      imageArea = '<div class="dz-preview"><img src="' + r.dataUrl + '" alt="客户截图预览" />' +
        '<div class="dz-file">' + window.icon('image') + '<span>' + esc(r.file ? r.file.name : 'screenshot') + '</span></div>' +
        '<div class="dz-actions"><button class="btn btn-soft btn-xs" data-action="pick-file">换一张</button>' +
        '<button class="btn btn-soft btn-xs" data-action="rerun-ocr">重新识别</button>' +
        '<button class="btn btn-soft btn-xs" data-action="clear-image">移除</button></div></div>';
    } else {
      imageArea = '<div class="dropzone" id="dropzone" data-action="pick-file">' +
        '<span class="dz-icon" data-icon="upload-cloud"></span>' +
        '<b>粘贴客户截图</b>' +
        '<p>WhatsApp 聊天截图、邮件截图都可以。支持中英文混排，识别后可手动修正。</p>' +
        '<div class="kbdline"><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>V</kbd> 直接粘贴</div>' +
        '</div>';
    }

    var progress = r.busy ? '<div class="progress"><div class="progress-bar"><i style="width:' + Math.round(r.progress * 100) + '%"></i></div>' +
      '<div class="progress-text"><span>' + esc(r.status || '识别中…') + '</span><span class="mono-num">' + Math.round(r.progress * 100) + '%</span></div></div>' : '';

    var resultsHTML;
    if (!result) {
      resultsHTML = '<div class="empty" style="background:transparent;border-style:dashed;margin-top:0">' +
        '<span class="ico" data-icon="sparkles"></span>' +
        '<b>三条英文回复，会出现在这里</b>' +
        '<p>先粘贴截图或直接粘贴客户原话，点「生成英文回复」。系统会识别问题类型，匹配对应国家的话术库，并按三种语气给出可直接发送的版本。</p>' +
        '<div class="row" style="justify-content:center;gap:6px;flex-wrap:wrap">' +
        '<span class="chip">共情版</span><span class="chip">标准版</span><span class="chip">简洁版</span></div></div>';
    } else {
      resultsHTML = renderResults(result);
    }

    $('#view').innerHTML =
      '<div class="page-head"><div><div class="section-kicker">SCREENSHOT → REPLY</div>' +
        '<h1>截图改话</h1>' +
        '<p class="sub">客户发来一张截图，不用手打。识别原话 → 判断问题 → 给出 3 条英文表达（共情 / 标准 / 简洁），变量填一次，全部复制即用。</p>' +
      '</div><div class="head-actions"><a class="btn btn-ghost" href="#/library">' + window.icon('book') + '翻话术库</a></div></div>' +
      '<div class="reply-layout">' +
        '<div class="desk-panel sticky">' +
          '<div class="desk-head"><h2><span class="step-num">01</span>客户消息</h2>' +
            '<div class="mode-tabs"><button class="' + (r.tab === 'image' ? 'on' : '') + '" data-action="reply-tab" data-tab="image">截图</button>' +
            '<button class="' + (r.tab === 'text' ? 'on' : '') + '" data-action="reply-tab" data-tab="text">文字</button></div></div>' +
          '<div class="desk-body">' +
            (r.tab === 'image' ? imageArea + progress : '') +
            '<div class="ocr-text">' +
              '<div class="field"><label>客户原话（可编辑）</label>' +
                '<textarea class="textarea" id="replyText" placeholder="粘贴客户原话，或先用截图识别…">' + esc(r.text) + '</textarea></div>' +
              '<div class="row" style="justify-content:space-between;margin-top:6px">' +
                '<span class="hint" id="textMeta">' + (r.text ? r.text.length + ' 字符 · ' + (DDCEngine.detectLang(r.text) === 'zh' ? '中文' : '英文') : '等待识别或输入') + '</span>' +
                '<button class="btn btn-soft btn-xs" data-action="clear-text">清空</button>' +
              '</div>' +
            '</div>' +
            '<div class="reply-options">' +
              '<div class="field"><label>目的国家 / 专线</label><select class="select" id="replyCountry">' +
                ['AU', 'CA', 'US'].map(function (c) {
                  return '<option value="' + c + '"' + (r.country === c ? ' selected' : '') + '>' + COUNTRIES[c].lane + ' · ' + COUNTRIES[c].name + '</option>';
                }).join('') + '</select></div>' +
              '<div class="field"><label>回复语言</label><input class="input" value="English · WhatsApp" disabled /></div>' +
            '</div>' +
            '<button class="btn btn-accent btn-block mt-12" data-action="generate" ' + (r.text.trim() ? '' : 'disabled') + '>' + window.icon('sparkles') + '生成 3 条英文回复</button>' +
            '<div class="sample-row"><span class="tiny muted" style="align-self:center">试试示例：</span>' +
              '<button class="sample-btn" data-action="sample" data-country="AU">澳洲查验</button>' +
              '<button class="sample-btn" data-action="sample" data-country="CA">加拿大 CARM</button>' +
              '<button class="sample-btn" data-action="sample" data-country="US">美国 ISF</button></div>' +
            '<div class="ai-strip ' + (state.ai ? '' : 'off') + '">' + window.icon(state.ai ? 'sparkles' : 'info') +
              '<span>' + (state.ai ? 'AI 增强已就绪：可用服务端模型生成更贴合的版本。' : (state.mode === 'server' ? '服务端已就绪：到「设置」填写 API Key 后，可启用 AI 润色。' : '本地模式：使用内置话术引擎。部署 Node 服务并配置 API Key 后，可启用 AI 润色。')) + '</span></div>' +
            '<div class="ai-strip" style="margin-top:8px;background:rgba(228,87,46,.05);border-color:rgba(228,87,46,.18);color:var(--accent-deep)">' + window.icon('bookmark') +
              '<span>每次生成自动归档到「截图话术库」：标题、客户原话、命中场景、3 条回复与截图缩略图，全部留档，不用手动保存。</span></div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="results-head"><div><div class="section-kicker">ENGLISH REPLIES</div><h2 style="font-size:20px;letter-spacing:-.02em">英文回复</h2></div>' +
            (result ? '<div class="row"><span class="chip">' + esc(COUNTRIES[result.country] ? COUNTRIES[result.country].lane : '') + '</span>' +
              '<button class="btn btn-soft btn-sm" data-action="generate">' + window.icon('refresh') + '换一批</button>' +
              (state.ai ? '<button class="btn btn-dark btn-sm" data-action="ai-reply">' + window.icon('sparkles') + 'AI 润色</button>' : '') + '</div>' : '') +
          '</div>' +
          resultsHTML +
        '</div>' +
      '</div>';

    var ta = $('#replyText');
    if (ta) {
      ta.addEventListener('input', function () {
        state.reply.text = ta.value;
        state.reply.archiveId = null;
        state.reply.vars = {};
        var m = $('#textMeta');
        if (m) m.textContent = ta.value ? ta.value.length + ' 字符 · ' + (DDCEngine.detectLang(ta.value) === 'zh' ? '中文' : '英文') : '等待识别或输入';
        var gb = $('[data-action="generate"]');
        if (gb) gb.disabled = !ta.value.trim();
      });
    }
    var sel = $('#replyCountry');
    if (sel) sel.addEventListener('change', function () { state.reply.country = sel.value; state.reply.countryTouched = true; });

    var dz = $('#dropzone');
    if (dz) {
      ['dragenter', 'dragover'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); });
      });
      ['dragleave', 'drop'].forEach(function (ev) {
        dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); });
      });
      dz.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && /^image\//.test(f.type)) handleImage(f);
        else toast('请拖入图片文件', true);
      });
    }
    var fi = $('#ocrFile');
    if (fi) fi.addEventListener('change', function () {
      if (fi.files && fi.files[0]) handleImage(fi.files[0]);
      fi.value = '';
    });
    if (r.tab === 'image') window.hydrateIcons($('#view'));
  }

  function previewText(text) {
    return highlight(DDCEngine.applyVars(DDCEngine.fillDefaults(text, { settings: state.settings }), state.reply.vars));
  }

  function renderResults(result) {
    var vars = result.replies.reduce(function (acc, rp) {
      DDCEngine.missingTokens(DDCEngine.fillDefaults(rp.text, { settings: state.settings })).forEach(function (t) {
        if (t !== 'agent_name' && t !== 'company_name' && acc.indexOf(t) === -1) acc.push(t);
      });
      return acc;
    }, []);
    var varsHTML = vars.length ? '<div class="placeholders" style="border-top:0;padding-top:0;margin-bottom:14px"><div class="tiny muted">变量已按截图智能回填，可修改后复制（只影响复制结果，不改原文）</div>' +
      '<div class="placeholder-grid">' + vars.map(function (t) {
        return '<div class="field"><label>{{' + esc(t) + '}}</label><input class="input" data-reply-var="' + esc(t) + '" value="' + esc(state.reply.vars[t] || '') + '" placeholder="' + esc(tokenHint(t)) + '" /></div>';
      }).join('') + '</div></div>' : '';

    var ctx = (result.analysis && result.analysis.context) || {};
    var ctxBits = [];
    if (ctx.container_no) ctxBits.push('柜号 ' + ctx.container_no);
    if (ctx.bill_no) ctxBits.push('提单 ' + ctx.bill_no);
    if (ctx.order_no) ctxBits.push('单号 ' + ctx.order_no);
    if (ctx.port) ctxBits.push('港口 ' + ctx.port);
    if (ctx.deadline) ctxBits.push('客户时间点 ' + ctx.deadline);
    if (ctx.amount) ctxBits.push('金额 ' + ctx.amount);

    var archive = state.reply.archiveId ? state.archives.filter(function (a) { return a.id === state.reply.archiveId; })[0] : null;
    var archiveBanner = archive ? '<div class="ai-strip" style="margin-top:0;margin-bottom:14px"><span class="ico" data-icon="check-circle"></span>' +
      '<span>已自动归档到「截图话术库」：<b>' + esc(archive.title) + '</b> · <a class="link" href="#/saved?tab=archives">查看归档 →</a></span></div>' : '';

    var replyCards = result.replies.map(function (rp, i) {
      var tone = (rp.tone || 'standard').toLowerCase();
      return '<article class="reply-card" style="--i:' + i + '">' +
        '<div class="reply-card-head"><div class="rt"><span class="tone-tag tone-' + esc(tone) + '">' + esc(TONE[tone] || tone) + '</span>' +
          '<b style="font-size:12.5px">' + esc(rp.label || '') + '</b></div>' +
          '<span class="tiny muted">' + countWords(rp.text) + ' words</span></div>' +
        '<div class="wa-bubble">' + previewText(rp.text) +
          '<div class="wa-meta">' + window.icon('check') + window.icon('check') + '<span>now</span></div></div>' +
        (rp.use_when ? '<div class="reply-note">' + esc(rp.use_when) + '</div>' : '') +
        '<div class="reply-card-actions">' +
          '<button class="btn btn-accent btn-sm" data-action="copy-reply" data-i="' + i + '">' + window.icon('copy') + '复制这条</button>' +
          '<button class="btn btn-soft btn-sm" data-action="save-reply" data-i="' + i + '">' + window.icon('bookmark') + '保存' +
          '</button>' +
          '<span class="hint" style="align-self:center">' + (rp.source === 'generic' ? '通用话术' : '来自「' + esc(result.scenario ? result.scenario.title_zh : '') + '」') + '</span>' +
        '</div></article>';
    }).join('');

    var riskHTML = (result.risks || []).length ? '<div class="notice danger" style="margin-top:14px">' + window.icon('alert') +
      '<div><b>发送前注意</b><br>' + result.risks.map(function (x) { return '· ' + esc(x.label); }).join('<br>') + '</div></div>' : '';

    var intent = result.scenario ? result.scenario.title_zh + ' · ' + result.scenario.category : '未命中具体场景 · 使用通用话术';
    var conf = Math.round(((result.analysis && result.analysis.confidence) || 0) * 100);

    return archiveBanner +
      '<div class="intent-card"><div class="ic" data-icon="' + (result.scenario ? 'shield' : 'info') + '"></div>' +
      '<div><b>' + esc(intent) + '</b><span>' + esc(COUNTRIES[result.country] ? COUNTRIES[result.country].lane : '') + ' · ' +
      (ctxBits.length ? ctxBits.join(' / ') : '未识别到单号，建议先向客户索取') + '</span></div>' +
      '<div class="confidence"><b class="mono-num">' + (conf || '—') + (conf ? '%' : '') + '</b><span>match</span></div></div>' +
      (result.bridge ? '<div class="ai-strip" style="margin-top:10px;background:rgba(31,111,92,.06);border-color:rgba(31,111,92,.18);color:var(--green)">' +
        window.icon('layers') + '<span>识别到第 2 个问题：<b>' + esc(result.bridge.label) + '</b>，已合并进 3 条回复正文，客户不用再追问一次。</span></div>' : '') +
      varsHTML + replyCards +
      '<div class="checklist"><h3>' + window.icon('check-circle') + '发送前检查清单</h3><ul>' +
        (result.checklist || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' + riskHTML;
  }

  async function handleImage(file) {
    if (!/^image\//.test(file.type)) { toast('请选择图片文件', true); return; }
    state.reply.file = file;
    state.reply.tab = 'image';
    state.reply.vars = {};
    state.reply.archiveId = null;
    state.reply.countryTouched = false;
    var reader = new FileReader();
    reader.onload = function () { state.reply.dataUrl = reader.result; viewReply(); window.hydrateIcons($('#view')); runOcr(file); };
    reader.readAsDataURL(file);
  }

  async function runOcr(file) {
    state.reply.busy = true;
    state.reply.progress = 0.04;
    state.reply.status = '准备识别…';
    state.reply.result = null;
    viewReply();
    window.hydrateIcons($('#view'));
    try {
      var text = await window.DDCOcr.recognize(file, function (m) {
        var p = 0.05, s = '识别中…';
        if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') { p = 0.08; s = '加载识别引擎…'; }
        else if (m.status === 'loading language traineddata' || m.status === 'initializing api') { p = 0.18; s = '加载中英文语言包…'; }
        else if (m.status === 'recognizing text') { p = 0.2 + (m.progress || 0) * 0.78; s = '正在识别文字…'; }
        state.reply.progress = Math.max(state.reply.progress, p);
        state.reply.status = s;
        var bar = $('.progress-bar i'); if (bar) bar.style.width = Math.round(state.reply.progress * 100) + '%';
        var pt = $('.progress-text'); if (pt) {
          pt.children[0].textContent = s;
          pt.children[1].textContent = Math.round(state.reply.progress * 100) + '%';
        }
      });
      state.reply.busy = false;
      state.reply.progress = 1;
      state.reply.text = text || '';
      state.reply.vars = {};
      state.reply.fromOcr = true;
      if (!text) { toast('没识别到文字，试试更清晰的截图，或直接粘贴文字', true); }
      else { state.reply.tab = 'text'; toast('识别完成，已填入客户原话'); }
      viewReply();
      window.hydrateIcons($('#view'));
    } catch (e) {
      state.reply.busy = false;
      state.reply.status = '';
      viewReply();
      window.hydrateIcons($('#view'));
      toast(e.message || '识别失败，请直接粘贴文字', true);
    }
  }

  async function doGenerate() {
    var text = state.reply.text.trim();
    if (!text) { toast('先粘贴客户原话或识别截图', true); return; }
    if (!state.reply.countryTouched) {
      var suggested = DDCEngine.suggestCountry(text);
      if (suggested) state.reply.country = suggested;
    }
    var result = DDCEngine.generate(text, {
      scenarios: state.scenarios,
      country: state.reply.country,
      settings: state.settings
    });
    Object.keys(result.vars || {}).forEach(function (k) {
      if (!state.reply.vars[k]) state.reply.vars[k] = result.vars[k];
    });
    state.reply.result = result;
    state.reply.archiveId = null;
    await autoArchive(result);
    viewReply();
    window.hydrateIcons($('#view'));
    if (!result.scenario) toast('没有命中具体场景，已使用通用话术，可到话术库手动挑选');
    var panel = $('.results-head');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function currentReplyText(i) {
    var r = state.reply.result;
    if (!r || !r.replies[i]) return '';
    var text = DDCEngine.fillDefaults(r.replies[i].text, { settings: state.settings });
    return DDCEngine.applyVars(text, state.reply.vars);
  }

  function copyReply(i) {
    var text = currentReplyText(i);
    if (!text) return;
    var missing = DDCEngine.missingTokens(text);
    copyText(text).then(function (ok) {
      if (!ok) { toast('复制失败，请手动选择文字', true); return; }
      toast(missing.length ? '已复制；还有 ' + missing.length + ' 个变量未填：' + missing.join('、') : '已复制，可直接粘贴到 WhatsApp');
    });
  }

  async function aiReply() {
    if (!state.ai) { toast('AI 增强需要部署服务端并配置 API Key', true); return; }
    var r = state.reply.result;
    if (!r) return;
    var btn = $('[data-action="ai-reply"]');
    if (btn) { btn.disabled = true; btn.innerHTML = window.icon('refresh') + '生成中…'; }
    try {
      var headers = { 'Content-Type': 'application/json' };
      if (state.settings.aiBase) headers['x-ai-base'] = state.settings.aiBase;
      if (state.settings.aiKey) headers['x-ai-key'] = state.settings.aiKey;
      if (state.settings.aiModel) headers['x-ai-model'] = state.settings.aiModel;
      if (state.settings.adminToken) headers['x-admin-token'] = state.settings.adminToken;
      var res = await fetch('api/ai/reply', {
        method: 'POST', headers: headers,
        body: JSON.stringify({
          text: state.reply.text,
          country: r.country,
          scenarioTitle: r.scenario ? r.scenario.title_zh : '',
          framework: r.scenario ? r.scenario.framework : null,
          guardrails: r.scenario && r.scenario.internal ? r.scenario.internal.guardrails : []
        })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI 生成失败');
      if (!data.replies || !data.replies.length) throw new Error('AI 没有返回内容');
      r.replies = data.replies.slice(0, 3).map(function (x, i) {
        return { tone: x.tone || ['warm', 'standard', 'concise'][i] || 'standard', label: x.label || 'AI 版本', text: x.text, source: 'ai', use_when: 'AI 结合场景口径生成，发送前请核对事实与费用' };
      });
      await autoArchive(r);
      toast('AI 版本已生成，并已更新截图归档');
      viewReply();
      window.hydrateIcons($('#view'));
    } catch (e) {
      toast(e.message || 'AI 生成失败', true);
      if (btn) { btn.disabled = false; btn.innerHTML = window.icon('sparkles') + 'AI 润色'; }
    }
  }

  /* ---------------- saved ---------------- */

  function timeLabel(iso) {
    var d = new Date(iso || Date.now());
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function archivesFiltered() {
    var q = state.arcQuery.trim().toLowerCase();
    if (!q) return state.archives;
    return state.archives.filter(function (a) {
      return [a.title, a.customerText, a.matchedTitle, a.country].join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function archiveCardHTML(a) {
    return '<article class="saved-card arc-card">' +
      '<div class="sc-head"><div class="row" style="flex-wrap:wrap;gap:5px">' +
        '<span class="country-chip ' + esc(a.country || 'AU') + '">' + esc(a.country || 'AU') + '</span>' +
        '<span class="chip chip-green">自动归档</span>' +
        '<span class="chip">' + esc(a.matchedTitle || '通用售后') + '</span>' +
      '</div><span class="tiny muted">' + esc(timeLabel(a.createdAt)) + '</span></div>' +
      '<div class="arc-main">' +
        (a.thumbnail ? '<img class="arc-thumb" src="' + esc(a.thumbnail) + '" alt="客户截图缩略图" />' : '<div class="arc-thumb arc-thumb--empty">' + window.icon('image') + '</div>') +
        '<div class="arc-body"><h3 class="arc-title">' + esc(a.title) + '</h3>' +
          '<p class="arc-quote">“' + esc(truncate(a.customerText, 150)) + '”</p></div>' +
      '</div>' +
      '<div class="row row-wrap" style="gap:6px">' +
        '<span class="chip">' + (a.replies || []).length + ' 条英文回复</span>' +
        '<span class="chip">' + (a.source === 'ocr' ? '截图识别' : '文字输入') + '</span>' +
        (a.vars && a.vars.container_no ? '<span class="chip">' + esc(a.vars.container_no) + '</span>' : '') +
      '</div>' +
      '<div class="sc-actions">' +
        '<button class="btn btn-accent btn-xs" data-action="view-archive" data-id="' + esc(a.id) + '">' + window.icon('eye') + '查看 / 复制</button>' +
        '<button class="btn btn-soft btn-xs" data-action="copy-archive-first" data-id="' + esc(a.id) + '">' + window.icon('copy') + '复制首条</button>' +
        '<button class="btn btn-danger btn-xs" data-action="delete-archive" data-id="' + esc(a.id) + '">' + window.icon('trash') + '删除</button>' +
      '</div></article>';
  }

  function savedRepliesHTML() {
    var list = state.saved;
    var cards = list.length ? list.map(function (r) {
      return '<article class="saved-card">' +
        '<div class="sc-head"><div class="row"><span class="country-chip ' + esc(r.country || 'AU') + '">' + esc(r.country || 'AU') + '</span>' +
        '<span class="chip">' + esc(r.label || '英文回复') + '</span></div><span class="tiny muted">' + esc(timeLabel(r.createdAt)) + '</span></div>' +
        '<div class="sc-text">' + esc(r.text) + '</div>' +
        '<div class="sc-actions"><button class="btn btn-soft btn-xs" data-action="copy-saved" data-id="' + esc(r.id) + '">' + window.icon('copy') + '复制</button>' +
        '<button class="btn btn-soft btn-xs" data-action="view-saved" data-id="' + esc(r.id) + '">' + window.icon('eye') + '全文</button>' +
        '<button class="btn btn-danger btn-xs" data-action="delete-saved" data-id="' + esc(r.id) + '">' + window.icon('trash') + '删除</button></div>' +
        '</article>';
    }).join('') : '<div class="empty" style="grid-column:1/-1"><span class="ico" data-icon="bookmark"></span><b>还没有收藏的回复</b>' +
      '<p>在「截图改话」里生成回复后点「保存」，单条英文话术就会收在这里。每次生成还会自动进入「截图话术库」，不需要手动保存。</p><a class="btn btn-accent btn-sm" href="#/reply">去生成一条</a></div>';
    return '<div class="saved-grid">' + cards + '</div>';
  }

  function archivesHTML() {
    var list = archivesFiltered();
    var empty = state.archives.length
      ? '<div class="empty" style="grid-column:1/-1"><span class="ico" data-icon="search"></span><b>没有匹配的归档</b><p>换个关键词试试，或清空搜索。</p></div>'
      : '<div class="empty" style="grid-column:1/-1"><span class="ico" data-icon="bookmark"></span><b>还没有截图归档</b>' +
        '<p>去「截图改话」粘贴一张客户截图，生成回复后会自动形成一条带标题的归档：客户原话、匹配场景、3 条英文回复、截图缩略图，全部留档。</p><a class="btn btn-accent btn-sm" href="#/reply">去识别一张截图</a></div>';
    return '<div class="row row-wrap" style="margin-bottom:14px">' +
      '<label class="toolbar-search" style="max-width:360px">' + window.icon('search') +
        '<input id="arcSearch" placeholder="搜索标题 / 客户原话 / 柜号" value="' + esc(state.arcQuery) + '" autocomplete="off" /></label>' +
      '<span class="hint" style="flex:1;min-width:180px">截图生成后自动归档；标题由国家 + 命中场景 + 柜号/时间点生成。</span>' +
      '<button class="btn btn-soft btn-sm" data-action="export-archives">' + window.icon('download') + '导出归档</button></div>' +
      '<div class="saved-grid" id="arcList">' + (list.length ? list.map(archiveCardHTML).join('') : empty) + '</div>';
  }

  function refreshArchiveList() {
    var list = archivesFiltered();
    var el = $('#arcList');
    if (!el) return;
    el.innerHTML = list.length ? list.map(archiveCardHTML).join('') :
      '<div class="empty" style="grid-column:1/-1"><span class="ico" data-icon="search"></span><b>没有匹配的归档</b><p>换个关键词试试。</p></div>';
    window.hydrateIcons(el);
  }

  function viewSaved() {
    var q = state.currentQuery && state.currentQuery.get ? state.currentQuery.get('tab') : '';
    if (q === 'archives' || q === 'replies') state.savedTab = q;
    var tab = state.savedTab;
    var body = tab === 'archives' ? archivesHTML() : savedRepliesHTML();
    $('#view').innerHTML = '<div class="page-head"><div><div class="section-kicker">MY REPLIES &amp; ARCHIVE</div><h1>我的回复</h1>' +
      '<p class="sub">收藏的单条英文回复 + 每次截图生成后自动留档的「截图话术库」。归档包含标题、客户原话、3 条回复与截图缩略图，可随时搜索、复制、导出。</p></div>' +
      '<div class="head-actions"><a class="btn btn-accent" href="#/reply">' + window.icon('sparkles') + '截图生成回复</a></div></div>' +
      '<div class="seg" style="margin-bottom:16px;width:max-content">' +
        '<button class="' + (tab === 'replies' ? 'on' : '') + '" data-action="saved-tab" data-tab="replies">收藏回复 ' + state.saved.length + '</button>' +
        '<button class="' + (tab === 'archives' ? 'on' : '') + '" data-action="saved-tab" data-tab="archives">截图话术库 ' + state.archives.length + '</button>' +
      '</div>' +
      '<div id="savedBody">' + body + '</div>';

    if (tab === 'archives') {
      var inp = $('#arcSearch');
      if (inp) {
        inp.addEventListener('input', function () {
          state.arcQuery = inp.value;
          refreshArchiveList();
        });
      }
    }
  }

  function copyArchiveReply(arcId, index) {
    var a = state.archives.filter(function (x) { return x.id === arcId; })[0];
    if (!a) return;
    var r = (a.replies || [])[index];
    if (!r) return;
    var text = DDCEngine.applyVars(DDCEngine.fillDefaults(r.text, { settings: state.settings }), a.vars || {});
    copyText(text).then(function (ok) {
      if (!ok) { toast('复制失败，请手动选择', true); return; }
      var missing = DDCEngine.missingTokens(text);
      toast(missing.length ? '已复制；仍有 ' + missing.length + ' 个变量未填' : '已复制，可直接粘贴到 WhatsApp');
    });
  }

  function showArchiveModal(a) {
    var vars = a.vars || {};
    var replies = (a.replies || []).map(function (r, i) {
      var text = DDCEngine.applyVars(DDCEngine.fillDefaults(r.text, { settings: state.settings }), vars);
      return '<div style="margin-top:14px">' +
        '<div class="row" style="justify-content:space-between;margin-bottom:6px">' +
          '<div class="row"><span class="tone-tag tone-' + esc((r.tone || 'standard').toLowerCase()) + '">' + esc(TONE[(r.tone || 'standard').toLowerCase()] || '') + '</span>' +
          '<b style="font-size:12px">' + esc(r.label || '') + '</b></div>' +
          '<button class="btn btn-soft btn-xs" data-action="copy-archive-reply" data-arc="' + esc(a.id) + '" data-i="' + i + '">' + window.icon('copy') + '复制</button></div>' +
        '<div class="wa-bubble" style="font-size:12px">' + highlight(text) + '</div></div>';
    }).join('');
    openModal('<div class="modal-head"><h3>' + esc(a.title) + '</h3><button class="icon-btn" data-action="modal-close">' + window.icon('close') + '</button></div>' +
      '<div class="modal-body">' +
        '<div class="row row-wrap" style="gap:6px"><span class="country-chip ' + esc(a.country) + '">' + esc(a.country) + '</span>' +
        '<span class="chip">' + esc(timeLabel(a.createdAt)) + '</span><span class="chip">' + esc(a.matchedTitle || '通用') + '</span></div>' +
        '<p class="hint" style="margin-top:10px;white-space:pre-wrap">客户原话：' + esc(a.customerText) + '</p>' +
        replies + '</div>' +
      '<div class="modal-foot"><button class="btn btn-soft btn-sm" data-action="copy-archive-first" data-id="' + esc(a.id) + '">' + window.icon('copy') + '复制首条</button>' +
      '<button class="btn btn-accent btn-sm" data-action="modal-close">关闭</button></div>');
  }

  /* ---------------- editor ---------------- */

  function blankScenario() {
    return {
      id: '', country: 'AU', lane: '中澳', stage: '清关', category: '清关异常', severity: 'high',
      title_zh: '', title_en: '', summary_zh: '', customer_signals: [], keywords: [],
      framework: { empathy: [], facts: [], plan: [], sync: [], reassure: [] },
      scripts: [
        { phase: 'first', tone: 'standard', label_zh: '首响 · 标准版', use_when: '', text: '', placeholders: [] },
        { phase: 'followup', tone: 'warm', label_zh: '跟进 · 短消息', use_when: '', text: '', placeholders: [] },
        { phase: 'close', tone: 'supervisor', label_zh: '收口 · 主管口径', use_when: '', text: '', placeholders: [] }
      ],
      alts: [
        { tone: 'warm', label_zh: '替代 · 共情版', text: '', placeholders: [] },
        { tone: 'concise', label_zh: '替代 · 简洁版', text: '', placeholders: [] }
      ],
      internal: { common_causes: [], resolution_path: [], sla_hint: '', fee_policy: '', guardrails: [] },
      authorities: [{ name: '', url: '' }],
      updated_at: todayISO()
    };
  }

  function viewEditor(query) {
    var editId = query.get('edit');
    var key = editId || 'new';
    if (state.editor.loadedFor !== key || !state.editor.draft) {
      var src = editId ? byId(editId) : null;
      state.editor.draft = src ? JSON.parse(JSON.stringify(src)) : blankScenario();
      state.editor.loadedFor = key;
      state.editor.error = '';
    }
    var d = state.editor.draft;
    var isEdit = !!editId;

    $('#view').innerHTML =
      '<div class="page-head"><div><div class="section-kicker">' + (isEdit ? 'EDIT SCRIPT' : 'NEW SCRIPT') + '</div>' +
        '<h1>' + (isEdit ? '编辑话术' : '新增话术') + '</h1>' +
        '<p class="sub">把新问题沉淀成可复用的五段式话术。英文至少写 3 条（首响 / 跟进 / 收口），再补 2 条同题替代，截图改话会自动挑选最合适的 3 条。</p></div>' +
        '<div class="head-actions"><a class="btn btn-ghost" href="#/library">取消</a></div></div>' +
      '<form class="editor" id="scenarioForm" novalidate>' +
        '<div id="editorError"></div>' +
        '<div class="form-card"><h3>' + window.icon('file') + '基础信息</h3><p class="hint">国家、阶段、类别决定它出现在哪个筛选下；标题尽量让客服一眼知道是什么问题。</p>' +
          '<div class="form-grid">' +
            '<div class="field"><label>国家 / 专线</label><select class="select" name="country">' +
              ['AU', 'CA', 'US'].map(function (c) { return '<option value="' + c + '"' + (d.country === c ? ' selected' : '') + '>' + COUNTRIES[c].lane + ' · ' + COUNTRIES[c].name + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label>阶段</label><select class="select" name="stage">' +
              STAGES.map(function (s) { return '<option' + (d.stage === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label>类别</label><select class="select" name="category">' +
              CATEGORIES.map(function (s) { return '<option' + (d.category === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label>严重度</label><select class="select" name="severity">' +
              [['high', '高'], ['medium', '中'], ['low', '低']].map(function (s) { return '<option value="' + s[0] + '"' + (d.severity === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div>' +
            '<div class="field span-2"><label>中文标题</label><input class="input" name="title_zh" value="' + esc(d.title_zh) + '" placeholder="例如：澳洲海关查验扣关（ABF Inspection）" /></div>' +
            '<div class="field span-2"><label>英文标题</label><input class="input" name="title_en" value="' + esc(d.title_en) + '" placeholder="Shipment held for ABF inspection" /></div>' +
            '<div class="field span-2"><label>一句话场景摘要</label><input class="input" name="summary_zh" value="' + esc(d.summary_zh) + '" placeholder="货物到港后被 ABF 抽中查验，客户催进度、担心错过销售窗口。" /></div>' +
            '<div class="field"><label>话术编号</label><input class="input" name="id" value="' + esc(d.id) + '" ' + (isEdit ? 'readonly' : '') + ' placeholder="留空自动生成（如 au-customs-inspection）" /></div>' +
            '<div class="field"><label>更新日期</label><input class="input" value="' + esc(todayISO()) + '" disabled /></div>' +
          '</div></div>' +

        '<div class="form-card"><h3>' + window.icon('message') + '客户信号 & 搜索关键词</h3><p class="hint">一行一条。客户信号写成客户真实会说的话；关键词会用于截图识别匹配，中英文都填。</p>' +
          '<div class="form-grid">' +
            '<div class="field"><label>客户可能这样说</label><textarea class="textarea" name="signals" placeholder="Why is my container still in customs?&#10;海关查验要多久？">' + esc((d.customer_signals || []).join('\n')) + '</textarea></div>' +
            '<div class="field"><label>关键词</label><textarea class="textarea" name="keywords" placeholder="customs&#10;inspection&#10;查验&#10;扣关">' + esc((d.keywords || []).join('\n')) + '</textarea></div>' +
          '</div></div>' +

        '<div class="form-card"><h3>' + window.icon('layers') + '五段式 · 内部口径</h3><p class="hint">每行一条中文操作要点。这些不会发给客户，是给客服判断和组织的骨架。</p>' +
          '<div class="form-grid">' +
            fiveField('共情 Empathy', 'fw_empathy', d.framework.empathy, '先承认客户的时间损失与商业影响') +
            fiveField('事实 Facts', 'fw_facts', d.framework.facts, 'ABF 到港后查验属常规边境监管') +
            fiveField('方案 Plan', 'fw_plan', d.framework.plan, '确认查验类型与排队位置') +
            fiveField('同步 Sync', 'fw_sync', d.framework.sync, '当天下班前给一次书面进度') +
            fiveField('安抚 Reassure', 'fw_reassure', d.framework.reassure, '提供可落地的替代方案') +
          '</div></div>' +

        '<div class="form-card"><h3>' + window.icon('whatsapp') + '三条英文话术</h3><p class="hint">首响 90–150 词、跟进 50–90 词、收口 60–110 词。WhatsApp 直接发送，不要 Markdown。占位符用 {{customer_name}} 这种双花括号。</p>' +
          scriptEditor(0, d.scripts[0]) + scriptEditor(1, d.scripts[1]) + scriptEditor(2, d.scripts[2]) +
        '</div>' +

        '<div class="form-card"><h3>' + window.icon('sparkles') + '同题替代表达（截图三选一）</h3><p class="hint">这两条与首响回答同一件事，用于「共情版 / 简洁版」的替代选择，各 80–130 词。</p>' +
          altEditor(0, d.alts[0]) + altEditor(1, d.alts[1]) +
        '</div>' +

        '<div class="form-card"><h3>' + window.icon('wrench') + '处理口径 & 红线</h3><p class="hint">内部使用。SLA、费用边界、绝不能说的话，越具体越好。</p>' +
          '<div class="form-grid">' +
            '<div class="field"><label>常见成因（一行一条）</label><textarea class="textarea" name="causes">' + esc((d.internal.common_causes || []).join('\n')) + '</textarea></div>' +
            '<div class="field"><label>处理路径（一行一步）</label><textarea class="textarea" name="path">' + esc((d.internal.resolution_path || []).join('\n')) + '</textarea></div>' +
            '<div class="field"><label>SLA 标准</label><input class="input" name="sla" value="' + esc(d.internal.sla_hint) + '" placeholder="首次响应 2 小时内；每 24 小时主动同步一次" /></div>' +
            '<div class="field"><label>费用口径</label><input class="input" name="fee" value="' + esc(d.internal.fee_policy) + '" placeholder="DDP 项下常规查验费由我方承担；客户原因改址费另行确认" /></div>' +
            '<div class="field span-2"><label>红线（一行一条）</label><textarea class="textarea" name="guardrails">' + esc((d.internal.guardrails || []).join('\n')) + '</textarea></div>' +
            '<div class="field span-2"><label>官方依据（每行「名称 | 链接」）</label><textarea class="textarea" name="authorities" placeholder="Australian Border Force | https://www.abf.gov.au/">' +
              esc((d.authorities || []).filter(function (a) { return a && a.url; }).map(function (a) { return (a.name || '') + ' | ' + a.url; }).join('\n')) + '</textarea></div>' +
          '</div></div>' +

        '<div class="sticky-actions"><span class="hint">保存后立即出现在话术库；' + (state.mode === 'server' ? '会写入服务端数据文件。' : '会保存在本浏览器，建议在设置里导出备份。') + '</span><span class="spacer"></span>' +
          '<a class="btn btn-ghost btn-sm" href="#/library">取消</a>' +
          '<button class="btn btn-accent btn-sm" type="submit">' + window.icon('check') + '保存话术</button></div>' +
      '</form>';

    var form = $('#scenarioForm');
    form.addEventListener('submit', onSubmitScenario);
    var err = $('#editorError');
    if (state.editor.error) err.innerHTML = '<div class="notice danger" style="margin-bottom:16px">' + window.icon('alert') + '<div>' + esc(state.editor.error) + '</div></div>';
    window.hydrateIcons($('#view'));
  }

  function fiveField(label, name, arr, ph) {
    return '<div class="field"><label>' + esc(label) + '</label><textarea class="textarea" name="' + name + '" placeholder="' + esc(ph || '') + '">' + esc((arr || []).join('\n')) + '</textarea></div>';
  }

  function scriptEditor(i, sc) {
    sc = sc || {};
    var phaseLabel = ['首响 · 第 1 次回复', '跟进 · 客户再问 / 无进展', '收口 · 放行 / 结论 / 升级'][i];
    return '<div class="script-editor">' +
      '<div class="se-head"><b>' + phaseLabel + '</b><span class="tiny muted">' + (sc.placeholders || []).length + ' 个变量</span></div>' +
      '<div class="form-grid three" style="margin-bottom:10px">' +
        '<div class="field"><label>语气</label><select class="select" name="script' + i + '_tone">' +
          ['standard', 'warm', 'firm', 'supervisor'].map(function (t) { return '<option value="' + t + '"' + (sc.tone === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>标签</label><input class="input" name="script' + i + '_label" value="' + esc(sc.label_zh || '') + '" /></div>' +
        '<div class="field"><label>适用时机</label><input class="input" name="script' + i + '_use" value="' + esc(sc.use_when || '') + '" placeholder="客户第一次问查验进度" /></div>' +
      '</div>' +
      '<div class="field"><label>英文正文</label><textarea name="script' + i + '_text" placeholder="Hi {{customer_name}}, …">' + esc(sc.text || '') + '</textarea></div>' +
      '</div>';
  }

  function altEditor(i, al) {
    al = al || {};
    return '<div class="script-editor">' +
      '<div class="se-head"><b>替代 ' + (i + 1) + ' · ' + (i === 0 ? '共情版' : '简洁版') + '</b><span class="tiny muted">' + (al.tone || '') + '</span></div>' +
      '<div class="field"><textarea name="alt' + i + '_text" placeholder="Hi {{customer_name}}, …">' + esc(al.text || '') + '</textarea></div>' +
      '</div>';
  }

  async function onSubmitScenario(e) {
    e.preventDefault();
    var f = e.target;
    var val = function (n) { return f.elements[n] ? String(f.elements[n].value || '').trim() : ''; };
    var lines = function (n) {
      return val(n).split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    };
    var country = val('country');
    var id = val('id') || DDCStore.newId(country);
    if (!/^[a-z0-9-]+$/.test(id)) { showEditorError('编号只能是小写字母、数字和连字符'); return; }
    var scripts = [0, 1, 2].map(function (i) {
      var text = val('script' + i + '_text');
      return {
        id: id + '-' + ['first', 'followup', 'close'][i],
        phase: ['first', 'followup', 'close'][i],
        tone: val('script' + i + '_tone') || 'standard',
        label_zh: val('script' + i + '_label') || ['首响 · 标准版', '跟进 · 短消息', '收口 · 主管口径'][i],
        use_when: val('script' + i + '_use'),
        text: text,
        placeholders: DDCEngine.missingTokens(text)
      };
    });
    var alts = [0, 1].map(function (i) {
      var text = val('alt' + i + '_text');
      return {
        id: id + '-alt-' + (i === 0 ? 'warm' : 'concise'),
        tone: i === 0 ? 'warm' : 'concise',
        label_zh: i === 0 ? '替代 · 共情版' : '替代 · 简洁版',
        text: text,
        placeholders: DDCEngine.missingTokens(text)
      };
    });
    if (!val('title_zh') || !val('title_en')) { showEditorError('中文标题和英文标题都要填'); return; }
    if (!scripts[0].text) { showEditorError('首响英文话术不能为空'); return; }
    if (!scripts[1].text || !scripts[2].text) { showEditorError('跟进和收口的英文话术也要填，截图改话才能给出 3 条'); return; }
    if (!alts[0].text || !alts[1].text) { showEditorError('替代表达 2 条都要填，才能做到同一问题三选一'); return; }

    var authorities = lines('authorities').map(function (line) {
      var parts = line.split('|').map(function (x) { return x.trim(); });
      return { name: parts[0] || parts[1] || '', url: parts[1] || parts[0] || '' };
    }).filter(function (a) { return /^https?:\/\//.test(a.url); });

    var scenario = {
      id: id,
      country: country,
      lane: COUNTRIES[country].lane.replace('专线', ''),
      stage: val('stage'),
      category: val('category'),
      severity: val('severity'),
      title_zh: val('title_zh'),
      title_en: val('title_en'),
      summary_zh: val('summary_zh'),
      customer_signals: lines('signals'),
      keywords: lines('keywords'),
      framework: {
        empathy: lines('fw_empathy'), facts: lines('fw_facts'), plan: lines('fw_plan'),
        sync: lines('fw_sync'), reassure: lines('fw_reassure')
      },
      scripts: scripts,
      alts: alts,
      internal: {
        common_causes: lines('causes'),
        resolution_path: lines('path'),
        sla_hint: val('sla'),
        fee_policy: val('fee'),
        guardrails: lines('guardrails')
      },
      authorities: authorities,
      updated_at: todayISO()
    };
    var btn = f.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.innerHTML = '保存中…'; }
    try {
      await DDCStore.saveScenario(scenario);
      state.scenarios = await DDCStore.getScenarios();
      state.editor.loadedFor = null;
      state.editor.draft = null;
      toast('话术已保存');
      location.hash = '#/library/' + encodeURIComponent(id);
    } catch (err) {
      showEditorError(err.message || '保存失败');
      if (btn) { btn.disabled = false; btn.innerHTML = '保存话术'; }
    }
  }

  function showEditorError(msg) {
    state.editor.error = msg;
    var err = $('#editorError');
    if (err) {
      err.innerHTML = '<div class="notice danger" style="margin-bottom:16px">' + window.icon('alert') + '<div>' + esc(msg) + '</div></div>';
      err.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.hydrateIcons(err);
    } else toast(msg, true);
  }

  /* ---------------- settings ---------------- */

  function viewSettings() {
    var s = state.settings;
    $('#view').innerHTML =
      '<div class="page-head"><div><div class="section-kicker">SETTINGS</div><h1>设置</h1>' +
        '<p class="sub">数据存储、AI 增强、身份变量和备份。所有配置只保存在当前浏览器；服务端部署时 API Key 走环境变量更安全。</p></div></div>' +
      '<div class="set-card"><h2>' + window.icon('layers') + '数据模式</h2><p class="hint">' +
        (state.mode === 'server'
          ? '当前由本地 Node 服务托管，话术保存在 <span class="code">server/data/db.json</span>，多人可共享。'
          : '当前是静态模式（GitHub Pages）：基础话术来自 <span class="code">data/*.json</span>，新增/修改保存在本浏览器 localStorage。要多人协作，按 README 启动 Node 服务。') +
        '</p>' +
        '<div class="set-row"><div class="sr-label"><b>当前状态</b><span>页面启动时自动检测</span></div><div class="sr-body"><span class="status-pill ' + (state.mode === 'server' ? '' : 'off') + '"><span class="dot"></span>' +
          (state.mode === 'server' ? '服务端模式' : '本地静态模式') + '</span>' +
          (state.mode === 'server' && DDCStore.version ? '<span class="hint">服务端版本 ' + esc(DDCStore.version) + '</span>' : '') + '</div></div>' +
        '<div class="set-row"><div class="sr-label"><b>启用服务端</b><span>零依赖 Node，一条命令</span></div><div class="sr-body">' +
          '<div class="hint">在项目目录执行 <span class="code">node server/index.js</span>，然后访问 <span class="code">http://localhost:4173</span>。数据会写入 JSON 文件，重启不丢。</div>' +
          '<div class="hint">GitHub Pages 只能托管静态页面；要多人同时新增话术，请把仓库部署到支持 Node 的平台（Render / Railway / 自己的服务器）。</div>' +
        '</div></div>' +
        '<div class="set-row"><div class="sr-label"><b>管理口令</b><span>可选，保护写入接口</span></div><div class="sr-body">' +
          '<input class="input" id="adminToken" value="' + esc(s.adminToken) + '" placeholder="与服务端 ADMIN_TOKEN 一致，留空表示不校验" />' +
          '<div class="hint">仅在服务端模式生效。部署到公网时强烈建议设置 ADMIN_TOKEN。</div>' +
        '</div></div>' +
      '</div>' +

      '<div class="set-card"><h2>' + window.icon('sparkles') + 'AI 增强（可选）</h2><p class="hint">不配置也能用：截图识别 + 本地话术引擎完全免费、离线可用。配置后，「AI 润色」会调用 OpenAI 兼容接口生成更贴合的英文回复。</p>' +
        '<div class="set-row"><div class="sr-label"><b>接口状态</b><span>由服务端探测</span></div><div class="sr-body"><span class="status-pill ' + (state.ai ? '' : 'off') + '"><span class="dot"></span>' +
          (state.ai ? 'AI 可用' : (state.mode === 'server' ? '服务端已就绪 · 未配置 Key' : '静态模式不可用（需部署 Node）')) + '</span>' +
          '<div class="hint">服务端启动时读取 <span class="code">AI_API_KEY</span>（必填）、<span class="code">AI_BASE_URL</span>（默认 https://api.deepseek.com）、<span class="code">AI_MODEL</span>（默认 deepseek-chat）。</div>' +
        '</div></div>' +
        '<div class="set-row"><div class="sr-label"><b>临时覆盖</b><span>只存本机，非必要不填</span></div><div class="sr-body">' +
          '<div class="form-grid">' +
            '<div class="field"><label>API Base</label><input class="input" id="aiBase" value="' + esc(s.aiBase) + '" placeholder="https://api.deepseek.com" /></div>' +
            '<div class="field"><label>Model</label><input class="input" id="aiModel" value="' + esc(s.aiModel) + '" placeholder="deepseek-chat" /></div>' +
            '<div class="field span-2"><label>API Key</label><input class="input" id="aiKey" type="password" value="' + esc(s.aiKey) + '" placeholder="sk-…" /></div>' +
          '</div><div class="row mt-8" style="gap:8px"><button class="btn btn-accent btn-sm" data-action="save-ai">' + window.icon('check') + '保存 AI 配置</button>' +
          '<span class="hint">覆盖项会随请求发送到你自己的服务端，不会写到第三方。若把服务部署在公网，建议只用环境变量。</span></div>' +
        '</div></div>' +
      '</div>' +

      '<div class="set-card"><h2>' + window.icon('user') + '身份变量</h2><p class="hint">复制话术时自动替换 {{agent_name}} 与 {{company_name}}，减少手填。更新时间默认值会自动填入截图文案的变量。</p>' +
        '<div class="form-grid three">' +
          '<div class="field"><label>你的英文名</label><input class="input" id="agentName" value="' + esc(s.agentName) + '" placeholder="Alex" /></div>' +
          '<div class="field"><label>公司名（英文）</label><input class="input" id="companyName" value="' + esc(s.companyName) + '" placeholder="SinoLink Logistics" /></div>' +
          '<div class="field"><label>下次更新默认值</label><input class="input" id="nextUpdateTime" value="' + esc(s.nextUpdateTime) + '" placeholder="6pm" /></div>' +
        '</div>' +
        '<div class="row mt-16"><button class="btn btn-accent btn-sm" data-action="save-identity">' + window.icon('check') + '保存</button>' +
        '<span class="hint">只保存在当前浏览器。</span></div>' +
      '</div>' +

      '<div class="set-card"><h2>' + window.icon('download') + '数据备份</h2><p class="hint">导出会包含：自定义话术、删除记录、我的回复、截图归档与设置。换设备或清浏览器前先导一份。</p>' +
        '<div class="row row-wrap">' +
          '<button class="btn btn-soft btn-sm" data-action="export-data">' + window.icon('download') + '导出 JSON</button>' +
          '<label class="btn btn-soft btn-sm" style="cursor:pointer">' + window.icon('upload') + '导入 JSON<input type="file" id="importFile" accept="application/json" hidden /></label>' +
          '<button class="btn btn-danger btn-sm" data-action="reset-data">' + window.icon('rotate-ccw') + '清空本地新增</button>' +
        '</div>' +
        '<div class="hint mt-8">导入同名编号会覆盖本地版本；删除记录会一并恢复。基础话术不会被删除。</div>' +
      '</div>' +

      '<div class="set-card"><h2>' + window.icon('shield') + '合规声明</h2>' +
        '<div class="notice"><span class="ico" data-icon="shield"></span><div>本库话术用于沟通参考，不构成法律、税务、清关或保险建议。具体税率、查验时效、费用承担以官方最新公告与报关行确认为准。任何情况下不得建议客户低报货值、修改品名/HS 编码、拆单避税或提供虚假单证。</div></div>' +
        '<p class="hint mt-12">版本 1.0 · 2026-11 · 内容由 DDP 专线售后团队维护。每季度对照 ABF / CBSA / CBP 官方更新复核一次。</p>' +
      '</div>';

    var imp = $('#importFile');
    if (imp) imp.addEventListener('change', async function () {
      var file = imp.files && imp.files[0];
      if (!file) return;
      try {
        var text = await file.text();
        var obj = JSON.parse(text);
        var n = DDCStore.importData(obj);
        if (state.mode === 'server' && Array.isArray(obj.customScenarios)) {
          for (var i = 0; i < obj.customScenarios.length; i++) {
            try { await DDCStore.saveScenario(obj.customScenarios[i]); } catch (e) { console.warn('server import', e); }
          }
        }
        if (Array.isArray(obj.archives)) {
          for (var j = 0; j < obj.archives.length; j++) {
            try { await DDCStore.saveArchive(obj.archives[j]); } catch (e) { console.warn('archive import', e); }
          }
        }
        state.settings = DDCStore.getSettings();
        state.saved = DDCStore.getSaved();
        state.scenarios = await DDCStore.getScenarios();
        state.archives = await DDCStore.getArchives();
        refreshNavCounts();
        toast('已导入 ' + n + ' 条自定义话术' + (Array.isArray(obj.archives) ? '、' + obj.archives.length + ' 条截图归档' : ''));
        viewSettings(); window.hydrateIcons($('#view'));
      } catch (e) { toast(e.message || '导入失败，文件格式不对', true); }
      imp.value = '';
    });
  }

  /* ---------------- modal & confirm ---------------- */

  var confirmCb = null;

  function openModal(html) {
    $('#modalRoot').innerHTML = '<div class="modal-overlay" data-action="modal-bg"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
    window.hydrateIcons($('#modalRoot'));
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; confirmCb = null; }

  function confirmDialog(opts) {
    confirmCb = opts.onOk;
    openModal('<div class="modal-head"><h3>' + esc(opts.title) + '</h3><button class="icon-btn" data-action="modal-close">' + window.icon('close') + '</button></div>' +
      '<div class="modal-body"><p style="font-size:12.5px;color:var(--ink-3);line-height:1.7">' + esc(opts.body) + '</p></div>' +
      '<div class="modal-foot"><button class="btn btn-ghost btn-sm" data-action="modal-close">取消</button>' +
      '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-accent') + ' btn-sm" data-action="modal-ok">' + esc(opts.okText || '确定') + '</button></div>');
  }

  function showTextModal(title, text) {
    openModal('<div class="modal-head"><h3>' + esc(title) + '</h3><button class="icon-btn" data-action="modal-close">' + window.icon('close') + '</button></div>' +
      '<div class="modal-body"><div class="wa-bubble" style="white-space:pre-wrap">' + highlight(text) + '</div></div>' +
      '<div class="modal-foot"><button class="btn btn-soft btn-sm" data-action="modal-copy" data-text="' + esc(text) + '">' + window.icon('copy') + '复制</button>' +
      '<button class="btn btn-accent btn-sm" data-action="modal-close">关闭</button></div>');
  }

  /* ---------------- global actions ---------------- */

  document.addEventListener('click', async function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;
    var id = el.dataset.id;

    if (action === 'country-link') {
      e.preventDefault();
      state.filter.country = el.dataset.country;
      location.hash = '#/library';
      viewLibrary(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'quick-filter') {
      e.preventDefault();
      state.filter.category = el.dataset.cat;
      state.filter.country = 'ALL';
      location.hash = '#/library';
      viewLibrary(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'open') {
      location.hash = '#/library/' + encodeURIComponent(id);
      return;
    }
    if (action === 'close-drawer') {
      if (e.target.closest('.drawer') && !e.target.closest('[data-action="close-drawer"]')) return;
      location.hash = '#/library';
      return;
    }
    if (action === 'detail-tab') {
      state.detailTab = Number(el.dataset.i);
      updateDetailPanel();
      return;
    }
    if (action === 'copy-detail') { copyDetail(false); return; }
    if (action === 'copy-detail-plain') { copyDetail(true); return; }
    if (action === 'edit-scenario') {
      location.hash = '#/new?edit=' + encodeURIComponent(state.detailId);
      return;
    }
    if (action === 'delete-scenario') {
      var s = byId(state.detailId);
      if (!s) return;
      confirmDialog({
        title: '删除这条话术？',
        body: '将从本地库移除「' + s.title_zh + '」。基础话术被删除后会记录删除标记，可在设置里清空本地数据恢复。',
        okText: '删除',
        danger: true,
        onOk: async function () {
          try {
            await DDCStore.removeScenario(s.id);
            state.scenarios = await DDCStore.getScenarios();
            state.detailId = null;
            toast('已删除');
            location.hash = '#/library';
            render();
          } catch (err) { toast(err.message || '删除失败', true); }
        }
      });
      return;
    }
    if (action === 'set-country') {
      state.filter.country = el.dataset.country;
      viewLibrary(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'set-category') {
      state.filter.category = el.dataset.cat;
      viewLibrary(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'reset-filters') {
      state.filter = { country: 'ALL', category: 'ALL', stage: 'ALL', query: '', sort: 'default' };
      viewLibrary(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'reply-tab') {
      state.reply.tab = el.dataset.tab;
      viewReply(); window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'pick-file') {
      e.preventDefault();
      var input = $('#ocrFile');
      if (!input) {
        input = document.createElement('input');
        input.type = 'file'; input.id = 'ocrFile'; input.accept = 'image/*'; input.hidden = true;
        input.addEventListener('change', function () {
          if (input.files && input.files[0]) handleImage(input.files[0]);
          input.value = '';
        });
        document.body.appendChild(input);
      }
      input.click();
      return;
    }
    if (action === 'rerun-ocr') { if (state.reply.file) runOcr(state.reply.file); return; }
    if (action === 'clear-image') { state.reply.file = null; state.reply.dataUrl = null; viewReply(); window.hydrateIcons($('#view')); return; }
    if (action === 'clear-text') { state.reply.text = ''; state.reply.result = null; state.reply.vars = {}; state.reply.archiveId = null; viewReply(); window.hydrateIcons($('#view')); return; }
    if (action === 'generate') { doGenerate(); return; }
    if (action === 'ai-reply') { await aiReply(); return; }
    if (action === 'copy-reply') { copyReply(Number(el.dataset.i)); return; }
    if (action === 'save-reply') {
      var rp = state.reply.result && state.reply.result.replies[Number(el.dataset.i)];
      if (!rp) return;
      var full = DDCEngine.applyVars(DDCEngine.fillDefaults(rp.text, { settings: state.settings }), state.reply.vars);
      state.saved = DDCStore.saveReply({
        text: full, label: rp.label || '英文回复', tone: rp.tone, country: state.reply.country,
        scenarioId: state.reply.result.scenario ? state.reply.result.scenario.id : '', scenarioTitle: state.reply.result.scenario ? state.reply.result.scenario.title_zh : ''
      });
      refreshNavCounts();
      toast('已保存到「我的回复」');
      return;
    }
    if (action === 'sample') {
      var samples = {
        AU: 'Hi, our container MSCU1234567 has been at Port Botany for 5 days and still showing a customs hold. Our shop opening is next Friday — what is actually happening?',
        CA: 'Hey, CBSA still has not released our shipment. Our CARM account was set up last week, so why is it still stuck? We need it for a trade show on the 18th.',
        US: 'Our goods arrived at LA last week but tracking has not moved. We were told there is an ISF issue? We need this for an Amazon FBA appointment on Monday.'
      };
      state.reply.text = samples[el.dataset.country] || samples.AU;
      state.reply.country = el.dataset.country || 'AU';
      state.reply.countryTouched = true;
      state.reply.result = null;
      state.reply.archiveId = null;
      state.reply.vars = {};
      state.reply.tab = 'text';
      viewReply(); window.hydrateIcons($('#view'));
      setTimeout(doGenerate, 60);
      return;
    }
    if (action === 'saved-tab') {
      state.savedTab = el.dataset.tab === 'archives' ? 'archives' : 'replies';
      history.replaceState(null, '', '#/saved?tab=' + state.savedTab);
      viewSaved();
      window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'view-archive') {
      var ar = state.archives.filter(function (x) { return x.id === id; })[0];
      if (ar) showArchiveModal(ar);
      return;
    }
    if (action === 'copy-archive-first') { copyArchiveReply(id, 0); return; }
    if (action === 'copy-archive-reply') { copyArchiveReply(el.dataset.arc, Number(el.dataset.i)); return; }
    if (action === 'delete-archive') {
      var delArc = state.archives.filter(function (x) { return x.id === id; })[0];
      if (!delArc) return;
      confirmDialog({
        title: '删除这条截图归档？', body: '「' + delArc.title + '」的客户原话与 3 条回复会一起删除，无法恢复。', okText: '删除', danger: true,
        onOk: async function () {
          try {
            await DDCStore.removeArchive(id);
            state.archives = await DDCStore.getArchives();
            state.savedTab = 'archives';
            refreshNavCounts();
            viewSaved();
            window.hydrateIcons($('#view'));
            toast('归档已删除');
          } catch (e) { toast(e.message || '删除失败', true); }
        }
      });
      return;
    }
    if (action === 'export-archives') {
      downloadFile('caredesk-archives-' + todayISO() + '.json', JSON.stringify({
        app: 'CareDesk', type: 'archives', exportedAt: new Date().toISOString(), archives: state.archives
      }, null, 2));
      toast('截图归档已导出');
      return;
    }
    if (action === 'copy-saved' || action === 'view-saved' || action === 'delete-saved') {
      var item = state.saved.filter(function (x) { return x.id === id; })[0];
      if (!item) return;
      if (action === 'copy-saved') {
        copyText(item.text).then(function (ok) { toast(ok ? '已复制' : '复制失败，请手动选择', !ok); });
      } else if (action === 'view-saved') {
        showTextModal(item.label || '英文回复', item.text);
      } else {
        confirmDialog({
          title: '删除这条回复？', body: '只会从「我的回复」里移除，不影响话术库。', okText: '删除', danger: true,
          onOk: function () { state.saved = DDCStore.removeSaved(id); refreshNavCounts(); viewSaved(); window.hydrateIcons($('#view')); toast('已删除'); }
        });
      }
      return;
    }
    if (action === 'modal-close' || action === 'modal-bg') {
      if (action === 'modal-bg' && e.target !== el) return;
      closeModal(); return;
    }
    if (action === 'modal-ok') {
      var cb = confirmCb;
      closeModal();
      if (cb) cb();
      return;
    }
    if (action === 'modal-copy') {
      copyText(el.dataset.text || '').then(function (ok) { toast(ok ? '已复制' : '复制失败', !ok); });
      return;
    }
    if (action === 'save-ai') {
      state.settings = DDCStore.saveSettings({
        aiBase: $('#aiBase').value.trim(),
        aiKey: $('#aiKey').value.trim(),
        aiModel: $('#aiModel').value.trim()
      });
      state.ai = DDCStore.aiReady || (state.mode === 'server' && !!state.settings.aiKey);
      toast(state.ai ? 'AI 配置已保存，可使用 AI 润色' : '已保存；服务端模式下填写 Key 后才会启用');
      viewSettings();
      window.hydrateIcons($('#view'));
      return;
    }
    if (action === 'save-identity') {
      state.settings = DDCStore.saveSettings({
        agentName: $('#agentName').value.trim(),
        companyName: $('#companyName').value.trim(),
        nextUpdateTime: $('#nextUpdateTime').value.trim() || '6pm'
      });
      toast('身份变量已保存');
      return;
    }
    if (action === 'export-data') {
      var payload = DDCStore.exportData();
      payload.archives = state.archives;
      var name = 'caredesk-backup-' + todayISO() + '.json';
      downloadFile(name, JSON.stringify(payload, null, 2));
      toast('备份已导出');
      return;
    }
    if (action === 'reset-data') {
      confirmDialog({
        title: '清空本地新增内容？',
        body: '会删除本浏览器里的自定义话术、删除标记和导入数据。基础话术会恢复；「我的回复」和设置保留。建议先导出备份。',
        okText: '清空', danger: true,
        onOk: async function () {
          DDCStore.resetLocal();
          state.scenarios = await DDCStore.getScenarios();
          refreshNavCounts();
          toast('本地新增已清空');
          window.location.hash = '#/library';
          render();
        }
      });
      return;
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.var) {
      state.detailVars[el.dataset.var] = el.value;
    }
    if (el.dataset && el.dataset.replyVar) {
      state.reply.vars[el.dataset.replyVar] = el.value;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if ($('#modalRoot').innerHTML) { closeModal(); return; }
      if (state.detailId) { location.hash = '#/library'; return; }
    }
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      var gs = $('#globalSearch');
      if (gs) { e.preventDefault(); gs.focus(); }
      else { location.hash = '#/library'; state.focusLibSearch = true; }
    }
  });

  document.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image/') === 0) {
        var file = items[i].getAsFile();
        if (!file) continue;
        e.preventDefault();
        if (state.route !== 'reply') {
          location.hash = '#/reply';
          setTimeout(function () { handleImage(file); }, 220);
        } else {
          handleImage(file);
        }
        return;
      }
    }
  });

  var gsEnter = $('#globalSearch');
  if (gsEnter) {
    gsEnter.addEventListener('input', function () { state.filter.query = gsEnter.value; });
    gsEnter.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        state.filter.query = gsEnter.value;
        state.filter.country = 'ALL';
        if (state.route === 'library') { viewLibrary(); window.hydrateIcons($('#view')); }
        else location.hash = '#/library';
      }
    });
  }

  var menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', function () { document.getElementById('app').classList.toggle('nav-open'); });
  var backdrop = $('#moBackdrop');
  if (backdrop) backdrop.addEventListener('click', function () { document.getElementById('app').classList.remove('nav-open'); });

  function copyDetail(plain) {
    var s = byId(state.detailId);
    if (!s) return;
    var list = scriptsOf(s);
    var sc = list[state.detailTab];
    if (!sc) return;
    var text = sc.text || '';
    if (!plain) {
      text = DDCEngine.fillDefaults(text, { settings: state.settings });
      text = DDCEngine.applyVars(text, state.detailVars);
    }
    copyText(text).then(function (ok) {
      if (!ok) { toast('复制失败，请手动选择文字', true); return; }
      var missing = DDCEngine.missingTokens(text);
      toast(missing.length ? '已复制；还有 ' + missing.length + ' 个变量未填：' + missing.join('、') : '已复制，可直接粘贴到 WhatsApp');
    });
  }

  /* ---------------- boot ---------------- */

  async function boot() {
    try {
      await DDCStore.init();
      state.mode = DDCStore.mode;
      state.settings = DDCStore.getSettings();
      state.ai = DDCStore.aiReady || (state.mode === 'server' && !!state.settings.aiKey);
      state.saved = DDCStore.getSaved();
      state.scenarios = await DDCStore.getScenarios();
      state.archives = await DDCStore.getArchives();
      state.policy = await DDCStore.getPolicy();
      state.filter.country = 'ALL';
      render();
    } catch (e) {
      console.error(e);
      $('#view').innerHTML = '<div class="notice danger" style="margin:40px 0">' + window.icon('alert') +
        '<div><b>载入失败：' + esc(e.message || e) + '</b><br>请刷新页面，或检查 data/ 目录与网络。静态模式需要能访问 data/scenarios-*.json。</div></div>';
      window.hydrateIcons($('#view'));
    }
  }

  window.addEventListener('hashchange', function () { state.editor.loadedFor = null; render(); });
  window.addEventListener('load', boot);
})();
