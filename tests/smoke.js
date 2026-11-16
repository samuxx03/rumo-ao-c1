const { JSDOM } = require('jsdom');
const fs = require('fs');
const dir = process.argv[2] || require('path').join(__dirname, '..');
let html = fs.readFileSync(dir + '/index.html', 'utf8')
  .replace('<script src="data.js"></script>', '<script>' + fs.readFileSync(dir + '/data.js', 'utf8') + '</script>')
  .replace('<script src="lessons.js"></script>', '<script>' + fs.readFileSync(dir + '/lessons.js', 'utf8') + '</script>')
  .replace('<script src="app.js"></script>', '<script>' + fs.readFileSync(dir + '/app.js', 'utf8') + '</script>');
const errors = [];
const store = {};
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/#hoje', pretendToBeVisual: true,
  beforeParse(w) {
    w.addEventListener('error', e => errors.push(e.error || e.message));
    w.scrollTo = () => {}; w.navigator.clipboard = { writeText: async () => {} };
    const sample = async (input, opts) => {
      const text = 'Oi! Tudo bem, e você? Bora tomar uma? ✏️ Eu fui ao cinema (ir a).';
      if (opts && opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: false };
    };
    sample.json = async (prompt) => {
      if (prompt.includes('They clicked on')) return { pt: 'acabar em pizza', traducao: 'to end with no consequences', definicao: 'terminar sem punição', reg: 'informal', es: 'quedar en nada', frase_en: 'It all ended up with nobody punished.', nota: '' };
      if (prompt.includes('word family')) return { familia: [{ pt: 'decidir', classe: 'verbo', en: 'to decide', ex: 'Decidi ficar.' }, { pt: 'decisão', classe: 'substantivo', en: 'decision', ex: 'Foi uma boa decisão.' }] };
      if (prompt.includes('dictation exercise')) return { pt: 'Se eu tivesse tempo, iria ao cinema com você amanhã.', en: 'If I had time...' };
      if (prompt.includes('fill-in-the-blank exercises from this') || prompt.includes('keeps making this type of mistake')) return { items: [{ q: 'Eu ___ (ir) ao cinema.', a: ['fui'], x: 'perfeito' }, { q: 'Ela ___ (ter) razão.', a: ['tinha'], x: 'x' }] };
      if (prompt.includes('Quizlet list')) { const items = [...prompt.matchAll(/^\d+\. (.+) = (.+)$/gm)]; return { cards: items.map(m => ({ pt: m[1], en: m[2], ex: 'Exemplo com ' + m[1] + '.', exEn: 'Example.', reg: 'informal', note: '' })) }; }
      if (prompt.includes('"sentidos"')) return { pt: 'dar ênfase a', classe: 'expressão', reg: 'formal', sentidos: [{ en: 'to emphasize', es: 'hacer hincapié en' }], exemplos: [{ pt: 'O relatório dá ênfase à educação.', en: 'The report emphasizes education.', reg: 'formal' }, { pt: 'Ele deu ênfase ao prazo.', en: 'He stressed the deadline.' }], colocacoes: ['dar ênfase especial'], sinonimos: ['enfatizar', { pt: 'frisar', reg: 'formal' }], mais_formal: ['salientar'], mais_informal: ['bater na tecla'], cuidado: '', nota: 'Equivale a hacer hincapié.' };
      if (prompt.includes('"cards"')) return { cards: [{ pt: 'dar zebra', en: 'unexpected result', ex: 'Deu zebra no jogo.', exEn: 'Upset in the game.', reg: 'informal', note: '' }, { pt: 'mão de vaca', en: 'stingy', ex: '', exEn: '', reg: 'informal' }] };
      if (prompt.includes('"items"')) return { items: [{ q: 'Se eu ___ (saber), te falo.', a: ['souber'], x: 'fut subj' }, { q: 'bad item', a: ['x'] }] };
      if (prompt.includes('"boas"')) return { alvos: prompt.includes('"alvos"') ? [{ pt: 'ressaltar', usado: true, comentario: 'ok' }, { pt: 'frisar', usado: false }] : undefined, nivel: 'B2+', resumo: 'Bom.', boas: ['fluência'], erros: [{ original: 'eu fui no', correcao: 'eu fui ao', tipo: 'regência', explicacao: 'ir a' }], expressoes: [{ pt: 'partiu', en: "let's go", porque: 'gíria' }] };
      return { nivel: 'B2', resumo: 'Bom texto.', erros: [{ original: 'embora é', correcao: 'embora seja', tipo: 'subjuntivo', explicacao: 'embora + subj' }, { original: 'same', correcao: 'same', tipo: 'x' }], corrigido: 'Texto corrigido.', versao_c1: 'Versão C1.', sugestoes: [{ pt: 'no entanto', en: 'however', porque: 'formal' }] };
    };
    const docs = {};
    const db = { collection: (p) => ({ doc: (id) => ({ get: async () => ({ exists: !!docs[p + '/' + id], data: () => docs[p + '/' + id] }), set: async (d) => { docs[p + '/' + id] = JSON.parse(JSON.stringify(d)); }, delete: async () => { delete docs[p + '/' + id]; } }) }) };
    const caps = { sample, db, user: { id: async () => 'u1' }, tts: { speak: async () => {}, stop() {} }, dictation: { onFinal(cb) { w.__mic.final = cb; }, onPartial() {}, onState(cb) { w.__mic.state = cb; }, start: async () => { w.__mic.state && w.__mic.state({ state: 'listening' }); }, stop: async () => { w.__mic.state && w.__mic.state({ state: 'idle', reason: 'stopped' }); } } };
    w.__mic = {};
    w.claude = { use: async (n) => caps[n] || null };
    w.__docs = docs;
  } });
