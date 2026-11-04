#!/usr/bin/env node
/**
 * CareDesk server — zero dependencies.
 * - Serves the static site
 * - JSON CRUD for scenarios (seed data + local overrides)
 * - Optional AI proxy (OpenAI-compatible) for English reply generation
 *
 * Run:  node server/index.js
 * Env:  PORT, ADMIN_TOKEN, AI_API_KEY, AI_BASE_URL, AI_MODEL
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SERVER_DATA = path.join(__dirname, 'data');
const DB_PATH = path.join(SERVER_DATA, 'db.json');
const PORT = Number(process.env.PORT) || 4173;
const VERSION = '1.0.0';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadDB() {
  ensureDir(SERVER_DATA);
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    return {
      custom: db.custom && typeof db.custom === 'object' ? db.custom : {},
      deleted: Array.isArray(db.deleted) ? db.deleted : [],
      archives: Array.isArray(db.archives) ? db.archives : [],
      meta: db.meta || { version: 1 }
    };
  } catch (e) {
    if (fs.existsSync(DB_PATH)) {
      try { fs.copyFileSync(DB_PATH, DB_PATH + '.bak-' + Date.now()); } catch (_) {}
    }
    return { custom: {}, deleted: [], archives: [], meta: { version: 1 } };
  }
}

function saveDB(db) {
  ensureDir(SERVER_DATA);
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_PATH);
}

function readSeed() {
  const files = ['scenarios-au.json', 'scenarios-ca.json', 'scenarios-us.json'];
  const list = [];
  for (const f of files) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
      if (doc && Array.isArray(doc.scenarios)) list.push(...doc.scenarios);
    } catch (e) { /* file not generated yet */ }
  }
  return list;
}

function readPolicy() {
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'policy-snapshot.json'), 'utf8'));
    if (Array.isArray(doc)) return doc;
    if (doc && Array.isArray(doc.facts)) return doc.facts;
    return [];
  } catch (e) { return []; }
}

function mergedScenarios() {
  const base = readSeed();
  const db = loadDB();
  const map = new Map();
  base.forEach(s => map.set(s.id, s));
  Object.keys(db.custom).forEach(id => map.set(id, db.custom[id]));
  db.deleted.forEach(id => map.delete(id));
  const order = { AU: 0, CA: 1, US: 2 };
  return Array.from(map.values()).sort((a, b) => {
    const d = (order[a.country] ?? 9) - (order[b.country] ?? 9);
    if (d !== 0) return d;
    return String(a.id).localeCompare(String(b.id));
  });
}

