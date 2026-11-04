/* CareDesk — data store: server API with local (GitHub Pages) fallback */
(function () {
  'use strict';

  var K = {
    settings: 'ddc.settings.v1',
    custom: 'ddc.custom.v1',
    deleted: 'ddc.deleted.v1',
    saved: 'ddc.saved.v1',
    archives: 'ddc.archives.v1'
  };

  var DEFAULT_SETTINGS = {
    agentName: 'Alex',
    companyName: '',
    adminToken: '',
    aiBase: '',
    aiKey: '',
    aiModel: '',
    nextUpdateTime: '6pm',
    lastCountry: 'AU'
  };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn('storage full', e); }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(prefix) {
    return (prefix || 'sc') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  var mode = 'local';
  var aiReady = false;
  var serverVersion = '';
  var customMap = {};
  var deleted = [];
  var baseCache = null;
  var policyCache = null;

  function authHeader() {
    var s = read(K.settings, {});
    return s.adminToken ? { 'x-admin-token': s.adminToken } : {};
  }

  async function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, authHeader(), opts.headers || {});
    var res = await fetch('api/' + path, Object.assign({}, opts, { headers: headers }));
    var body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    if (!res.ok) {
      var msg = (body && (body.error || body.message)) || ('请求失败 (' + res.status + ')');
      var err = new Error(msg); err.status = res.status; err.body = body;
      throw err;
    }
    return body;
  }

  async function loadJson(path, fallback) {
    try {
      var res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) return fallback;
      return await res.json();
    } catch (e) { return fallback; }
  }

  async function init() {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 1600);
    try {
      var res = await fetch('api/health', { signal: ctrl.signal, cache: 'no-store' });
      if (res.ok) {
        var j = await res.json();
        if (j && j.ok) {
          mode = 'server';
          aiReady = !!j.ai;
          serverVersion = j.version || '';
        }
      }
    } catch (e) { /* static hosting */ }
    clearTimeout(timer);

    customMap = read(K.custom, {});
    deleted = read(K.deleted, []);
    return { mode: mode, ai: aiReady };
  }

  async function getScenarios() {
    if (mode === 'server') {
      try {
        var data = await api('scenarios');
        baseCache = data.scenarios || [];
        return clone(baseCache);
      } catch (e) {
        console.warn('server scenarios failed, falling back', e);
      }
    }
    if (!baseCache) {
      var files = ['au', 'ca', 'us'];
      var results = await Promise.all(files.map(function (c) {
        return loadJson('data/scenarios-' + c + '.json', null);
      }));
      var merged = [];
      results.forEach(function (doc) {
        if (doc && Array.isArray(doc.scenarios)) merged = merged.concat(doc.scenarios);
      });
      baseCache = merged;
    }
    return mergeLocal(baseCache);
  }

  function mergeLocal(base) {
    var map = {};
    base.forEach(function (s) { map[s.id] = s; });
    Object.keys(customMap).forEach(function (id) { map[id] = customMap[id]; });
    deleted.forEach(function (id) { delete map[id]; });
    return Object.keys(map).map(function (id) { return clone(map[id]); });
  }

  async function saveScenario(scenario) {
    scenario.updated_at = new Date().toISOString().slice(0, 10);
    if (mode === 'server') {
      var exists = baseCache && baseCache.some(function (s) { return s.id === scenario.id; });
      var data = await api(exists ? 'scenarios/' + encodeURIComponent(scenario.id) : 'scenarios', {
        method: exists ? 'PUT' : 'POST',
        body: JSON.stringify(scenario)
      });
      baseCache = null;
      return data.scenario || scenario;
    }
    customMap[scenario.id] = clone(scenario);
    deleted = deleted.filter(function (id) { return id !== scenario.id; });
    write(K.custom, customMap);
    write(K.deleted, deleted);
    baseCache = null;
    return scenario;
  }

  async function removeScenario(id) {
    if (mode === 'server') {
      await api('scenarios/' + encodeURIComponent(id), { method: 'DELETE' });
      baseCache = null;
      return true;
    }
    delete customMap[id];
    if (deleted.indexOf(id) === -1) {
      var isSeed = (baseCache || []).some(function (s) { return s.id === id; });
      if (isSeed) deleted.push(id);
    }
    write(K.custom, customMap);
    write(K.deleted, deleted);
    baseCache = null;
    return true;
  }

  async function getPolicy() {
    if (policyCache) return policyCache;
    var data = await loadJson('data/policy-snapshot.json', []);
    policyCache = Array.isArray(data) ? data : (data && data.facts) || [];
    return policyCache;
  }

  function getSettings() {
    return Object.assign({}, DEFAULT_SETTINGS, read(K.settings, {}));
  }
  function saveSettings(patch) {
    var next = Object.assign(getSettings(), patch);
    write(K.settings, next);
    return next;
  }

  function getSaved() {
    var list = read(K.saved, []);
    return Array.isArray(list) ? list : [];
  }
  function saveReply(reply) {
    var list = getSaved();
    list.unshift(Object.assign({ id: uid('reply'), createdAt: new Date().toISOString() }, reply));
    list = list.slice(0, 200);
    write(K.saved, list);
    return list;
  }
  function removeSaved(id) {
    var list = getSaved().filter(function (r) { return r.id !== id; });
    write(K.saved, list);
    return list;
  }

  async function getArchives() {
    if (mode === 'server') {
      try {
        var data = await api('archives');
        return data.archives || [];
      } catch (e) { console.warn('archives failed', e); }
    }
    var list = read(K.archives, []);
    return Array.isArray(list) ? list : [];
  }

  async function saveArchive(record) {
    if (mode === 'server') {
      var data = await api('archives', { method: 'POST', body: JSON.stringify(record) });
      return data.archive || record;
    }
    var list = read(K.archives, []);
    var idx = -1;
    list.forEach(function (a, i) { if (a.id === record.id) idx = i; });
    if (idx >= 0) list[idx] = Object.assign({}, list[idx], record, { updatedAt: new Date().toISOString() });
    else list.unshift(record);
    list = list.slice(0, 150);
    write(K.archives, list);
    return record;
  }

  async function removeArchive(id) {
    if (mode === 'server') {
      await api('archives/' + encodeURIComponent(id), { method: 'DELETE' });
      return true;
    }
    write(K.archives, read(K.archives, []).filter(function (a) { return a.id !== id; }));
    return true;
  }

  function exportData() {
    return {
      app: 'CareDesk',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: getSettings(),
      customScenarios: Object.keys(customMap).map(function (id) { return customMap[id]; }),
      deleted: deleted,
      savedReplies: getSaved()
    };
  }

  function importData(obj) {
    if (!obj || obj.app !== 'CareDesk') throw new Error('不是 CareDesk 导出的数据文件');
    var count = 0;
    (obj.customScenarios || []).forEach(function (s) {
      if (s && s.id) { customMap[s.id] = s; count++; }
    });
    if (Array.isArray(obj.deleted)) {
      obj.deleted.forEach(function (id) { if (deleted.indexOf(id) === -1) deleted.push(id); });
    }
    if (obj.settings) saveSettings(obj.settings);
    if (Array.isArray(obj.savedReplies)) {
      var merged = getSaved();
      obj.savedReplies.forEach(function (r) { if (r && r.id) merged.push(r); });
      write(K.saved, merged.slice(0, 300));
    }
    write(K.custom, customMap);
    write(K.deleted, deleted);
    baseCache = null;
    return count;
  }

  function resetLocal() {
    customMap = {};
    deleted = [];
    write(K.custom, {});
    write(K.deleted, []);
    baseCache = null;
  }

  function newId(country) {
    return (country || 'au').toLowerCase() + '-' + uid('x').slice(2);
  }

  window.DDCStore = {
    init: init,
    get mode() { return mode; },
    get aiReady() { return aiReady; },
    get version() { return serverVersion; },
    getScenarios: getScenarios,
    saveScenario: saveScenario,
    removeScenario: removeScenario,
    getPolicy: getPolicy,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getSaved: getSaved,
    saveReply: saveReply,
    removeSaved: removeSaved,
    getArchives: getArchives,
    saveArchive: saveArchive,
    removeArchive: removeArchive,
    exportData: exportData,
    importData: importData,
    resetLocal: resetLocal,
    newId: newId,
    uid: uid,
    read: read,
    write: write
  };
})();
