const { JSDOM } = require('jsdom'); const fs = require('fs'); const dir = process.argv[2] || require('path').join(__dirname, '..');
let html = fs.readFileSync(dir + '/index.html', 'utf8');
for (const f of ['data.js','lessons.js','app.js']) html = html.replace(`<script src="${f}"></script>`, '<script>' + fs.readFileSync(dir + '/' + f, 'utf8') + '</script>');
const docs = { 'data/users/u1/progress': { v: 1, updatedAt: Date.now(), start: '2026-11-16', newPerDay: 15, srs: {}, customShards: 2, days: {}, errors: [], drillStats: {}, aiDrills: {}, lookups: [], dict: {}, decksOff: [] },
  'data/users/u1/custom-0': { cards: [{ id: 'meus:abacaxi', pt: 'descascar o abacaxi', en: 'to deal with a tough problem', reg: 'informal' }] },
  'data/users/u1/custom-1': { cards: [{ id: 'meus:jacare', pt: 'pagar mico de novo', en: 'test', reg: 'informal' }] } };
const errors = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/#cartoes', pretendToBeVisual: true, beforeParse(w) {
  w.addEventListener('error', e => errors.push(e.error || e.message)); w.scrollTo = () => {};
  const db = { collection: (p) => ({ doc: (id) => ({ get: async () => ({ exists: !!docs[p + '/' + id], data: () => docs[p + '/' + id] }), set: async (d) => { docs[p + '/' + id] = d; }, delete: async () => { delete docs[p + '/' + id]; } }) }) };
  w.claude = { use: async (n) => ({ db, user: { id: async () => 'u1' } })[n] || null };
} });
setTimeout(() => { const d = dom.window.document;
  [...d.querySelectorAll('button')].find(b => b.textContent === 'Explorar').click(); const sel = d.getElementById('explore-deck'); if (sel) { sel.value = 'meus'; sel.dispatchEvent(new dom.window.Event('change')); }
  setTimeout(() => { const sel = d.getElementById('explore-deck'); sel.value = 'meus'; sel.dispatchEvent(new dom.window.Event('change')); const t = d.querySelector('.list').textContent;
    console.log(t.includes('descascar o abacaxi') && t.includes('pagar mico de novo') ? 'PASS restore from 2 shards' : 'FAIL restore'); console.log('errors', errors.length); dom.window.close(); }, 50); }, 300);