function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('请求体过大'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(Object.assign(new Error('JSON 解析失败'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) return true;
  const token = req.headers['x-admin-token'] || '';
  if (safeEqual(token, ADMIN_TOKEN)) return true;
  sendJSON(res, 401, { error: '管理口令不正确，请在设置里填写 ADMIN_TOKEN' });
  return false;
}

function validateScenario(s) {
  if (!s || typeof s !== 'object') return '缺少场景数据';
  if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) return 'id 只能使用小写字母、数字和连字符';
  if (!s.country || ['AU', 'CA', 'US'].indexOf(s.country) === -1) return 'country 必须是 AU / CA / US';
  if (!s.title_zh || !s.title_en) return '中英文标题不能为空';
  if (!Array.isArray(s.scripts) || s.scripts.length < 1) return '至少需要一条英文话术';
  return null;
}

/* ---------------- AI ---------------- */

const COUNTRY_POLICY = {
  AU: 'Australia: ABF clearance, DAFF biosecurity (BMSB seasonal measures, ISPM15 timber packaging), GST 10%, import declaration above AUD 1,000. Key ports: Sydney, Melbourne, Brisbane, Fremantle.',
  CA: 'Canada: CBSA clearance, CARM / Release Prior to Payment, GST 5% plus provincial tax, CFIA/Health Canada for food and cosmetics. Key gateways: Vancouver, Prince Rupert, Toronto, Montreal.',
  US: 'United States: CBP clearance, ISF 10+2 filed at least 24h before loading, Section 301 and IEEPA tariffs, de minimis suspended for all countries since 29 Aug 2025, PGA holds (FDA/FCC/CPSC/USDA). Key gateways: LA/Long Beach, New York, Savannah.'
};

function aiConfig(req) {
  const key = (req.headers['x-ai-key'] || process.env.AI_API_KEY || '').trim();
  let base = (req.headers['x-ai-base'] || process.env.AI_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/+$/, '');
  const model = (req.headers['x-ai-model'] || process.env.AI_MODEL || 'deepseek-chat').trim();
  if (!key) return { error: '未配置 AI_API_KEY。请在服务端环境变量或设置页填写后再试。' };
  if (!/^https:\/\//i.test(base)) return { error: 'AI Base URL 必须是 https:// 开头' };
  return { key, base, model };
}

async function callAI(cfg, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(cfg.base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.key },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* keep raw */ }
    if (!res.ok) {
      const msg = (data && data.error && (data.error.message || data.error)) || text.slice(0, 300);
      throw Object.assign(new Error('AI 接口返回 ' + res.status + '：' + msg), { status: 502 });
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content : '';
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function parseAIReplies(content) {
  if (!content) throw new Error('AI 没有返回内容');
  let cleaned = String(content).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  let obj;
  try { obj = JSON.parse(cleaned); }
  catch (e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI 返回格式无法解析');
    obj = JSON.parse(m[0]);
  }
  const list = Array.isArray(obj) ? obj : obj.replies;
  if (!Array.isArray(list)) throw new Error('AI 返回缺少 replies 数组');
  return list.slice(0, 3).map((r, i) => ({
    tone: ['warm', 'standard', 'concise'][i] || 'standard',
    label: ['共情版', '标准版', '简洁版'][i] || 'AI 版本',
    text: String(r.text || r.reply || r.content || '').trim()
  })).filter(r => r.text);
}

async function handleAIReply(req, res) {
  const cfg = aiConfig(req);
  if (cfg.error) return sendJSON(res, 400, { error: cfg.error });
  const body = await readBody(req);
  const customerText = String(body.text || '').trim();
  if (!customerText) return sendJSON(res, 400, { error: '缺少客户原话' });
  const country = ['AU', 'CA', 'US'].includes(body.country) ? body.country : 'AU';
  const framework = body.framework || {};
  const guardrails = Array.isArray(body.guardrails) ? body.guardrails : [];

  const system = [
    'You are a senior after-sales manager at a China-based freight forwarder specialising in DDP LCL (consolidated sea freight) to ' + country + '.',
    'Write WhatsApp-ready English replies for the customer message provided.',
    'Every reply must follow this five-part flow: empathy, verified facts, plan (action + owner + timing), sync (when you will update next), reassurance.',
    'Rules: 80-140 words each; 2-4 short paragraphs; plain conversational English; no markdown, no bullet lists, no subject line; no "Dear Sir/Madam"; no "Please be patient"; no "kindly note"; no "as per".',
    'Never promise a specific release date, a refund, compensation, or an outcome. Never suggest under-declaring value, changing HS codes, splitting a shipment to avoid duty, or altering invoices. Never blame customs, the carrier, or the customer.',
    'Use placeholders exactly in double curly braces when a shipment detail is unknown: {{customer_name}}, {{container_no}}, {{bill_no}}, {{port}}, {{eta_date}}, {{next_update_time}}, {{agent_name}}, {{company_name}}, {{amount}}.',
    'Ground the replies in the country context below. Do not invent shipment-specific facts (container numbers, dates, amounts, inspection results).',
    'Country context: ' + (COUNTRY_POLICY[country] || COUNTRY_POLICY.AU),
    'Scenario: ' + (body.scenarioTitle || 'general after-sales issue') + '.',
    'Internal framework (Chinese, for your understanding): ' + JSON.stringify(framework),
    'Do not say or imply: ' + (guardrails.join('; ') || 'none specified'),
    'Return ONLY valid JSON: {"replies":[{"tone":"warm","label":"共情版","text":"..."},{"tone":"standard","label":"标准版","text":"..."},{"tone":"concise","label":"简洁版","text":"..."}]}'
  ].join('\n');

  try {
    const content = await callAI(cfg, {
      model: cfg.model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: 'Customer message:\n"""\n' + customerText.slice(0, 4000) + '\n"""' }
      ]
    });
    const replies = parseAIReplies(content);
    if (!replies.length) throw new Error('AI 没有生成有效回复');
    sendJSON(res, 200, { replies, model: cfg.model });
  } catch (e) {
    sendJSON(res, e.status || 502, { error: e.message || 'AI 生成失败' });
  }
}

/* ---------------- static ---------------- */

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      if (!path.extname(filePath)) {
        return fs.readFile(path.join(ROOT, 'index.html'), (e2, buf) => {
          if (e2) { res.writeHead(404); return res.end('Not found'); }
          res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
          res.end(buf);
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ['html', 'js', 'css', 'json'].includes(ext.slice(1)) ? 'no-cache' : 'public, max-age=300'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------------- router ---------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = url.pathname;

  if (pathname.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, x-ai-key, x-ai-base, x-ai-model');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    try {
      if (pathname === '/api/health' && req.method === 'GET') {
        return sendJSON(res, 200, {
          ok: true, mode: 'server', version: VERSION,
          ai: !!process.env.AI_API_KEY,
          admin: !!ADMIN_TOKEN,
          scenarios: mergedScenarios().length
        });
      }
      if (pathname === '/api/scenarios' && req.method === 'GET') {
        return sendJSON(res, 200, { scenarios: mergedScenarios(), mode: 'server' });
      }
      if (pathname === '/api/scenarios' && req.method === 'POST') {
        if (!requireAdmin(req, res)) return;
        const body = await readBody(req);
        const err = validateScenario(body);
        if (err) return sendJSON(res, 400, { error: err });
        const db = loadDB();
        db.custom[body.id] = body;
        db.deleted = db.deleted.filter(id => id !== body.id);
        saveDB(db);
        return sendJSON(res, 200, { scenario: body });
      }
      const m = pathname.match(/^\/api\/scenarios\/([a-z0-9-]+)$/);
      if (m && req.method === 'PUT') {
        if (!requireAdmin(req, res)) return;
        const body = await readBody(req);
        body.id = m[1];
        const err = validateScenario(body);
        if (err) return sendJSON(res, 400, { error: err });
        const db = loadDB();
        db.custom[body.id] = body;
        db.deleted = db.deleted.filter(id => id !== body.id);
        saveDB(db);
        return sendJSON(res, 200, { scenario: body });
      }
      if (m && req.method === 'DELETE') {
        if (!requireAdmin(req, res)) return;
        const db = loadDB();
        delete db.custom[m[1]];
        const isSeed = readSeed().some(s => s.id === m[1]);
        if (isSeed && !db.deleted.includes(m[1])) db.deleted.push(m[1]);
        saveDB(db);
        return sendJSON(res, 200, { ok: true, id: m[1] });
      }
      if (pathname === '/api/policy' && req.method === 'GET') {
        return sendJSON(res, 200, { facts: readPolicy() });
      }
      if (pathname === '/api/archives' && req.method === 'GET') {
        const db = loadDB();
        const list = db.archives.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        return sendJSON(res, 200, { archives: list });
      }
      if (pathname === '/api/archives' && req.method === 'POST') {
        if (!requireAdmin(req, res)) return;
        const body = await readBody(req);
        if (!body || !body.customerText || !Array.isArray(body.replies)) {
          return sendJSON(res, 400, { error: '归档需要 customerText 与 replies' });
        }
        const db = loadDB();
        const now = new Date().toISOString();
        const rec = Object.assign({}, body, {
          id: body.id || 'arc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          createdAt: body.createdAt || now,
          updatedAt: now
        });
        const idx = db.archives.findIndex(a => a.id === rec.id);
        if (idx >= 0) db.archives[idx] = rec; else db.archives.unshift(rec);
        db.archives = db.archives.slice(0, 500);
        saveDB(db);
        return sendJSON(res, 200, { archive: rec });
      }
      const ar = pathname.match(/^\/api\/archives\/([a-z0-9-]+)$/);
      if (ar && req.method === 'DELETE') {
        if (!requireAdmin(req, res)) return;
        const db = loadDB();
        db.archives = db.archives.filter(a => a.id !== ar[1]);
        saveDB(db);
        return sendJSON(res, 200, { ok: true });
      }
      if (pathname === '/api/ai/reply' && req.method === 'POST') {
        return await handleAIReply(req, res);
      }
      if (pathname === '/api/reset' && req.method === 'POST') {
        if (!requireAdmin(req, res)) return;
        saveDB({ custom: {}, deleted: [], archives: [], meta: { version: 1 } });
        return sendJSON(res, 200, { ok: true });
      }
      return sendJSON(res, 404, { error: 'API not found' });
    } catch (e) {
      console.error('[api]', e);
      return sendJSON(res, e.status || 500, { error: e.message || '服务端错误' });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); return res.end('Method not allowed');
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  CareDesk · DDP 售后话术中枢');
  console.log('  ---------------------------------------');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('  Mode:    server (JSON persistence)');
  console.log('  Data:    ' + DB_PATH);
  console.log('  Admin:   ' + (ADMIN_TOKEN ? 'enabled' : 'disabled (open writes)'));
  console.log('  AI:      ' + (process.env.AI_API_KEY ? 'env key configured' : 'no env key (settings override possible)'));
  console.log('');
});
