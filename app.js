/* Rumo ao C1 — app logic. No build step: plain browser JavaScript. */
(() => {
  "use strict";
  const D = window.PT_DATA;
  const DAY = 86400000;
  const PROGRAM_DAYS = 60;
  const VIEW = document.getElementById("view");
  const hasClaude = () => typeof window.claude === "object" && window.claude && typeof window.claude.use === "function";

  /* ---------------------------------------------------------------- utils */
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const parseDate = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1).getTime(); };
  const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const slug = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s || "").toLowerCase().normalize("NFC").replace(/[.!?;:,"“”«»()]+/g, "").replace(/\s+/g, " ").trim();
  const deaccent = (s) => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "");
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v; // trusted static markup only (icons)
        else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === "value") el.value = v;
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }

  const ICON = {
    speak: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>',
    mic: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/></svg>',
  };

  let toastTimer = null;
  function toast(msg) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const t = h("div", { class: "toast", role: "status" }, msg);
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  /* ---------------------------------------------------------------- state */
  const DEFAULT = () => ({
    v: 1, updatedAt: 0, start: dateStr(), newPerDay: 15, lang: "en", dir: "pt", autoSpeak: true,
    decksOff: [], srs: {}, custom: [], drillStats: {}, aiDrills: {}, days: {}, errors: [],
  });
  let S = DEFAULT();
  const today = () => { const k = dateStr(); return S.days[k] || (S.days[k] = { r: 0, n: 0, d: 0, dk: 0, t: 0, c: 0 }); };
  const dayNum = () => Math.max(1, Math.floor((startOfDay() - parseDate(S.start)) / DAY) + 1);

  const Store = {
    key: "rumo-ao-c1:v1", ref: null, mode: "local", saving: false, dirty: false, timer: null,
    loadLocal() { try { const raw = localStorage.getItem(this.key); return raw ? JSON.parse(raw) : null; } catch { return null; } },
    saveLocal() { try { localStorage.setItem(this.key, JSON.stringify(S)); } catch { /* storage unavailable */ } },
    async connect() {
      if (!hasClaude()) return;
      let db = null, user = null;
      try { [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]); } catch { return; }
      if (!db || !user) return;
      let id = null;
      try { id = await user.id(); } catch { id = null; }
      if (!id) return;
      try {
        this.ref = db.collection("data/users/" + id).doc("progress");
        const snap = await Promise.race([this.ref.get(), new Promise((_, rej) => setTimeout(() => rej({ code: "timeout" }), 10000))]);
        if (snap && snap.exists) {
          const remote = snap.data();
          if (remote && (remote.updatedAt || 0) > (S.updatedAt || 0)) { S = { ...DEFAULT(), ...JSON.parse(JSON.stringify(remote)) }; buildCards(); this.saveLocal(); }
          else if ((S.updatedAt || 0) > (remote?.updatedAt || 0)) { this.dirty = true; this.flush(); }
        } else if (S.updatedAt) { this.dirty = true; this.flush(); }
        this.mode = "cloud";
        renderStatus();
        route();
      } catch { this.ref = null; }
    },
    schedule() {
      this.dirty = true; this.saveLocal();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1500);
    },
    async flush() {
      if (!this.ref || this.saving || !this.dirty) return;
      this.saving = true; this.dirty = false;
      try { await this.ref.set(JSON.parse(JSON.stringify(S))); }
      catch (e) {
        if (e && (e.code === "invalid_argument" || e.code === "revoked" || e.code === "not_granted")) { this.ref = null; this.mode = "local"; renderStatus(); }
        else if (e && e.code === "quota_exceeded") { toast("Cloud storage is full. Delete some custom cards or errors."); }
        else this.dirty = true;
      } finally {
        this.saving = false;
        if (this.dirty && this.ref) { clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 4000); }
      }
    },
  };
  function save() { S.updatedAt = Date.now(); Store.schedule(); }

  /* ---------------------------------------------------------------- cards */
  const DECKS = [...D.decks.map((d) => ({ id: d.id, name: d.name, blurb: d.blurb })),
    { id: "meus", name: "Meus cartões", blurb: "Cards you added or imported: Language Reactor, subtitles, articles." }];
  const deckName = (id) => (DECKS.find((d) => d.id === id) || {}).name || id;
  let CARDS = [], BY_ID = {};
  function buildCards() {
    CARDS = [];
    for (const deck of D.decks) for (const c of deck.cards) CARDS.push({ ...c, id: deck.id + ":" + slug(c.pt), deck: deck.id });
    for (const c of S.custom || []) CARDS.push({ ...c, deck: "meus" });
    BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
  }
  function addCustom(card) {
    const pt = String(card.pt || "").trim(); const en = String(card.en || "").trim();
    if (!pt || !en) return false;
    let id = "meus:" + slug(pt);
    if (BY_ID[id]) return false;
    S.custom.push({ id, pt, en, ex: card.ex || "", exEn: card.exEn || "", reg: ["gíria", "informal", "neutro", "formal"].includes(card.reg) ? card.reg : "neutro", note: card.note || "", src: card.src || "" });
    buildCards(); save();
    return true;
  }

  /* SRS: an SM-2 style scheduler with day-based intervals. grade 0 again, 1 hard, 2 good, 3 easy */
  function schedule(prev, grade, now = Date.now()) {
    const s = prev ? { ...prev } : { reps: 0, ivl: 0, ease: 2.5, lapses: 0 };
    if (grade === 0) {
      if (s.reps > 0) s.lapses++;
      s.reps = 0; s.ivl = 0; s.ease = Math.max(1.3, s.ease - 0.2); s.due = now + 60000;
    } else {
      let ivl;
      if (s.reps === 0) ivl = grade === 3 ? 4 : 1;
      else if (s.reps === 1) ivl = grade === 1 ? 2 : grade === 2 ? 3 : 6;
      else ivl = grade === 1 ? Math.max(s.ivl + 1, Math.round(s.ivl * 1.2)) : grade === 2 ? Math.round(s.ivl * s.ease) : Math.round(s.ivl * s.ease * 1.3);
      if (grade === 1) s.ease = Math.max(1.3, s.ease - 0.15);
      if (grade === 3) s.ease = Math.min(3.2, s.ease + 0.15);
      s.ivl = clamp(ivl, 1, 180); s.reps++; s.due = startOfDay(now) + s.ivl * DAY;
    }
    s.last = now;
    return s;
  }
  const fmtIvl = (s) => (s.ivl === 0 ? "1 min" : s.ivl === 1 ? "1 dia" : s.ivl < 31 ? `${s.ivl} dias` : `${Math.round(s.ivl / 30)} m`);
  const deckOn = (c) => !S.decksOff.includes(c.deck);
  function dueCards() { const end = startOfDay() + DAY; return CARDS.filter((c) => deckOn(c) && S.srs[c.id] && S.srs[c.id].due < end); }
  function newCards(limit) {
    const left = limit ?? Math.max(0, S.newPerDay - today().n);
    const byDeck = {};
    for (const c of CARDS) if (deckOn(c) && !S.srs[c.id]) (byDeck[c.deck] ||= []).push(c);
    const lists = Object.entries(byDeck).sort(([a], [b]) => (a === "meus" ? -1 : b === "meus" ? 1 : 0)).map(([, l]) => l);
    const out = []; let i = 0;
    while (out.length < left && lists.some((l) => l.length)) { const l = lists[i % lists.length]; if (l.length) out.push(l.shift()); i++; }
    return out;
  }
  const statusOf = (c) => { const s = S.srs[c.id]; return !s ? "nova" : s.ivl >= 21 ? "dominada" : "em estudo"; };

  /* ---------------------------------------------------------------- AI */
  const AI = {
    sample: null, off: false,
    key() { try { return localStorage.getItem("rumo-ao-c1:apikey") || ""; } catch { return ""; } },
    available() { return !this.off && (!!this.sample || !!this.key()); },
    async init() {
      if (hasClaude()) { try { this.sample = await window.claude.use("sample"); } catch { this.sample = null; } }
      document.body.classList.toggle("no-ai", !this.available());
      if (currentView === "tutor" || currentView === "cartoes") route();
    },
    explainError(e) {
      const code = e && e.code;
      if (code === "not_granted") { this.off = true; return "The AI is turned off for this page. You can allow it again from the page's settings in Claude."; }
      if (code === "rate_limited") return "Too many AI requests right now. Wait a minute and try again.";
      if (code === "no_ai") return "AI isn't available here. If you're running the GitHub version, add an Anthropic API key in Settings.";
      if (code === "bad_json") return "The AI answer came back in an unexpected format. Try again.";
      return "The AI request failed" + (e && e.message ? `: ${String(e.message).slice(0, 140)}` : ".") + " Try again.";
    },
    async api(messages, maxTokens = 2500) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": this.key(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: maxTokens, messages }),
      });
      if (!res.ok) throw { code: res.status === 429 ? "rate_limited" : "api_error", message: await res.text() };
      const j = await res.json();
      return (j.content || []).map((c) => c.text || "").join("");
    },
    async text(input, onText) {
      if (this.off) throw { code: "not_granted" };
      if (this.sample) {
        const r = await this.sample(input, { cache: false, onText: onText ? ({ text }) => onText(text) : undefined });
        return r.text;
      }
      if (this.key()) {
        const msgs = typeof input === "string" ? [{ role: "user", content: input }] : input;
        const t = await this.api(msgs); if (onText) onText(t); return t;
      }
      throw { code: "no_ai" };
    },
    parse(t) {
      if (t && typeof t === "object") return t;
      const s = String(t || "");
      const start = s.search(/[[{]/); const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
      if (start < 0 || end < start) throw { code: "bad_json" };
      try { return JSON.parse(s.slice(start, end + 1)); } catch { throw { code: "bad_json" }; }
    },
    async json(prompt) {
      if (this.off) throw { code: "not_granted" };
      if (this.sample) {
        if (typeof this.sample.json === "function") return this.parse(await this.sample.json(prompt, { cache: false }));
        const r = await this.sample(prompt, { cache: false }); return this.parse(r.text);
      }
      if (this.key()) return this.parse(await this.api([{ role: "user", content: prompt }], 4000));
      throw { code: "no_ai" };
    },
  };
  const L = () => (S.lang === "pt" ? "simple Brazilian Portuguese" : "English");

  /* ---------------------------------------------------------------- voice */
  const Voice = {
    tts: null, synth: ("speechSynthesis" in window) ? window.speechSynthesis : null, ptVoice: null,
    async init() {
      if (this.synth) {
        const pick = () => { const vs = this.synth.getVoices(); this.ptVoice = vs.find((v) => /pt[-_]BR/i.test(v.lang)) || vs.find((v) => /^pt/i.test(v.lang)) || null; this.refresh(); };
        pick(); try { this.synth.addEventListener("voiceschanged", pick); } catch { /* old browsers */ }
      }
      if (hasClaude()) { try { this.tts = await window.claude.use("tts"); } catch { this.tts = null; } }
      this.refresh();
    },
    available() { return !!this.tts || !!this.ptVoice; },
    refresh() { document.body.classList.toggle("no-voice", !this.available()); },
    speak(text) {
      if (!text) return;
      if (this.tts) {
        this.tts.speak(String(text).slice(0, 2000), { language: "pt-BR" }).catch((e) => {
          if (e && e.code === "not_granted") { this.tts = null; this.refresh(); }
          if (e && e.code !== "busy" && this.ptVoice) this.speakLocal(text);
        });
        return;
      }
      this.speakLocal(text);
    },
    speakLocal(text) {
      if (!this.synth) return;
      try { const u = new SpeechSynthesisUtterance(text); u.lang = "pt-BR"; if (this.ptVoice) u.voice = this.ptVoice; this.synth.cancel(); this.synth.speak(u); } catch { /* ignore */ }
    },
    stop() { try { this.tts && this.tts.stop(); } catch { /* */ } try { this.synth && this.synth.cancel(); } catch { /* */ } },
  };
  const speakBtn = (text, label = "Ouvir") => h("button", { class: "speak", type: "button", "aria-label": label, title: label, html: ICON.speak, onclick: (e) => { e.stopPropagation(); Voice.speak(text); } });

  const Mic = {
    d: null, rec: null, target: null, btn: null, listening: false,
    async init() {
      if (hasClaude()) { try { this.d = await window.claude.use("dictation"); } catch { this.d = null; } }
      if (this.d) {
        this.d.onFinal(({ text }) => this.append(text));
        this.d.onState(({ state }) => this.setListening(state === "listening"));
      } else {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
          try {
            this.rec = new SR(); this.rec.lang = "pt-BR"; this.rec.continuous = true; this.rec.interimResults = false;
            this.rec.onresult = (ev) => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) this.append(ev.results[i][0].transcript); };
            this.rec.onend = () => this.setListening(false);
            this.rec.onerror = () => this.setListening(false);
          } catch { this.rec = null; }
        }
      }
      document.body.classList.toggle("no-mic", !this.d && !this.rec);
    },
    append(text) {
      if (!this.target || !text) return;
      const ta = this.target; const sep = ta.value && !/\s$/.test(ta.value) ? " " : "";
      ta.value += sep + text.trim(); ta.dispatchEvent(new Event("input"));
    },
    setListening(on) { this.listening = on; if (this.btn) this.btn.setAttribute("aria-pressed", on ? "true" : "false"); },
    toggle(target, btn) {
      if (this.listening) { if (this.d) this.d.stop().catch(() => {}); else if (this.rec) this.rec.stop(); this.setListening(false); return; }
      this.target = target; this.btn = btn;
      if (this.d) {
        this.d.start().catch((e) => { this.setListening(false); if (e && e.code === "not_granted") { toast("Microphone not allowed. You can keep typing."); this.d = null; document.body.classList.add("no-mic"); } });
        this.setListening(true);
      } else if (this.rec) { try { this.rec.start(); this.setListening(true); } catch { /* already started */ } }
    },
  };
  const micBtn = (target) => {
    const b = h("button", { class: "btn mic", type: "button", "aria-pressed": "false", "aria-label": "Ditar em voz", title: "Falar em vez de digitar", html: ICON.mic });
    b.addEventListener("click", () => Mic.toggle(target, b));
    return b;
  };

  /* ---------------------------------------------------------------- routing */
  let currentView = "hoje";
  const VIEWS = { hoje: viewToday, cartoes: viewCards, gramatica: viewDrills, tutor: viewTutor, erros: viewErrors };
  function route() {
    const name = (location.hash || "#hoje").slice(1);
    currentView = VIEWS[name] ? name : "hoje";
    document.querySelectorAll("nav.tabs a").forEach((a) => { if (a.dataset.view === currentView) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    VIEW.replaceChildren(...[].concat(VIEWS[currentView]()));
    renderStatus();
  }
  function go(view) { if (location.hash === "#" + view) route(); else location.hash = view; }
  window.addEventListener("hashchange", () => { Voice.stop(); route(); window.scrollTo(0, 0); });

  function streak() {
    let n = 0; let t = startOfDay();
    const active = (k) => { const d = S.days[k]; return d && d.r + d.d + d.t + d.c > 0; };
    if (!active(dateStr(t))) t -= DAY;
    while (active(dateStr(t))) { n++; t -= DAY; }
    return n;
  }
  function renderStatus() {
    const el = document.getElementById("status");
    const due = dueCards().length;
    el.replaceChildren(
      h("span", { class: "chip num" }, "Dia ", h("b", null, String(Math.min(dayNum(), 999))), ` de ${PROGRAM_DAYS}`),
      h("span", { class: "chip num" }, h("b", null, String(streak())), " dias seguidos"),
      h("span", { class: "chip num", title: "Cartões para revisar hoje" }, h("b", null, String(due)), " para revisar"),
    );
  }

  /* ================================================================ HOJE */
  function viewToday() {
    const t = today();
    const due = dueCards().length;
    const fresh = Math.min(newCards().length, Math.max(0, S.newPerDay - t.n));
    const studied = CARDS.filter((c) => S.srs[c.id]).length;
    const mastered = CARDS.filter((c) => S.srs[c.id] && S.srs[c.id].ivl >= 21).length;
    let wk = { ok: 0, n: 0 };
    for (let i = 0; i < 7; i++) { const d = S.days[dateStr(Date.now() - i * DAY)]; if (d) { wk.ok += d.dk; wk.n += d.d; } }
    const dn = dayNum();

    const goals = [
      { done: due + fresh === 0 && t.r > 0, label: "Revisar os cartões do dia", detail: `${t.r} revisados · ${due + fresh} restantes`, view: "cartoes", p: pct(t.r, t.r + due + fresh) },
      { done: t.d >= 15, label: "15 exercícios de gramática", detail: `${t.d}/15`, view: "gramatica", p: pct(Math.min(t.d, 15), 15) },
      { done: t.t >= 1, label: "Escrever 1 texto e corrigir com a IA", detail: `${t.t}/1`, view: "tutor", p: t.t ? 100 : 0 },
      { done: t.c >= 1, label: "1 conversa com o tutor", detail: `${t.c}/1`, view: "tutor", p: t.c ? 100 : 0 },
    ];
    const next = goals.find((g) => !g.done);

    const tiles = h("div", { class: "tiles" },
      h("div", { class: "tile accent" }, h("span", { class: "big" }, `${Math.min(dn, PROGRAM_DAYS)}/${PROGRAM_DAYS}`), h("span", { class: "lbl" }, dn > PROGRAM_DAYS ? "Programa concluído. Continue revisando!" : `Faltam ${PROGRAM_DAYS - dn} dias`)),
      h("div", { class: "tile" }, h("span", { class: "big" }, String(streak())), h("span", { class: "lbl" }, "dias seguidos")),
      h("div", { class: "tile" }, h("span", { class: "big" }, String(studied)), h("span", { class: "lbl" }, `de ${CARDS.length} expressões em estudo`)),
      h("div", { class: "tile" }, h("span", { class: "big" }, String(mastered)), h("span", { class: "lbl" }, "dominadas (intervalo ≥ 21 dias)")),
      h("div", { class: "tile" }, h("span", { class: "big" }, wk.n ? pct(wk.ok, wk.n) + "%" : "–"), h("span", { class: "lbl" }, "acertos na gramática (7 dias)")),
    );

    const plan = h("section", { class: "panel" },
      h("div", { class: "panel-head" }, h("h2", null, "Plano de hoje"), next ? h("button", { class: "btn primary", type: "button", onclick: () => go(next.view) }, "Começar: " + next.label.toLowerCase()) : h("span", { class: "chip" }, "Tudo feito hoje. Parabéns!")),
      h("div", null, goals.map((g) => h("div", { class: "goal" },
        h("span", { class: "check" + (g.done ? " done" : ""), "aria-hidden": "true" }, g.done ? "✓" : ""),
        h("div", { style: "display:grid;gap:6px" }, h("a", { href: "#" + g.view }, g.label), h("div", { class: "bar" }, h("i", { style: `width:${g.p}%` }))),
        h("span", { class: "muted small num" }, g.detail),
      ))),
    );

    // weak spots
    const weakTopics = D.drillTopics.map((tp) => ({ tp, st: S.drillStats[tp.id] })).filter((x) => x.st && x.st.n >= 5).sort((a, b) => a.st.ok / a.st.n - b.st.ok / b.st.n).slice(0, 3);
    const errTypes = {};
    for (const e of S.errors) errTypes[e.tipo || "outro"] = (errTypes[e.tipo || "outro"] || 0) + 1;
    const topErr = Object.entries(errTypes).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const weak = h("section", { class: "panel" },
      h("h3", null, "Pontos fracos"),
      !weakTopics.length && !topErr.length ? h("p", { class: "muted" }, "Do some grammar drills and correct a text with the AI. Your weakest topics and most frequent error types will show up here.") : null,
      weakTopics.length ? h("div", { class: "list" }, weakTopics.map(({ tp, st }) => h("div", { class: "item" },
        h("span", { class: "t" }, tp.name), h("span", { class: "d num" }, `${pct(st.ok, st.n)}% de acertos em ${st.n} exercícios`),
        h("span", { class: "side" }, h("button", { class: "btn sm", type: "button", onclick: () => { go("gramatica"); setTimeout(() => startDrill(tp.id), 0); } }, "Treinar")),
      ))) : null,
      topErr.length ? h("div", { style: "display:grid;gap:8px" }, h("p", { class: "small muted" }, "Erros mais frequentes nos seus textos:"),
        topErr.map(([k, n]) => h("div", { style: "display:grid;grid-template-columns:150px 1fr auto;gap:10px;align-items:center" }, h("span", { class: "small" }, k), h("div", { class: "bar sun" }, h("i", { style: `width:${pct(n, topErr[0][1])}%` })), h("span", { class: "small num muted" }, String(n))))) : null,
    );

    const decks = h("section", { class: "panel" },
      h("h3", null, "Progresso por baralho"),
      DECKS.map((d) => {
        const cs = CARDS.filter((c) => c.deck === d.id); if (!cs.length) return null;
        const st = cs.filter((c) => S.srs[c.id]).length;
        return h("div", { style: "display:grid;gap:4px" }, h("div", { class: "row", style: "justify-content:space-between" }, h("span", null, d.name), h("span", { class: "small muted num" }, `${st}/${cs.length}`)), h("div", { class: "bar" }, h("i", { style: `width:${pct(st, cs.length)}%` })));
      }),
    );

    // heatmap
    const startT = parseDate(S.start);
    const cells = [];
    for (let i = 0; i < PROGRAM_DAYS; i++) {
      const t0 = startT + i * DAY + 3600000; // +1h guards against DST shifts
      const k = dateStr(t0); const d = S.days[k];
      const score = d ? d.r + d.d * 2 + d.t * 10 + d.c * 10 : 0;
      const lvl = score === 0 ? "" : score < 30 ? "l1" : score < 80 ? "l2" : "l3";
      const isToday = k === dateStr();
      cells.push(h("i", { class: [lvl, isToday ? "today" : "", startOfDay(t0) > startOfDay() ? "future" : ""].join(" ").trim(), title: `Dia ${i + 1} · ${k}${d ? ` · ${d.r} cartões, ${d.d} exercícios, ${d.t} textos, ${d.c} conversas` : ""}` }));
    }
    const heat = h("section", { class: "panel" }, h("div", { class: "panel-head" }, h("h3", null, "Seus 60 dias"), h("span", { class: "small muted" }, "Cada quadrado é um dia. Mais escuro = mais estudo.")), h("div", { class: "heat" }, cells));

    const weeks = [
      { from: 1, to: 14, title: "Sem. 1–2 · Base sólida", text: "Conectores e 'Dar, ficar, rolar'. Presente e futuro do subjuntivo. Um texto curto por dia." },
      { from: 15, to: 28, title: "Sem. 3–4 · Fala de verdade", text: "Gírias e expressões. Boteco e WhatsApp com o tutor 3× por semana. Infinitivo pessoal e hipóteses." },
      { from: 29, to: 42, title: "Sem. 5–6 · Escrita C1", text: "Vocabulário formal, regência e crase. E-mails formais, carta de leitor, artigo de opinião." },
      { from: 43, to: 60, title: "Sem. 7–9 · Simulado", text: "Tarefas no estilo CELPE-Bras, entrevista e debate com o tutor, revisão intensa dos seus erros." },
    ];
    const road = h("section", { class: "panel" }, h("h3", null, "Roteiro"),
      h("div", { class: "roadmap" }, weeks.map((w) => h("div", { class: "week" + (dn >= w.from && dn <= w.to ? " now" : "") }, h("b", null, w.title.split(" · ")[0]), h("div", null, h("b", null, w.title.split(" · ")[1]), h("p", { class: "small" }, w.text))))));

    return [tiles, h("div", { class: "grid-2" }, plan, road), h("div", { class: "grid-2" }, weak, decks), heat];
  }

  /* ================================================================ CARTÕES */
  let cardsTab = "revisar";
  const R = { queue: [], cur: null, dir: "pt", flipped: false, done: 0, explain: "", explaining: false, started: false };

  function startReview() {
    const due = dueCards().sort((a, b) => S.srs[a.id].due - S.srs[b.id].due);
    const fresh = newCards();
    const q = []; let ni = 0;
    due.forEach((c, i) => { q.push(c); if ((i + 1) % 4 === 0 && ni < fresh.length) q.push(fresh[ni++]); });
    while (ni < fresh.length) q.push(fresh[ni++]);
    R.queue = q; R.done = 0; R.started = true; nextCard();
  }
  function nextCard() {
    R.cur = R.queue.shift() || null; R.flipped = false; R.explain = ""; R.explaining = false;
    R.dir = S.dir === "mix" ? (Math.random() < 0.5 ? "pt" : "en") : S.dir;
  }
  function grade(g) {
    const c = R.cur; if (!c) return;
    const wasNew = !S.srs[c.id];
    S.srs[c.id] = schedule(S.srs[c.id], g);
    const t = today(); t.r++; if (wasNew) t.n++;
    if (g === 0) R.queue.splice(Math.min(3, R.queue.length), 0, c);
    R.done++; save(); nextCard(); route();
  }

  function viewCards() {
    const tabs = h("div", { class: "row", style: "justify-content:space-between" },
      h("div", { class: "seg", role: "group", "aria-label": "Modo" },
        [["revisar", "Revisar"], ["explorar", "Explorar"], ["importar", "Adicionar e importar"]].map(([id, label]) => h("button", { type: "button", "aria-pressed": cardsTab === id ? "true" : "false", onclick: () => { cardsTab = id; route(); } }, label))),
      cardsTab === "revisar" ? h("div", { class: "seg", role: "group", "aria-label": "Direção" },
        [["pt", "PT → significado"], ["en", "Significado → PT"], ["mix", "Misto"]].map(([id, label]) => h("button", { type: "button", "aria-pressed": S.dir === id ? "true" : "false", onclick: () => { S.dir = id; save(); if (R.cur && !R.flipped) R.dir = id === "mix" ? R.dir : id; route(); } }, label))) : null,
    );
    if (cardsTab === "explorar") return [tabs, viewExplore()];
    if (cardsTab === "importar") return [tabs, ...viewImport()];

    const deckbar = h("div", { class: "deckbar", role: "group", "aria-label": "Baralhos ativos" }, DECKS.map((d) => {
      const n = CARDS.filter((c) => c.deck === d.id).length; if (!n) return null;
      const on = !S.decksOff.includes(d.id);
      return h("button", { class: "deckchip", type: "button", "aria-pressed": on ? "true" : "false", title: d.blurb, onclick: () => { S.decksOff = on ? [...S.decksOff, d.id] : S.decksOff.filter((x) => x !== d.id); save(); R.started = false; R.cur = null; route(); } }, d.name, h("span", { class: "n num" }, String(n)));
    }));

    if (!R.started || (!R.cur && !R.queue.length && R.done === 0)) {
      const due = dueCards().length; const fresh = newCards().length;
      return [tabs, deckbar, h("section", { class: "card" },
        h("div", { class: "meta" }, h("span", null, "Sessão de hoje")),
        h("div", { class: "front" }, due + fresh ? `${due + fresh} cartões` : "Nada para revisar agora"),
        h("p", { class: "muted" }, due + fresh ? `${due} revisões e ${fresh} novos. New cards per day: ${S.newPerDay} (change in Settings).` : "You're up to date. Explore the decks, import words from Language Reactor, or come back tomorrow."),
        h("div", { class: "row" }, due + fresh ? h("button", { class: "btn primary", type: "button", onclick: () => { startReview(); route(); } }, "Começar a revisão") : h("button", { class: "btn", type: "button", onclick: () => { R.queue = shuffle(newCards(10).length ? newCards(10) : CARDS.filter(deckOn)).slice(0, 10); R.started = true; R.done = 0; nextCard(); route(); } }, "Estudar 10 extras")),
      )];
    }
    if (!R.cur) {
      R.started = false;
      return [tabs, deckbar, h("section", { class: "card" }, h("div", { class: "front" }, "Sessão concluída!"), h("p", { class: "muted" }, `${R.done} respostas. Come back tomorrow for the next reviews, or do some grammar now.`), h("div", { class: "row" }, h("a", { class: "btn primary", href: "#gramatica" }, "Ir para a gramática"), h("a", { class: "btn", href: "#hoje" }, "Ver o plano de hoje")))];
    }

    const c = R.cur; const s = S.srs[c.id];
    const front = R.dir === "pt"
      ? [h("div", { class: "row", style: "align-items:flex-start;flex-wrap:nowrap" }, h("div", { class: "front" }, c.pt), speakBtn(c.pt)), h("p", { class: "hint" }, "O que significa? Como você usaria?")]
      : [h("div", { class: "front meaning" }, c.en), h("p", { class: "hint" }, "Como se diz em português do Brasil?"), c.exEn ? h("p", { class: "muted small" }, `Contexto: “${c.exEn}”`) : null];
    const back = R.flipped ? h("div", { class: "back" },
      R.dir === "pt" ? h("div", { class: "answer" }, c.en) : h("div", { class: "row", style: "flex-wrap:nowrap" }, h("div", { class: "front" }, c.pt), speakBtn(c.pt)),
      c.ex ? h("div", { class: "example" }, h("div", { class: "row", style: "flex-wrap:nowrap;justify-content:space-between" }, h("span", { class: "pt" }, c.ex), speakBtn(c.ex, "Ouvir o exemplo")), h("span", { class: "muted small" }, c.exEn)) : null,
      c.note ? h("p", { class: "note" }, c.note) : null,
      c.es ? h("p", { class: "es" }, h("b", null, "Em espanhol: "), c.es) : null,
      R.explain ? h("div", { class: "ai-out" }, R.explain) : null,
      h("div", { class: "row" }, h("button", { class: "btn sm ghost", type: "button", disabled: R.explaining, onclick: () => explainCard(c) }, R.explaining ? h("span", { class: "spinner" }) : null, R.explain ? "Explicar de novo" : "Mais exemplos e nuances (IA)")),
    ) : null;
    const controls = R.flipped
      ? h("div", { class: "grades" }, [["De novo", 0], ["Difícil", 1], ["Bom", 2], ["Fácil", 3]].map(([label, g]) => h("button", { type: "button", class: "g" + g, onclick: () => grade(g) }, label, h("small", { class: "num" }, `${g + 1} · ${fmtIvl(schedule(s, g))}`))))
      : h("button", { class: "btn primary", type: "button", style: "width:100%", onclick: () => { R.flipped = true; route(); } }, "Mostrar resposta");
    return [tabs, deckbar,
      h("section", { class: "card", "aria-label": "Cartão" },
        h("div", { class: "meta" }, h("span", null, deckName(c.deck), " · ", s ? "revisão" : "nova"), h("span", { class: "reg reg-" + c.reg }, c.reg)),
        front, back),
      controls,
      h("p", { class: "kbd" }, `Atalhos: espaço para virar, 1–4 para responder. Restam ${R.queue.length + 1} nesta sessão.`),
    ];
  }

  async function explainCard(c) {
    if (!AI.available()) { toast(AI.explainError({ code: "no_ai" })); return; }
    R.explaining = true; R.explain = "…"; route();
    const prompt = `You are a Brazilian Portuguese teacher. Explain the expression "${c.pt}" (meaning: ${c.en}; register: ${c.reg}) to a B2 learner aiming for C1. Write in ${L()}, except examples, which are in Brazilian Portuguese.
Give, in plain text without markdown symbols:
1. Nuance: when and how Brazilians use it (region, age, formality), in 2 sentences.
2. Four new natural example sentences from everyday Brazilian life, each followed by a translation.
3. One typical learner mistake with it${c.es ? " (the learner may speak Spanish)" : ""}.
4. One or two related expressions.
Keep it under 190 words.`;
    try {
      await AI.text(prompt, (t) => { R.explain = t; const out = VIEW.querySelector(".ai-out"); if (out) out.textContent = t; });
    } catch (e) { R.explain = AI.explainError(e); }
    R.explaining = false; if (currentView === "cartoes" && R.cur === c) route();
  }

  let exploreQ = "", exploreDeck = "all";
  function viewExplore() {
    const panel = h("section", { class: "panel" });
    const listEl = h("div", { class: "list" });
    const input = h("input", { type: "search", id: "explore-q", placeholder: "Buscar: 'dar', 'grana', 'however'…", value: exploreQ, "aria-label": "Buscar cartões" });
    const sel = h("select", { id: "explore-deck", "aria-label": "Baralho" }, h("option", { value: "all" }, "Todos os baralhos"), DECKS.map((d) => h("option", { value: d.id, selected: exploreDeck === d.id }, d.name)));
    const draw = () => {
      const q = deaccent(exploreQ);
      const rows = CARDS.filter((c) => (exploreDeck === "all" || c.deck === exploreDeck) && (!q || deaccent(c.pt + " " + c.en + " " + (c.ex || "")).includes(q)));
      listEl.replaceChildren(...rows.slice(0, 150).map((c) => h("div", { class: "item" },
        h("span", { class: "t" }, c.pt, " ", h("span", { class: "reg reg-" + c.reg }, c.reg)),
        h("span", { class: "d" }, c.en, c.ex ? h("span", { style: "display:block;font-style:italic" }, c.ex) : null),
        h("span", { class: "side" }, h("span", { class: "tag" }, statusOf(c)), speakBtn(c.pt),
          c.deck === "meus" ? h("button", { class: "btn sm ghost", type: "button", "aria-label": "Apagar cartão", onclick: () => { S.custom = S.custom.filter((x) => x.id !== c.id); delete S.srs[c.id]; buildCards(); save(); draw(); } }, "Apagar") : null),
      )));
      if (!rows.length) listEl.replaceChildren(h("p", { class: "muted" }, "Nenhum cartão encontrado."));
      count.textContent = `${rows.length} cartões${rows.length > 150 ? " (mostrando 150)" : ""}`;
    };
    const count = h("span", { class: "small muted num" });
    input.addEventListener("input", () => { exploreQ = input.value; draw(); });
    sel.addEventListener("change", () => { exploreDeck = sel.value; draw(); });
    panel.append(h("div", { class: "form-grid" }, input, sel), count, listEl);
    draw();
    return panel;
  }

  let importText = "", importPreview = null, importBusy = false, importN = "20";
  function viewImport() {
    const ta = h("textarea", { id: "import-text", placeholder: "Cole aqui: export CSV do Language Reactor, legendas de um vídeo do YouTube, um artigo da Folha ou uma lista de palavras…" }, importText);
    ta.addEventListener("input", () => { importText = ta.value; });
    const nSel = h("select", { id: "import-n", "aria-label": "Número máximo de cartões" }, ["10", "20", "30", "40"].map((n) => h("option", { value: n, selected: importN === n }, `até ${n} cartões`)));
    nSel.addEventListener("change", () => { importN = nSel.value; });
    const run = async () => {
      if (!AI.available()) { toast(AI.explainError({ code: "no_ai" })); return; }
      if (importText.trim().length < 3) { toast("Paste some text first."); return; }
      importBusy = true; importPreview = null; route();
      const prompt = `You help a B2 learner of Brazilian Portuguese reach C1 in 60 days. From the material below, pick the most useful items to study. The material may be a Language Reactor or Anki export (CSV/TSV, possibly with columns like word, translation, context sentence), video subtitles, an article, or a plain word list.
Prefer: informal and colloquial expressions, idioms and metaphors, verb constructions (dar/ficar/pegar/rolar…), collocations, and C1-level formal words. Skip A1–B1 basics and proper names. Use the dictionary form of each item (infinitive verbs) but keep fixed expressions as they are.
Return ONLY JSON: {"cards":[{"pt":"item in Brazilian Portuguese","en":"meaning in ${S.lang === "pt" ? "simple Brazilian Portuguese" : "English"}","ex":"a natural example sentence in Brazilian Portuguese (reuse the original context sentence when there is one)","exEn":"translation of the example into English","reg":"gíria|informal|neutro|formal","note":"one short usage tip in ${L()}, or empty"}]}
At most ${importN} cards.
Material:
"""
${importText.slice(0, 18000)}
"""`;
      try {
        const data = await AI.json(prompt);
        const cards = (Array.isArray(data) ? data : data.cards || []).filter((x) => x && x.pt && x.en).map((x) => ({ ...x, pick: !BY_ID["meus:" + slug(x.pt)] }));
        importPreview = cards;
        if (!cards.length) toast("No useful items found in that text.");
      } catch (e) { toast(AI.explainError(e)); }
      importBusy = false; route();
    };
    const aiPanel = h("section", { class: "panel" },
      h("div", { class: "panel-head" }, h("h2", null, "Importar com IA"), h("span", { class: "small muted" }, "Language Reactor · legendas · artigos")),
      h("p", { class: "small" }, "Export your saved words from Language Reactor (or copy the subtitles of a YouTube video, a news article, a song you like), paste it here, and Claude turns the best B2→C1 items into flashcards with examples."),
      ta,
      h("div", { class: "row" }, nSel, h("button", { class: "btn primary", type: "button", disabled: importBusy, onclick: run }, importBusy ? [h("span", { class: "spinner" }), " Lendo…"] : "Extrair cartões")),
      importPreview && importPreview.length ? h("div", { style: "display:grid;gap:10px" },
        h("div", { class: "list" }, importPreview.map((c, i) => h("label", { class: "item", style: "cursor:pointer;font-weight:400" },
          h("span", { class: "t" }, c.pt, " ", h("span", { class: "reg reg-" + (c.reg || "neutro") }, c.reg || "neutro")),
          h("span", { class: "d" }, c.en, c.ex ? h("span", { style: "display:block;font-style:italic" }, c.ex) : null),
          h("span", { class: "side" }, h("input", { type: "checkbox", id: "imp-" + i, checked: c.pick, onchange: (e) => { c.pick = e.target.checked; } })),
        ))),
        h("div", { class: "row end" }, h("button", { class: "btn primary", type: "button", onclick: () => {
          let n = 0; for (const c of importPreview) if (c.pick && addCustom({ ...c, src: "import" })) n++;
          importPreview = null; importText = ""; toast(`${n} cartões adicionados a "Meus cartões".`); route();
        } }, "Adicionar os selecionados")),
      ) : null,
    );

    const f = { pt: "", en: "", ex: "", exEn: "", reg: "informal", note: "" };
    const field = (key, label, ph) => { const i = h("input", { type: "text", id: "add-" + key, placeholder: ph || "" }); i.addEventListener("input", () => { f[key] = i.value; }); return h("label", { for: "add-" + key }, label, i); };
    const regSel = h("select", { id: "add-reg" }, ["gíria", "informal", "neutro", "formal"].map((r) => h("option", { value: r, selected: r === "informal" }, r)));
    regSel.addEventListener("change", () => { f.reg = regSel.value; });
    const manual = h("section", { class: "panel" }, h("h3", null, "Adicionar manualmente"),
      h("div", { class: "form-grid" }, field("pt", "Expressão em português", "ex.: dar zebra"), field("en", "Significado", "ex.: an unexpected result"), field("ex", "Exemplo", "ex.: Deu zebra no jogo de ontem."), field("exEn", "Tradução do exemplo"), h("label", { for: "add-reg" }, "Registro", regSel), field("note", "Nota (opcional)")),
      h("div", { class: "row end" }, h("button", { class: "btn primary", type: "button", onclick: () => { if (addCustom(f)) { toast("Cartão adicionado."); route(); } else toast("Fill in expression and meaning (and avoid duplicates)."); } }, "Adicionar cartão")),
    );

    const anki = h("section", { class: "panel" }, h("h3", null, "Exportar para o Anki"),
      h("p", { class: "small" }, "Copies every card as tab-separated text (front: Portuguese, back: meaning and example). Paste it into a .txt file and use File → Import in Anki."),
      h("div", { class: "row" }, h("button", { class: "btn", type: "button", onclick: () => {
        const tsv = CARDS.map((c) => [c.pt, `${c.en}${c.ex ? "<br><i>" + c.ex + "</i>" : ""}${c.exEn ? "<br>" + c.exEn : ""}`, deckName(c.deck)].map((x) => String(x).replace(/[\t\n]/g, " ")).join("\t")).join("\n");
        navigator.clipboard.writeText(tsv).then(() => toast(`${CARDS.length} cartões copiados.`), () => toast("Copy was blocked by the browser."));
      } }, "Copiar todos os cartões")));
    return [aiPanel, h("div", { class: "grid-2" }, manual, anki)];
  }

  /* ================================================================ GRAMÁTICA */
  const G = { topic: null, items: [], i: 0, input: "", result: null, picked: null, ok: 0, busy: false };
  const topicName = (id) => id === "erros" ? "Meus erros" : id === "mix" ? "Treino misto" : (D.drillTopics.find((t) => t.id === id) || {}).name || id;

  function itemsFor(topic) {
    if (topic === "erros") return shuffle(S.errors.filter((e) => (e.fixed || 0) < 2)).slice(0, 10).map((e) => ({ t: "erros", q: `Corrija: “${e.original}”`, a: [e.correcao], x: e.explicacao || "", errId: e.id }));
    if (topic === "mix") {
      const weights = D.drillTopics.map((tp) => { const st = S.drillStats[tp.id]; return { id: tp.id, w: st && st.n ? 1.5 - st.ok / st.n : 1 }; });
      const pool = [...D.drills, ...Object.values(S.aiDrills).flat()];
      return shuffle(pool).sort((a, b) => (weights.find((w) => w.id === b.t)?.w || 1) * Math.random() - (weights.find((w) => w.id === a.t)?.w || 1) * Math.random()).slice(0, 10);
    }
    return shuffle([...D.drills.filter((d) => d.t === topic), ...(S.aiDrills[topic] || [])]).slice(0, 10);
  }
  function startDrill(topic) { Object.assign(G, { topic, items: itemsFor(topic), i: 0, input: "", result: null, picked: null, ok: 0, busy: false }); route(); }
  function checkAnswer(item, input) {
    if (item.opts) return input === item.a ? "ok" : "no";
    const answers = item.a.map(String);
    const strict = item.t === "crase" || answers.some((a) => norm(a).length <= 3);
    if (answers.some((a) => norm(a) === norm(input))) return "ok";
    if (!strict && answers.some((a) => deaccent(a) === deaccent(input))) return "accent";
    return "no";
  }
  function record(item, ok) {
    const st = S.drillStats[item.t] || (S.drillStats[item.t] = { ok: 0, n: 0 });
    st.n++; if (ok) st.ok++;
    const t = today(); t.d++; if (ok) { t.dk++; G.ok++; }
    if (item.errId && ok) { const e = S.errors.find((x) => x.id === item.errId); if (e) e.fixed = (e.fixed || 0) + 1; }
    save();
  }
  function submitDrill(value) {
    const item = G.items[G.i]; if (!item || G.result) return;
    if (!item.opts && !String(value).trim()) return;
    G.input = value; G.picked = item.opts ? value : null;
    G.result = checkAnswer(item, value);
    record(item, G.result !== "no"); route();
    setTimeout(() => { const b = document.getElementById("drill-next"); if (b) b.focus(); }, 0);
  }
  function overrideDrill() {
    const item = G.items[G.i]; if (G.result !== "no") return;
    const st = S.drillStats[item.t]; if (st) st.ok++;
    const t = today(); t.dk++; G.ok++; G.result = "ok";
    if (item.errId) { const e = S.errors.find((x) => x.id === item.errId); if (e) e.fixed = (e.fixed || 0) + 1; }
    save(); route();
  }
  async function genDrills(topic) {
    if (!AI.available()) { toast(AI.explainError({ code: "no_ai" })); return; }
    const tp = D.drillTopics.find((t) => t.id === topic); if (!tp) return;
    G.busy = true; route();
    const examples = D.drills.filter((d) => d.t === topic && !d.opts).slice(0, 3).map((d) => JSON.stringify({ q: d.q, a: d.a, x: d.x })).join("\n");
    const prompt = `Create 6 NEW exercises for a B2 learner of Brazilian Portuguese aiming for C1. Topic: "${tp.name}". ${tp.tip}
Mix everyday spoken Brazilian situations (WhatsApp, work, family, bars, news) with some formal ones. Use Brazilian norms (not European). Each exercise is one sentence with exactly one blank "___" followed by a hint in parentheses (usually the infinitive), like these examples:
${examples}
List every acceptable answer in "a". Explanations in ${L()}, max 25 words.
Return ONLY JSON: {"items":[{"q":"…","a":["…"],"x":"…"}]}`;
    try {
      const data = await AI.json(prompt);
      const items = (data.items || []).filter((x) => x && typeof x.q === "string" && x.q.includes("___") && x.a && x.a.length).map((x) => ({ t: topic, q: x.q, a: [].concat(x.a).map(String), x: String(x.x || ""), ai: true }));
      if (!items.length) throw { code: "bad_json" };
      S.aiDrills[topic] = [...(S.aiDrills[topic] || []), ...items].slice(-60); save();
      if (G.topic === topic) G.items.push(...items);
      toast(`${items.length} novos exercícios adicionados.`);
    } catch (e) { toast(AI.explainError(e)); }
    G.busy = false; route();
  }

  function renderQuestion(q) {
    const parts = String(q).split("___");
    const out = [];
    parts.forEach((p, i) => { out.push(p); if (i < parts.length - 1) out.push(h("mark", null, G.result && G.items[G.i] && !G.items[G.i].opts ? G.input : "      ")); });
    return out;
  }

  function viewDrills() {
    if (!G.topic) {
      const groups = {};
      for (const tp of D.drillTopics) (groups[tp.group] ||= []).push(tp);
      const topicBtn = (id, name, tip, extra) => {
        const st = S.drillStats[id];
        const n = id === "erros" ? S.errors.filter((e) => (e.fixed || 0) < 2).length : D.drills.filter((d) => d.t === id).length + (S.aiDrills[id] || []).length;
        return h("button", { class: "topic", type: "button", onclick: () => startDrill(id), title: tip || "" },
          h("span", { class: "name" }, name),
          h("span", { class: "small muted" }, extra || (st ? `${pct(st.ok, st.n)}% de acertos · ${st.n} feitos` : `${n} exercícios`)),
          h("div", { class: "bar" }, h("i", { style: `width:${st ? pct(st.ok, st.n) : 0}%` })));
      };
      const pending = S.errors.filter((e) => (e.fixed || 0) < 2).length;
      return [
        h("section", { class: "panel" },
          h("div", { class: "panel-head" }, h("h2", null, "Gramática"), h("span", { class: "small muted num" }, `Hoje: ${today().d} exercícios, ${pct(today().dk, today().d)}% certos`)),
          h("p", null, "Sessions of 10. Type the missing word, check, read the explanation. Each topic can generate fresh exercises with the AI, so you never just memorize the answers."),
          h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", onclick: () => startDrill("mix") }, "Treino misto (foco nos pontos fracos)"), pending ? h("button", { class: "btn", type: "button", onclick: () => startDrill("erros") }, `Praticar meus erros (${pending})`) : null)),
        h("div", { class: "topic-groups" }, Object.entries(groups).map(([g, tps]) => h("section", { style: "display:grid;gap:10px" }, h("h3", null, g), h("div", { class: "topics" }, tps.map((tp) => topicBtn(tp.id, tp.name, tp.tip)))))),
      ];
    }

    const item = G.items[G.i];
    const tp = D.drillTopics.find((t) => t.id === G.topic);
    const head = h("div", { class: "panel-head" },
      h("div", { style: "display:grid;gap:4px" }, h("h2", null, topicName(G.topic)), tp ? h("p", { class: "small muted", style: "max-width:65ch" }, tp.tip) : null),
      h("div", { class: "row" },
        tp ? h("button", { class: "btn sm", type: "button", disabled: G.busy, onclick: () => genDrills(G.topic) }, G.busy ? [h("span", { class: "spinner" }), " Gerando…"] : "+ 6 novos com IA") : null,
        h("button", { class: "btn sm ghost", type: "button", onclick: () => { G.topic = null; route(); } }, "Sair")));

    if (!item) {
      const total = G.items.length;
      return h("section", { class: "panel" }, head,
        h("div", { class: "front", style: "font-family:var(--font-display);font-size:2.2rem;font-weight:800" }, total ? `${G.ok}/${total} certos` : "Nada para praticar aqui ainda"),
        h("p", { class: "muted" }, total ? (G.ok / total >= 0.8 ? "Excelente! Try another topic or generate harder exercises with the AI." : "Good practice. Repeat this topic tomorrow; the mistakes are what make you learn.") : "Correct a text with the AI tutor first. Your mistakes become exercises here."),
        h("div", { class: "row" }, total ? h("button", { class: "btn primary", type: "button", onclick: () => startDrill(G.topic) }, "Mais 10") : null, h("button", { class: "btn", type: "button", onclick: () => { G.topic = null; route(); } }, "Escolher outro tema")));
    }

    let answerArea;
    if (item.opts) {
      answerArea = h("div", { class: "opts" }, item.opts.map((o, idx) => h("button", {
        type: "button", disabled: !!G.result,
        class: G.result ? (idx === item.a ? "right" : idx === G.picked ? "wrong" : "") : "",
        onclick: () => submitDrill(idx),
      }, o)));
    } else {
      const inp = h("input", { type: "text", id: "drill-input", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "Sua resposta", value: G.result ? G.input : "", disabled: !!G.result, "aria-label": "Resposta" });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); submitDrill(inp.value); } });
      answerArea = h("div", { class: "row", style: "flex-wrap:nowrap" }, inp, !G.result ? h("button", { class: "btn primary", type: "button", onclick: () => submitDrill(inp.value) }, "Conferir") : null);
      if (!G.result) setTimeout(() => inp.focus(), 0);
    }
    const answers = item.opts ? item.opts[item.a] : item.a.join(" / ");
    const fb = G.result ? h("div", { class: "fb " + (G.result === "ok" ? "ok" : G.result === "accent" ? "warn" : "no") },
      h("b", null, G.result === "ok" ? "Certo!" : G.result === "accent" ? "Quase! Check the accents." : "Ainda não."),
      G.result !== "ok" ? h("span", null, "Resposta: ", h("strong", null, answers)) : item.a.length > 1 && !item.opts ? h("span", { class: "small" }, "Também vale: " + item.a.join(" / ")) : null,
      item.x ? h("span", null, item.x) : null,
    ) : null;
    const next = G.result ? h("div", { class: "row end" },
      G.result === "no" && !item.opts ? h("button", { class: "btn ghost", type: "button", onclick: overrideDrill }, "Na verdade acertei") : null,
      h("button", { class: "btn primary", id: "drill-next", type: "button", onclick: () => { G.i++; G.result = null; G.input = ""; G.picked = null; route(); } }, G.i + 1 < G.items.length ? "Próxima" : "Ver resultado")) : null;

    return h("section", { class: "panel" }, head,
      h("div", { class: "row", style: "justify-content:space-between" }, h("span", { class: "small muted num" }, `${G.i + 1} de ${G.items.length}${item.ai ? " · gerado pela IA" : ""}`), h("div", { class: "bar", style: "flex:1;max-width:240px" }, h("i", { style: `width:${pct(G.i, G.items.length)}%` }))),
      h("p", { class: "drill-q" }, renderQuestion(item.q)),
      answerArea, fb, next);
  }

  /* ================================================================ TUTOR */
  let tutorTab = "escrever";
  const W = { task: D.writingTasks[0], text: "", busy: false, result: null };
  let CH = null; // { sc, msgs: [], busy, feedback, feedbackBusy }

  function saveErrors(list, src) {
    const clean = (list || []).filter((e) => e && e.original && e.correcao && norm(e.original) !== norm(e.correcao));
    for (const e of clean) S.errors.unshift({ id: uid(), date: dateStr(), original: String(e.original), correcao: String(e.correcao), tipo: String(e.tipo || "outro").toLowerCase(), explicacao: String(e.explicacao || ""), src });
    S.errors = S.errors.slice(0, 200);
    return clean.length;
  }
  const ERROR_TYPES = "conjugação, tempo verbal, subjuntivo, regência, crase, concordância, preposição, vocabulário, registro, ortografia/acentuação, pronome, estrutura, interferência do espanhol";

  function feedbackView(data) {
    if (!data) return null;
    const erros = data.erros || [];
    return h("div", { style: "display:grid;gap:14px" },
      h("div", { class: "row", style: "align-items:flex-start;flex-wrap:nowrap" }, data.nivel ? h("span", { class: "level", title: "Nível estimado (CEFR)" }, data.nivel) : null, h("p", null, data.resumo || "")),
      data.boas && data.boas.length ? h("div", null, h("h3", null, "O que você fez bem"), h("ul", null, data.boas.map((b) => h("li", null, b)))) : null,
      h("h3", null, erros.length ? `Correções (${erros.length})` : "Nenhum erro encontrado. Muito bem!"),
      erros.map((e) => h("div", { class: "err" },
        h("div", { class: "fix" }, h("s", null, e.original), h("span", { "aria-hidden": "true" }, "→"), h("span", { class: "ok" }, e.correcao), h("span", { class: "tag" }, e.tipo || "")),
        e.explicacao ? h("p", { class: "small" }, e.explicacao) : null)),
      data.corrigido ? h("div", { style: "display:grid;gap:6px" }, h("div", { class: "row", style: "justify-content:space-between" }, h("h3", null, "Texto corrigido"), speakBtn(data.corrigido)), h("div", { class: "ai-out" }, data.corrigido)) : null,
      data.versao_c1 ? h("div", { style: "display:grid;gap:6px" }, h("div", { class: "row", style: "justify-content:space-between" }, h("h3", null, "Como soaria em nível C1"), speakBtn(data.versao_c1)), h("div", { class: "ai-out" }, data.versao_c1)) : null,
      (data.sugestoes || data.expressoes || []).length ? h("div", { style: "display:grid;gap:6px" }, h("h3", null, "Expressões para subir de nível"),
        h("div", { class: "list" }, (data.sugestoes || data.expressoes).map((s) => {
          const b = h("button", { class: "btn sm", type: "button" }, "+ Cartão");
          b.addEventListener("click", () => { if (addCustom({ pt: s.pt, en: s.en || s.significado || "", ex: s.ex || s.exemplo || "", exEn: "", reg: s.reg || "neutro", note: s.porque || "", src: "tutor" })) { b.textContent = "Adicionado"; b.disabled = true; } else toast("Already in your cards."); });
          return h("div", { class: "item" }, h("span", { class: "t" }, s.pt), h("span", { class: "d" }, [s.en || s.significado, s.porque].filter(Boolean).join(" · ")), h("span", { class: "side" }, b));
        }))) : null,
    );
  }

  async function correctText() {
    if (!AI.available()) { toast(AI.explainError({ code: "no_ai" })); return; }
    if (W.text.trim().split(/\s+/).length < 8) { toast("Write at least a few sentences first."); return; }
    W.busy = true; W.result = null; route();
    const prompt = `You are an expert examiner of Brazilian Portuguese (CEFR, CELPE-Bras style). A B2 learner aiming for C1 wrote the text below.
Task: "${W.task ? W.task.text : "free writing"}". Expected register: ${W.task ? W.task.reg : "neutral"}.
Use Brazilian norms, not European. If the register is informal or slang, spoken forms like "tô", "pra", "a gente", "me passa" are NOT errors. List only real errors (max 15), not mere style preferences. The learner may speak Spanish: mark Spanish interference.
Return ONLY JSON:
{"nivel":"B1|B2|B2+|C1|C2","resumo":"2–3 sentences of overall feedback in ${L()}","erros":[{"original":"exact wrong fragment copied from the text","correcao":"corrected fragment","tipo":"one of: ${ERROR_TYPES}","explicacao":"short explanation in ${L()}"}],"corrigido":"the full text corrected, keeping the learner's ideas and register","versao_c1":"the same text rewritten as a natural C1 Brazilian writer would, same register","sugestoes":[{"pt":"expression or word","en":"meaning in English","porque":"why it upgrades the text, in ${L()}"}]}
Give 3 to 5 sugestoes.
Text:
"""
${W.text.slice(0, 8000)}
"""`;
    try {
      const data = await AI.json(prompt);
      W.result = data;
      const n = saveErrors(data.erros, "texto");
      today().t++; save();
      if (n) toast(`${n} erros salvos em "Meus erros".`);
    } catch (e) { toast(AI.explainError(e)); }
    W.busy = false; route();
  }

  function chatInstructions(sc) {
    return `You are role-playing in Brazilian Portuguese with a B2 learner who wants to reach C1.
Character and situation: ${sc.role}
Register: ${sc.reg}.
Rules:
- Stay in character. Reply ONLY with your character's next message in Brazilian Portuguese: 1 to 4 sentences${sc.id === "whatsapp" ? ", written like real WhatsApp messages" : ""}.
- Sound like a real Brazilian in this situation: use the colloquial forms and expressions the register allows, and now and then a C1-level word or idiom the learner may not know.
- Do not correct the learner during the conversation; feedback comes at the end. If a message is unclear, react as a native would and ask.
- Keep the conversation moving with a reaction or a question. Never switch to English.`;
  }
  async function sendChat(text) {
    if (!CH || CH.busy) return;
    if (!AI.available()) { toast(AI.explainError({ code: "no_ai" })); return; }
    text = text.trim(); if (!text) return;
    CH.msgs.push({ role: "user", content: text });
    CH.busy = true; CH.msgs.push({ role: "assistant", content: "…", pending: true }); route();
    const msgs = [{ role: "user", content: chatInstructions(CH.sc) + "\n\n(Start the role-play now with your opening line.)" }, { role: "assistant", content: CH.sc.opener }, ...CH.msgs.filter((m) => !m.pending).map(({ role, content }) => ({ role, content }))];
    const pending = CH.msgs[CH.msgs.length - 1];
    try {
      const reply = await AI.text(msgs, (t) => { pending.content = t; const last = VIEW.querySelector(".msg.ai.pending .txt"); if (last) last.textContent = t; });
      pending.content = String(reply || "").trim(); delete pending.pending;
      if (S.autoSpeak) Voice.speak(pending.content);
    } catch (e) {
      CH.msgs.pop(); CH.msgs.pop(); toast(AI.explainError(e));
    }
    CH.busy = false; route();
    setTimeout(() => { const c = VIEW.querySelector(".chat"); if (c) c.scrollTop = c.scrollHeight; const ta = document.getElementById("chat-input"); if (ta) ta.focus(); }, 0);
  }
  async function endChat() {
    if (!CH) return;
    const mine = CH.msgs.filter((m) => m.role === "user");
    if (mine.length < 2) { toast("Send at least two messages first."); return; }
    CH.feedbackBusy = true; route();
    const transcript = [{ role: "assistant", content: CH.sc.opener }, ...CH.msgs].map((m) => `${m.role === "user" ? "LEARNER" : "PARTNER"}: ${m.content}`).join("\n");
    const prompt = `You are an expert teacher of Brazilian Portuguese. Below is a role-play (${CH.sc.name}, register: ${CH.sc.reg}) between a B2 learner aiming for C1 and a native partner.
Evaluate ONLY the LEARNER's lines. Brazilian norms. Spoken forms that fit the register (tô, pra, a gente, me passa) are NOT errors; using an inappropriate register IS (tipo "registro"). Mark Spanish interference.
Return ONLY JSON:
{"nivel":"B1|B2|B2+|C1|C2","resumo":"2–3 sentences in ${L()}","boas":["2–3 things the learner did well, in ${L()}"],"erros":[{"original":"exact fragment from a learner line","correcao":"natural corrected fragment","tipo":"one of: ${ERROR_TYPES}","explicacao":"short, in ${L()}"}],"expressoes":[{"pt":"expression a native would have used here","en":"meaning in English","porque":"when to use it, in ${L()}"}]}
Max 12 erros, 4–6 expressoes.
Conversation:
${transcript.slice(0, 12000)}`;
    try {
      const data = await AI.json(prompt);
      CH.feedback = data;
      const n = saveErrors(data.erros, "conversa: " + CH.sc.name);
      today().c++; save();
      if (n) toast(`${n} erros salvos em "Meus erros".`);
    } catch (e) { toast(AI.explainError(e)); }
    CH.feedbackBusy = false; route();
  }

  function viewTutor() {
    const tabs = h("div", { class: "seg", role: "group", "aria-label": "Modo do tutor" },
      [["escrever", "Escrever e corrigir"], ["conversar", "Conversar"]].map(([id, label]) => h("button", { type: "button", "aria-pressed": tutorTab === id ? "true" : "false", onclick: () => { tutorTab = id; route(); } }, label)));
    const notice = !AI.available() ? h("div", { class: "notice" }, h("b", null, "AI not connected. "), hasClaude() ? "Allow Claude for this page when asked, then reload." : "On the GitHub version, add your Anthropic API key in Settings (gear icon). It stays in this browser only.") : null;

    if (tutorTab === "escrever") {
      const ta = h("textarea", { id: "write-text", placeholder: "Escreva aqui em português… (ou use o microfone)", style: "min-height:220px" }, W.text);
      const wc = h("span", { class: "small muted num" });
      const upd = () => { W.text = ta.value; const n = W.text.trim() ? W.text.trim().split(/\s+/).length : 0; wc.textContent = `${n} palavras`; };
      ta.addEventListener("input", upd); upd();
      const taskSel = h("select", { id: "task-select", "aria-label": "Tarefa" }, D.writingTasks.map((t, i) => h("option", { value: String(i), selected: W.task === t }, `${i + 1}. [${t.reg}] ${t.text.slice(0, 70)}…`)), h("option", { value: "free", selected: !W.task }, "Tema livre"));
      taskSel.addEventListener("change", () => { W.task = taskSel.value === "free" ? null : D.writingTasks[Number(taskSel.value)]; route(); });
      return [tabs, notice,
        h("section", { class: "panel" },
          h("div", { class: "panel-head" }, h("h2", null, "Escrever e corrigir"), h("button", { class: "btn sm ghost", type: "button", onclick: () => { W.task = D.writingTasks[Math.floor(Math.random() * D.writingTasks.length)]; route(); } }, "Tarefa aleatória")),
          taskSel,
          W.task ? h("div", { class: "example" }, h("span", { class: "reg reg-" + W.task.reg }, W.task.reg), " ", W.task.text) : h("p", { class: "small muted" }, "Write about anything. Tip: describe your week using at least three tenses."),
          ta,
          h("div", { class: "row", style: "justify-content:space-between" }, wc, h("div", { class: "row" }, micBtn(ta), h("button", { class: "btn primary", type: "button", disabled: W.busy, onclick: correctText }, W.busy ? [h("span", { class: "spinner" }), " Corrigindo…"] : "Corrigir com IA"))),
        ),
        W.result ? h("section", { class: "panel" }, h("h2", null, "Correção"), feedbackView(W.result), h("div", { class: "row" }, h("button", { class: "btn", type: "button", onclick: () => { W.text = ""; W.result = null; route(); } }, "Escrever outro texto"), h("a", { class: "btn", href: "#erros" }, "Ver meus erros"))) : null,
      ];
    }

    if (!CH) {
      return [tabs, notice, h("section", { class: "panel" },
        h("div", { class: "panel-head" }, h("h2", null, "Conversar"), h("label", { class: "row", style: "font-weight:400;display:flex" }, h("input", { type: "checkbox", id: "auto-speak", checked: S.autoSpeak, onchange: (e) => { S.autoSpeak = e.target.checked; save(); } }), "Ler as respostas em voz alta")),
        h("p", null, "Pick a situation. The tutor stays in character and does not interrupt to correct you. When you finish, you get a full correction and your mistakes go to “Meus erros”."),
        h("div", { class: "scenarios" }, D.scenarios.map((sc) => h("button", { class: "topic", type: "button", onclick: () => { CH = { sc, msgs: [], busy: false, feedback: null, feedbackBusy: false }; route(); if (S.autoSpeak) Voice.speak(sc.opener); } },
          h("span", { class: "name" }, sc.name), h("span", null, h("span", { class: "reg reg-" + sc.reg }, sc.reg))))),
      )];
    }

    const chat = h("div", { class: "chat", "aria-live": "polite" },
      [{ role: "assistant", content: CH.sc.opener }, ...CH.msgs].map((m) => m.role === "user"
        ? h("div", { class: "msg me" }, h("span", { class: "txt" }, m.content))
        : h("div", { class: "msg ai" + (m.pending ? " pending" : "") }, h("span", { class: "txt" }, m.content), m.pending ? null : speakBtn(m.content))));
    const ta = h("textarea", { id: "chat-input", placeholder: "Sua resposta… (Enter envia, Shift+Enter quebra linha)", disabled: CH.busy || !!CH.feedback });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const v = ta.value; ta.value = ""; sendChat(v); } });
    setTimeout(() => { chat.scrollTop = chat.scrollHeight; }, 0);
    return [tabs, notice, h("section", { class: "panel" },
      h("div", { class: "panel-head" }, h("h2", null, CH.sc.name), h("div", { class: "row" },
        !CH.feedback ? h("button", { class: "btn sm", type: "button", disabled: CH.feedbackBusy || CH.busy, onclick: endChat }, CH.feedbackBusy ? [h("span", { class: "spinner" }), " Analisando…"] : "Terminar e ver correções") : null,
        h("button", { class: "btn sm ghost", type: "button", onclick: () => { Voice.stop(); CH = null; route(); } }, CH.feedback ? "Nova conversa" : "Sair"))),
      chat,
      !CH.feedback ? h("div", { class: "composer" }, ta, micBtn(ta), h("button", { class: "btn primary", type: "button", disabled: CH.busy, onclick: () => { const v = ta.value; ta.value = ""; sendChat(v); } }, "Enviar")) : null,
    ), CH.feedback ? h("section", { class: "panel" }, h("h2", null, "Correções da conversa"), feedbackView(CH.feedback)) : null];
  }

  /* ================================================================ ERROS */
  function viewErrors() {
    if (!S.errors.length) {
      return h("section", { class: "panel" }, h("h2", null, "Meus erros"),
        h("p", null, "Your personal error notebook. Every mistake the AI tutor finds in your texts and conversations is saved here, grouped by type, and turned into exercises."),
        h("p", { class: "muted" }, "Nothing here yet. Write a text or have a conversation in Tutor IA."),
        h("div", { class: "row" }, h("a", { class: "btn primary", href: "#tutor" }, "Ir para o Tutor IA")));
    }
    const types = {};
    for (const e of S.errors) (types[e.tipo || "outro"] ||= []).push(e);
    const sorted = Object.entries(types).sort((a, b) => b[1].length - a[1].length);
    const pending = S.errors.filter((e) => (e.fixed || 0) < 2).length;
    return [
      h("section", { class: "panel" },
        h("div", { class: "panel-head" }, h("h2", null, "Meus erros"), h("span", { class: "small muted num" }, `${S.errors.length} salvos · ${pending} para praticar`)),
        h("p", { class: "small" }, "An error leaves the practice list after you fix it correctly twice."),
        h("div", { style: "display:grid;gap:8px" }, sorted.map(([k, list]) => h("div", { style: "display:grid;grid-template-columns:minmax(120px,190px) 1fr auto;gap:10px;align-items:center" }, h("span", null, k), h("div", { class: "bar sun" }, h("i", { style: `width:${pct(list.length, sorted[0][1].length)}%` })), h("span", { class: "small num muted" }, String(list.length))))),
        h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", disabled: !pending, onclick: () => { go("gramatica"); setTimeout(() => startDrill("erros"), 0); } }, "Praticar meus erros"))),
      h("section", { class: "panel" }, h("h3", null, "Todos os erros"),
        h("div", { style: "display:grid;gap:10px" }, S.errors.map((e) => h("div", { class: "err" },
          h("div", { class: "fix" }, h("s", null, e.original), h("span", { "aria-hidden": "true" }, "→"), h("span", { class: "ok" }, e.correcao), h("span", { class: "tag" }, e.tipo), (e.fixed || 0) >= 2 ? h("span", { class: "tag" }, "dominado") : null),
          e.explicacao ? h("p", { class: "small" }, e.explicacao) : null,
          h("div", { class: "row", style: "justify-content:space-between" }, h("span", { class: "small muted" }, `${e.date} · ${e.src || ""}`), h("button", { class: "btn sm ghost", type: "button", onclick: () => { S.errors = S.errors.filter((x) => x.id !== e.id); save(); route(); } }, "Apagar")))))),
    ];
  }

  /* ================================================================ SETTINGS */
  function openSettings() {
    let confirmReset = false;
    const overlay = h("div", { class: "overlay", role: "dialog", "aria-modal": "true", "aria-labelledby": "settings-title" });
    const close = () => { overlay.remove(); document.removeEventListener("keydown", esc); route(); };
    const esc = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    const draw = () => {
      const newPer = h("input", { type: "number", id: "set-new", min: "0", max: "60", value: String(S.newPerDay) });
      newPer.addEventListener("change", () => { S.newPerDay = clamp(parseInt(newPer.value, 10) || 0, 0, 60); save(); });
      const start = h("input", { type: "date", id: "set-start", value: S.start });
      start.addEventListener("change", () => { if (start.value) { S.start = start.value; save(); } });
      const lang = h("select", { id: "set-lang" }, h("option", { value: "en", selected: S.lang === "en" }, "English"), h("option", { value: "pt", selected: S.lang === "pt" }, "Português (simples)"));
      lang.addEventListener("change", () => { S.lang = lang.value; save(); });
      const key = h("input", { type: "password", id: "set-key", placeholder: "sk-ant-…", value: AI.key(), autocomplete: "off" });
      key.addEventListener("change", () => { try { if (key.value.trim()) localStorage.setItem("rumo-ao-c1:apikey", key.value.trim()); else localStorage.removeItem("rumo-ao-c1:apikey"); } catch { /* */ } document.body.classList.toggle("no-ai", !AI.available()); });
      const imp = h("textarea", { id: "set-import", placeholder: "Cole aqui um backup (JSON) para restaurar", style: "min-height:80px" });
      modal.replaceChildren(
        h("div", { class: "panel-head" }, h("h2", { id: "settings-title" }, "Configurações"), h("button", { class: "btn sm ghost", type: "button", onclick: close }, "Fechar")),
        h("p", { class: "small muted" }, Store.mode === "cloud" ? "Your progress is saved to your Claude account and follows you across devices." : "Your progress is saved in this browser."),
        h("div", { class: "form-grid" },
          h("label", { for: "set-new" }, "Cartões novos por dia", newPer),
          h("label", { for: "set-start" }, "Início do programa (60 dias)", start),
          h("label", { for: "set-lang" }, "Idioma das explicações da IA", lang)),
        !AI.sample ? h("label", { for: "set-key" }, "Anthropic API key ", h("span", { class: "muted small" }, "(GitHub version only; stored in this browser, sent only to api.anthropic.com)"), key) : h("p", { class: "small" }, "AI: connected through Claude."),
        h("div", { style: "display:grid;gap:8px" }, h("h3", null, "Backup"),
          h("div", { class: "row" },
            h("button", { class: "btn sm", type: "button", onclick: () => navigator.clipboard.writeText(JSON.stringify(S)).then(() => toast("Backup copied."), () => toast("Copy was blocked by the browser.")) }, "Copiar backup"),
            h("button", { class: "btn sm", type: "button", onclick: () => { try { const p = JSON.parse(imp.value); if (!p || p.v !== 1) throw 0; S = { ...DEFAULT(), ...p, updatedAt: Date.now() }; buildCards(); save(); toast("Backup restored."); close(); } catch { toast("That doesn't look like a Rumo ao C1 backup."); } } }, "Restaurar backup")),
          imp),
        h("div", { class: "row" }, h("button", { class: "btn sm ghost", type: "button", style: confirmReset ? "border-color:var(--bad);color:var(--bad)" : "", onclick: () => {
          if (!confirmReset) { confirmReset = true; draw(); return; }
          S = { ...DEFAULT(), updatedAt: Date.now() }; buildCards(); save(); R.started = false; R.cur = null; G.topic = null; toast("Progress reset."); close();
        } }, confirmReset ? "Clique de novo para apagar TODO o progresso" : "Apagar todo o progresso")),
      );
    };
    const modal = h("div", { class: "modal" });
    overlay.append(modal); document.body.append(overlay); draw();
    setTimeout(() => { const f = modal.querySelector("input,select,button"); if (f) f.focus(); }, 0);
  }
  document.getElementById("settingsBtn").addEventListener("click", openSettings);

  /* keyboard shortcuts for flashcards */
  document.addEventListener("keydown", (e) => {
    if (currentView !== "cartoes" || cardsTab !== "revisar" || !R.cur) return;
    if (document.querySelector(".overlay")) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if ((e.key === " " || e.key === "Enter") && !R.flipped) { e.preventDefault(); R.flipped = true; route(); }
    else if (R.flipped && ["1", "2", "3", "4"].includes(e.key)) { e.preventDefault(); grade(Number(e.key) - 1); }
  });

  /* ---------------------------------------------------------------- boot */
  const local = Store.loadLocal();
  if (local && local.v === 1) S = { ...DEFAULT(), ...local };
  buildCards();
  route();
  Voice.init(); Mic.init(); AI.init(); Store.connect();
  window.addEventListener("pagehide", () => { Store.saveLocal(); Store.flush(); });

  // exposed for tests
  window.__rumo = { schedule, checkAnswer, norm, deaccent, slug };
})();