const w = dom.window, d = w.document;
const tick = (ms = 30) => new Promise(r => setTimeout(r, ms));
const click = (el) => { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const btn = (txt) => [...d.querySelectorAll('button,a')].find(b => b.textContent.includes(txt));
(async () => {
  await tick(100);
  const check = (label, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); if (!cond) process.exitCode = 1; };
  check('today view renders', d.querySelector('main').textContent.includes('Plano de hoje'));
  check('status chips', d.getElementById('status').textContent.includes('para revisar'));
  // cards
  w.location.hash = 'cartoes'; await tick();
  check('cards start screen', !!btn('Começar a revisão'));
  click(btn('Começar a revisão')); await tick();
  check('card shows', !!d.querySelector('.card .front'));
  click(btn('Mostrar resposta')); await tick();
  check('grades show', d.querySelectorAll('.grades button').length === 4);
  click(btn('Mais exemplos')); await tick(80);
  check('explain output', d.querySelector('.ai-out') && d.querySelector('.ai-out').textContent.length > 3);
  click(d.querySelector('.grades .g2')); await tick();
  check('next card after grade', !!d.querySelector('.card .front'));
  // keyboard
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: ' ' })); await tick();
  d.dispatchEvent(new w.KeyboardEvent('keydown', { key: '1' })); await tick();
  // explore & import
  click(btn('Explorar')); await tick();
  check('explore list', d.querySelectorAll('.list .item').length > 50);
  const q = d.getElementById('explore-q'); q.value = 'grana'; q.dispatchEvent(new w.Event('input')); await tick();
  check('explore search', d.querySelectorAll('.list .item').length >= 1 && d.querySelector('.list').textContent.includes('grana'));
  click(btn('Adicionar e importar')); await tick();
  const ta = d.getElementById('import-text'); ta.value = 'word,translation\nzebra,upset'; ta.dispatchEvent(new w.Event('input'));
  click(btn('Extrair cartões')); await tick(80);
  check('import preview', d.querySelectorAll('input[type=checkbox][id^=imp-]').length === 2);
  click(btn('Adicionar os selecionados')); await tick();
  // quizlet
  const qt = d.getElementById('quizlet-text');
  const qtext = ['to manage, cope\tdar conta', 'nonsense\tpapo furado', 'awesome\tmassa', 'the elephant in the room\to elefante na sala', 'dude\tcara'].join('\n');
  qt.value = qtext; qt.dispatchEvent(new w.Event('input'));
  click(btn('Pré-visualizar')); await tick();
  check('quizlet preview detects PT on right', d.querySelector('main').textContent.includes('Português detectado à direita') && d.querySelector('main').textContent.includes('5 cartões encontrados'));
  click(btn('Importar 5 cartões')); await tick(200);
  w.location.hash = 'hoje'; await tick(); w.location.hash = 'cartoes'; await tick();
  click(btn('Explorar')); await tick();
  const eq = d.getElementById('explore-q'); eq.value = 'elefante'; eq.dispatchEvent(new w.Event('input')); await tick();
  check('quizlet cards enriched + searchable', d.querySelector('.list').textContent.includes('Exemplo com o elefante na sala'));
  click(btn('Adicionar e importar')); await tick();
  const qt2 = d.getElementById('quizlet-text'); qt2.value = 'cara\tdude\nmassa\tawesome'; qt2.dispatchEvent(new w.Event('input'));
  click(btn('Pré-visualizar')); await tick();
  check('quizlet left side + duplicates flagged', d.querySelector('main').textContent.includes('à esquerda') && d.querySelector('main').textContent.includes('2 já existem'));
  // grammar
  w.location.hash = 'gramatica'; await tick();
  check('topics', d.querySelectorAll('.topic').length >= 12);
  click([...[...d.querySelectorAll('.topic')].find(t => t.textContent.includes('Crase')).querySelectorAll('button')].find(b => b.textContent === 'Praticar')); await tick();
  const inp = d.getElementById('drill-input');
  check('drill input', !!inp);
  inp.value = 'zzz'; click(btn('Conferir')); await tick();
  check('wrong feedback', d.querySelector('.fb.no') !== null);
  click(btn('Na verdade acertei')); await tick();
  check('override', d.querySelector('.fb.ok') !== null);
  click(btn('+ 6 novos')); await tick(80);
  for (let i = 0; i < 80; i++) { const n = d.getElementById('drill-next'); const ii = d.getElementById('drill-input'); const opt = d.querySelector('.opts button:not([disabled])'); if (ii && !ii.disabled) { ii.value = 'a'; click(btn('Conferir')); await tick(); } else if (opt) { click(opt); await tick(); } else if (n) { click(n); await tick(); } else break; }
  check('drill result screen', d.querySelector('main').textContent.includes('certos'));
  click(btn('Sair') || btn('Escolher outro tema')); await tick();
  click(btn('Treino misto')); await tick();
  check('mix drill', !!d.querySelector('.drill-q'));
  // tutor writing
  w.location.hash = 'tutor'; await tick();
  const wt = d.getElementById('write-text'); wt.value = 'Embora é difícil, eu acho que o trabalho remoto vale a pena para muita gente hoje.'; wt.dispatchEvent(new w.Event('input'));
  click(btn('Corrigir com IA')); await tick(80);
  check('correction shown', d.querySelector('main').textContent.includes('embora seja') && d.querySelector('main').textContent.includes('Versão C1'));
  click(btn('+ Cartão')); await tick();
  // chat
  click(btn('Conversar')); await tick();
  click([...d.querySelectorAll('.topic')].find(t => t.textContent.includes('Boteco'))); await tick();
  const ci = d.getElementById('chat-input');
  ci.value = 'Eu fui no cinema'; ci.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await tick(80);
  const ci2 = d.getElementById('chat-input'); ci2.value = 'Foi legal'; click(btn('Enviar')); await tick(80);
  check('chat messages', d.querySelectorAll('.msg').length === 5);
  click(btn('Terminar e ver correções')); await tick(80);
  check('chat feedback', d.querySelector('main').textContent.includes('O que você fez bem'));
  // errors view
  w.location.hash = 'erros'; await tick();
  check('errors list', d.querySelector('main').textContent.includes('eu fui ao') && d.querySelector('main').textContent.includes('subjuntivo'));
  check('identical error filtered', !d.querySelector('main').textContent.includes('same → same'));
  click(btn('Praticar meus erros')); await tick(50);
  check('error drill', d.querySelector('.drill-q') && d.querySelector('.drill-q').textContent.includes('Corrija'));
  // lessons
  w.location.hash = 'gramatica'; await tick();
  click(btn('Sair') || btn('Escolher outro tema')); await tick();
  const lb = [...d.querySelectorAll('.topic')].find(t => t.textContent.includes('Infinitivo pessoal')).querySelector('button');
  click(lb); await tick();
  check('lesson renders table+mistakes', d.querySelector('.lesson table') && d.querySelector('main').textContent.includes('Erros comuns'));
  click(btn('Praticar agora')); await tick();
  check('lesson → practice', !!d.getElementById('drill-input'));
  click(btn('Ver a lição')); await tick();
  check('drill → lesson', !!d.querySelector('.lesson'));
  click(btn('Voltar aos exercícios')); await tick();
  check('back to drill', !!d.getElementById('drill-input'));
  // all lessons render
  for (const id of Object.keys(w.PT_LESSONS)) { /* rendered via topic buttons */ }
  const topicsWithLesson = [...d.querySelectorAll('.topic')].length;
  // dictionary
  w.location.hash = 'dicionario'; await tick();
  const dq = d.getElementById('dict-q'); dq.value = 'hacer hincapié en';
  dq.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await tick(80);
  check('dictionary result', d.querySelector('main').textContent.includes('dar ênfase a') && d.querySelectorAll('.dict .example').length === 2);
  click(btn('+ Salvar como cartão')); await tick();
  const dq2 = d.getElementById('dict-q'); dq2.value = 'ressaltar'; dq2.dispatchEvent(new w.Event('input'));
  click([...d.querySelectorAll('.deckchip')].find(b => b.textContent.startsWith('frisar'))); await tick(80);
  check('dictionary chip lookup + local match', d.querySelector('main').textContent.includes('Recentes'));
  // challenge + per-message correction
  w.location.hash = 'tutor'; await tick();
  click(btn('Conversar')); await tick();
  if (d.querySelector('.msg')) { click(btn('Nova conversa') || btn('Sair')); await tick(); }
  check('challenge card', !!d.querySelector('.challenge') && d.querySelectorAll('.challenge .deckchip').length === 4);
  d.getElementById('chat-correct').click(); await tick();
  click(btn('Começar o desafio')); await tick();
  const c1 = d.getElementById('chat-input'); c1.value = 'Eu fui no cinema'; click(btn('Enviar')); await tick(80);
  check('fix line rendered', !!d.querySelector('.msg.ai .fixline'));
  const c2 = d.getElementById('chat-input'); c2.value = 'Cabe ressaltar que sim'; click(btn('Enviar')); await tick(80);
  click(btn('Terminar e ver correções')); await tick(80);
  check('challenge targets feedback', d.querySelector('main').textContent.includes('Desafio do dia: 1/2 alvos'));
  // ouvir & ler
  w.location.hash = 'ouvir'; await tick();
  click(btn('Começar')); await tick(80);
  const di = d.getElementById('ditado-input');
  check('dictation sentence ready', !!di);
  di.value = 'Totally wrong words here'; di.dispatchEvent(new w.Event('input')); click(btn('Conferir')); await tick();
  check('dictation diff shown', !!d.querySelector('.diff') && d.querySelectorAll('.dw-miss').length > 0);
  const sel = d.getElementById('ditado-src'); sel.value = 'ai'; sel.dispatchEvent(new w.Event('change')); await tick();
  click(btn('Nova frase')); await tick(80);
  const di2 = d.getElementById('ditado-input'); di2.value = 'Se eu tivesse tempo iria ao cinema com voce amanha'; di2.dispatchEvent(new w.Event('input')); click(btn('Conferir')); await tick();
  check('dictation AI sentence + accent marks', d.querySelector('.fb b').textContent.includes('%') && d.querySelectorAll('.dw-acc').length === 2);
  click(btn('Shadowing')); await tick();
  click(btn('Começar')); await tick(50);
  const recBtn = [...d.querySelectorAll('button')].find(b => b.textContent.includes('Gravar minha voz'));
  click(recBtn); await tick(30);
  const target = d.querySelector('.drill-q').textContent;
  w.__mic.final({ text: target }); click(recBtn); await tick(400);
  check('shadowing scored 100%', d.querySelector('main').textContent.includes('100% reconhecido'));
  click(btn('Leitor')); await tick();
  const rb = d.getElementById('rd-body'); rb.value = 'A investigação sobre o escândalo acabou em pizza. Ninguém foi punido, e os deputados voltaram ao trabalho como se nada tivesse acontecido.'; rb.dispatchEvent(new w.Event('input'));
  const ry = d.getElementById('rd-yt'); ry.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; ry.dispatchEvent(new w.Event('input'));
  click(btn('Salvar e ler')); await tick();
  check('reader opened with words', d.querySelectorAll('.reader-text .w').length > 10 && d.querySelector('main').textContent.includes('Abrir o vídeo no YouTube'));
  click([...d.querySelectorAll('.reader-text .w')].find(x => x.textContent === 'pizza.')); await tick(80);
  check('lookup popup 1-2-3', d.querySelector('.lookup') && d.querySelector('.lookup').textContent.includes('Tradução') && d.querySelector('.lookup').textContent.includes('Definição'));
  click(btn('Adicionar aos cartões')); await tick();
  click(btn('Exercícios deste texto')); await tick(80);
  check('text drills start', d.querySelector('main').textContent.includes('Exercícios do seu texto') && !!d.getElementById('drill-input'));
  // word family in dictionary
  w.location.hash = 'dicionario'; await tick();
  click(btn('Família de palavras')); await tick(80);
  check('word family list', d.querySelector('main').textContent.includes('decisão'));
  // error-type drills
  w.location.hash = 'erros'; await tick();
  click(btn('Treinar')); await tick(100);
  check('error-type drills', d.querySelector('main').textContent.includes('Seus erros de'));
  // spoken lesson
  w.location.hash = 'gramatica'; await tick();
  if (btn('Sair')) { click(btn('Sair')); await tick(); }
  const fl = [...d.querySelectorAll('.topic')].find(t => t.textContent.includes('Como os brasileiros falam'));
  click(fl.querySelector('button')); await tick();
  check('fala lesson', d.querySelector('main').textContent.includes('The same idea in four registers'));
  // settings
  click(d.getElementById('settingsBtn')); await tick();
  check('settings open', !!d.querySelector('.overlay') && d.querySelector('.overlay').textContent.includes('Claude account'));
  click(btn('Fechar')); await tick();
  w.location.hash = 'hoje'; await tick();
  check('today goals progress', d.querySelector('main').textContent.includes('1/1'));
  await tick(1700);
  check('saved to db', !!w.__docs['data/users/u1/progress'] && Object.keys(w.__docs['data/users/u1/progress'].srs).length >= 2);
  const prog = w.__docs['data/users/u1/progress'];
  check('progress doc has no custom array', prog && !('custom' in prog) && prog.customShards >= 1);
  check('custom shard saved', (w.__docs['data/users/u1/custom-0'] || {}).cards && w.__docs['data/users/u1/custom-0'].cards.some(c => c.pt === 'massa'));
  check('texts doc saved', (w.__docs['data/users/u1/texts'] || {}).items && w.__docs['data/users/u1/texts'].items.length === 1);
  check('listening counted today', Object.values(w.__docs['data/users/u1/progress'].days).some(x => x.l >= 3));
  check('no runtime errors', errors.length === 0);
  if (errors.length) console.log(errors);
  const t = w.__rumo;
  const s1 = t.schedule(null, 2, Date.now()); const s2 = t.schedule(s1, 2); const s3 = t.schedule(s2, 2);
  check('srs intervals 1,3,~8', s1.ivl === 1 && s2.ivl === 3 && s3.ivl >= 7 && s3.ivl <= 8);
  check('again resets', t.schedule(s3, 0).ivl === 0);
  check('crase strict', t.checkAnswer({ t: 'crase', a: ['à'] }, 'a') === 'no');
  check('accent lenient', t.checkAnswer({ t: 'formacao', a: ['impossível'] }, 'impossivel') === 'accent');
  check('case/punct', t.checkAnswer({ t: 'x', a: ['tenho dormido'] }, ' Tenho  dormido. ') === 'ok');
  w.close();
})().catch(e => { console.error('TEST CRASH', e); process.exit(1); });
