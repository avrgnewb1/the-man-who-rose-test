// Where the Lost Still Stand: vertical scroll reader (logic only; styling lives in css/, Juno's engine/ui/webtoon drops in).
// Reuses the VN data: window.SCENES (scenes.js), ASSETS/CGS/MUSIC/FLAG_MAP/... (config.js), ASSET_FILES (manifest), SPRITE_NORM.
(() => {
const S = window.SCENES, A = window.ASSETS, M = window.MUSIC, U = window.UI_COPY, F = window.ASSET_FILES || {}, D = A.dirs;
const EPISODES = S.map((s, i) => ({ i, id: s.id, title: s.title, part: s.part }));
const SAVE_KEY = "wtls_save_v1", PREF_KEY = "wtls_prefs_v1";
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = s => esc(s).replace(/\[([^\]]+)\]/g, "<i>[$1]</i>");

// ---------- asset resolution (same rules as the VN engine) ----------
const has = (k, f) => (F[k] || []).includes(f);
const stem = n => n.replace(/\.[a-z0-9]+$/i, "");
function mangaFor(kind, name) { const MM = (window.MANGA || {})[kind]; if (!MM) return null; const f = MM[stem(name).replace(/_v\d+$/, "")];
  const g = f && (F.manga || []).find(x => stem(x) === stem(f)); return g ? D.manga + g : null; }
function resolve(kind, name) { if (!name) return null; { const m = mangaFor(kind, name); if (m) return m; }
  if (/\.[a-z0-9]+$/i.test(name)) { if (has(kind, name)) return D[kind] + name; const same = (F[kind] || []).find(f => stem(f) === stem(name)); if (same) return D[kind] + same; name = stem(name); }
  let best = null, bv = -1; for (const f of F[kind] || []) { const m = f.match(/^(.*?)(?:_v(\d+))?\.(png|jpe?g|webp|ogg|mp3|wav)$/i);
    if (m && m[1] === name) { const v = m[2] ? +m[2] : 0; if (v > bv) { bv = v; best = f; } } } return best ? D[kind] + best : null; }
const bgUrl = (id, desc) => { const bd = ((window.BG_BY_DESC || {})[id] || []).find(([k]) => (desc || "").toLowerCase().includes(k));
  return (bd && resolve("bg", bd[1])) || resolve("bg", "bg_" + id) || resolve("bg", A.bg[id]) || null; };
const charOf = id => { const c = id.replace(/_age\d+$/, ""); return (window.SPRITE_ID_ALIAS || {})[c] || c; };
const moodOf = e => Object.keys(window.EXPR_MOOD || {}).find(m => window.EXPR_MOOD[m].includes(e)) || "neutral";
function spriteUrl(id, expr, scene) { const ch = charOf(id), pf = (((window.SPRITE_POSES || {})[scene] || {})[ch] || {})[expr];
  if (pf) { const u = resolve("sprites_v3", ch + "/" + pf); if (u) return u; }
  const c = []; for (const k of [id, ch]) if (A.sprites[k]) c.push(A.sprites[k].replace("{expr}", expr));
  for (const k of new Set([id, ch])) c.push(`${k}/${expr}.png`, `${k}/${k}_${expr}.png`, `${k}/${moodOf(expr)}.png`, `${k}/neutral.png`);
  for (const r of c) { const u = resolve("sprites", r); if (u) return u; } return null; }
const canOgg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return false; } })();
function audioUrl(kinds, base) { const order = canOgg ? ["ogg", "mp3"] : ["mp3", "ogg"];
  for (const x of order) for (const k of kinds) { const u = resolve(k, base.replace(/\.(ogg|mp3)$/, "") + "." + x); if (u && u.endsWith("." + x)) return u; } return null; }
const sfxSlug = d => d.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
const sfxUrl = desc => { const slug = sfxSlug(desc), mapped = A.sfx[slug]; return audioUrl(["sfx"], mapped || slug); };

// ---------- script -> panels ----------
// A panel = one frame of art (bg + sprites, or a CG) plus up to 3 lines shown as balloons/captions under it (temporary until true manga panels land).
function compile(scene, ops, st, flags, out) {
  let cur = null;
  const snapshot = () => ({ bg: st.bg, sprites: st.sprites.map(s => ({ ...s })), cg: st.cg, flashback: st.flashback });
  const flush = () => { if (cur && (cur.lines.length || cur.cues.length || cur.force)) out.push(cur); cur = null; };
  const open = () => { if (!cur) cur = { scene: scene.id, art: snapshot(), lines: [], cues: [], music: st.music, amb: [...st.amb] }; return cur; };
  const setMusic = c => { if (c === undefined) return; st.music = c === null ? null : typeof c === "string" ? { track: c } : c; open().music = st.music; };
  for (let i = 0; i < ops.length; i++) { const op = ops[i];
    switch (op.op) {
      case "bg": { flush(); const G = window.BG_GROUP || {}, g = x => G[x] || x; if (st.bg && g(st.bg.id) !== g(op.id)) st.amb = [];
        st.bg = { id: op.id, desc: op.desc }; st.sprites = []; if (st.cgOp) { st.cg = null; st.cgOp = false; }
        setMusic((M.bgCues || {})[scene.id + ":" + op.id]); break; }
      case "sprite": { const ch = charOf(op.id); if (cur && cur.lines.length) flush(); st.sprites = st.sprites.filter(s => charOf(s.id) !== ch);
        st.sprites.push({ id: op.id, expr: (op.desc || "neutral").split(",")[0].trim() }); if (st.sprites.length > 3) st.sprites.shift(); if (cur) cur.art = snapshot(); break; }
      case "cg": { const c = (window.CGS || []).find(c => c.id === op.id); if (c) { flush(); st.cg = c.id; st.cgOp = true; } break; }
      case "flashback": flush(); st.flashback = !!op.on; break;
      case "music": setMusic((M.tags[scene.id] || [])[st.musicTag++]); break;
      case "sfx": { const u = sfxUrl(op.desc); const loop = u && /_loop\./.test(u); if (loop && !st.amb.includes(u)) st.amb.push(u);
        const p = open(); p.cues.push({ kind: loop ? "amb" : "sfx", url: u, desc: op.desc }); p.amb = [...st.amb]; break; }
      case "voice": open().cues.push({ kind: "voice", url: audioUrl(["voice"], op.id), id: op.id }); break;
      case "fx": case "fade": flush(); break;
      case "say": {
        for (const lp of window.LINE_POSE || []) if (lp[0] === scene.id && op.text.includes(lp[1])) { const ch = charOf(lp[2]); if (cur && cur.lines.length) flush(); st.sprites = st.sprites.filter(s => charOf(s.id) !== ch); st.sprites.push({ id: lp[2], expr: lp[3] }); if (cur) cur.art = snapshot(); }
        const curCg = (window.CGS || []).find(c => c.id === st.cg), nx = (window.CGS || []).find(c => c.scene === scene.id && !c.op && [].concat(c.show || []).some(x => op.text.includes(x)));
        if (nx && nx.id !== st.cg) { flush(); st.cg = nx.id; } else if (curCg && curCg.hide && op.text.includes(curCg.hide)) { flush(); st.cg = null; }
        for (const c of M.lineCues || []) if (c.scene === scene.id && op.text.includes(c.at)) setMusic(c);
        const p = open(); if (p.lines.length >= 3) { flush(); open(); }
        cur.lines.push({ who: op.who, text: op.text, style: op.style }); break; }
      case "cond": { const o = op.options.find(o => (flags[o.key] || 0) > 0); if (o) { flush(); compile(scene, o.ops, st, flags, out); } break; }
      case "choice": { flush(); out.push({ choice: true, scene: scene.id, op, art: snapshot(), music: st.music, amb: [...st.amb], rest: ops.slice(i + 1) }); return "choice"; }
      case "chapter_end": flush(); out.push({ end: true, scene: scene.id, text: op.text, music: st.music, amb: [...st.amb], art: snapshot() }); break;
    }
  }
  flush(); return "done";
}

// ---------- state ----------
let save = JSON.parse(localStorage.getItem(SAVE_KEY) || "null") || { picks: {}, flags: { ...window.FLAGS_INIT }, at: null };
const prefs = { audio: false, fs: 1, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; prefs.audio = false;   // audio stays off until a tap each session
const persist = () => localStorage.setItem(SAVE_KEY, JSON.stringify(save));
const reader = $(".wt-reader"); let strip = reader;
let pid = 0;
const rows = [];   // rendered panel records

function render(fromEpisode, st) {
  // walk episodes in order; stop at the first unanswered choice
  for (let e = fromEpisode; e < S.length; e++) {
    const sc = S[e];
    if (e === fromEpisode && st.resume) { st.resume = false; } else {
      st.musicTag = 0; st.sprites = []; st.cg = null; st.flashback = false;
      const ss = (M.sceneStart || {})[sc.id]; if (ss !== undefined) st.music = ss === null ? null : typeof ss === "string" ? { track: ss } : ss;
      if (e === 0 || S[e - 1].part !== sc.part || e === fromEpisode) addHeader(sc); else addHeader(sc, true);
      st.ops = sc.ops; }
    const out = []; const r = compile(sc, st.ops, st, save.flags, out);
    out.forEach(p => addPanel(p));
    if (r === "choice") { const ch = out[out.length - 1], cid = sc.id;
      const pick = save.picks[cid];
      if (pick) { applyPick(ch, pick, st, e, true); return; }
      addChoice(ch, st, e); return; }
  }
  addFin();
}
function addHeader(sc, minor) { const h = el("section", "wt-episode" + (minor ? " wt-episode--minor" : "")); h.id = "ep-" + sc.id; h.dataset.episode = sc.id;
  const part = sc.part === 2 ? (U.parts?.[2]?.num || "Part 2") : (U.chapter?.num || "Chapter 1");
  h.append(el("p", "wt-episode__num", part), el("h2", "wt-episode__title", sc.title)); strip.append(h); }
function artBox(art, scene) {
  const box = el("div", "wt-art"); if (art.flashback) box.classList.add("wt-flashback");
  const cg = art.cg && (window.CGS || []).find(c => c.id === art.cg), cgU = cg && resolve("cg", cg.file);
  const add = (u, cls, alt) => { if (!u) return null; const im = el("img", cls); im.alt = alt || ""; im.dataset.src = u; im.decoding = "async"; box.append(im); return im; };
  if (cgU) { const im = add(cgU, "wt-art__cg"); if (window.CG_FOCUS?.[cg.id]) im.style.objectPosition = window.CG_FOCUS[cg.id]; box.classList.add("is-cg"); return box; }
  const bu = art.bg && bgUrl(art.bg.id, art.bg.desc);
  if (bu) add(bu, "wt-art__bg"); else box.style.background = (window.BG_SOLID || {})[art.bg?.id] || "#2a2733";
  const tint = art.bg && bu && bu !== resolve("bg", "bg_" + art.bg.id) && (A.bgTint || {})[art.bg.id]; if (tint) { const t = el("div", "wt-art__tint"); t.style.background = tint; box.append(t); }
  if (art.sprites.length) { const row = el("div", "wt-art__sprites"); box.append(row);
    art.sprites.forEach(s => { const u = spriteUrl(s.id, s.expr, scene); if (!u) return; const ch = charOf(s.id), im = el("img", "wt-sprite"); im.alt = ""; im.dataset.src = u; im.decoding = "async";
      const m = u.match(/sprites_v3\/([^/]+\/[^/.]+)\./), n = m && (window.SPRITE_NORM || {})[m[1]];
      const kid = /^(azriel|zeke|neil|lacy|devon|michael|big_kid)$/.test(ch), h = n ? 88 * ((window.CHAR_HEIGHT || {})[ch] ?? 1) * n.h : (kid ? 62 : 84);
      im.style.height = Math.min(h, 96) + "%"; im.style.maxWidth = (100 / art.sprites.length - 2) + "%"; if (n && n.oy) im.style.transform = `translateY(${n.oy * 100}%)`; row.append(im); }); }
  return box; }
function addPanel(p) { if (p.choice) return;
  if (p.end) { const e = el("section", "wt-panel wt-panel--end"); e.id = "p" + (++pid); e.dataset.panelId = e.id; e.append(el("p", "wt-end__text", p.text)); reg(e, p); strip.append(e); return; }
  const sec = el("section", "wt-panel"); sec.id = "p" + (++pid); sec.dataset.panelId = sec.id; sec.dataset.scene = p.scene;
  sec.append(artBox(p.art, p.scene));
  if (p.lines.length) { const t = el("div", "wt-text");
    p.lines.forEach(l => { const nar = l.who === "NARRATION", b = el("div", nar ? "wt-caption" : "wt-balloon");
      if (l.style) b.classList.add("wt-" + l.style);
      if (!nar) { const n = el("span", "wt-balloon__name", U.names[l.who] ?? (l.who.charAt(0) + l.who.slice(1).toLowerCase())); b.append(n); }
      const tx = el("p", "wt-line"); tx.innerHTML = fmt(l.text); b.append(tx); t.append(b); });
    sec.append(t); }
  reg(sec, p); strip.append(sec); }
function reg(node, p) { rows.push({ node, p }); io.observe(node); near.observe(node); }
function addChoice(ch, st, e) {
  const sc = S[e], cid = sc.id, hold = el("div", "wt-hold"); hold.setAttribute("aria-hidden", "true"); strip.append(hold);
  const sec = el("section", "wt-choice"); sec.id = "p" + (++pid); sec.dataset.choiceId = cid; sec.setAttribute("aria-label", "Choice");
  const cp = el("div", "wt-panel"); cp.dataset.panelId = sec.id + "-art"; cp.append(artBox(ch.art, sc.id)); sec.append(cp);
  const list = el("div", "wt-choice__options"); list.setAttribute("role", "group");
  ch.op.options.forEach(o => { const b = el("button", "btn wt-choice-option"); b.type = "button"; b.dataset.optionId = o.key; b.setAttribute("aria-pressed", "false");
    const fl = Object.keys((window.FLAG_MAP[cid] || {})[o.key] || {}); if (fl.length) b.dataset.flag = fl.join(" ");
    b.textContent = (U.choices?.[cid]?.[o.key]) || o.text; b.addEventListener("click", () => choose(ch, o.key, st, e, sec)); list.append(b); });
  sec.append(list); reg(sec, ch); strip.append(sec);
  const seen = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { emit("wt:choice-shown", { choiceId: cid }); seen.disconnect(); } }), { threshold: 0.5 }); seen.observe(sec); }
function choose(ch, key, st, e, sec) { const cid = S[e].id; if (save.picks[cid]) return;
  const flag = (window.FLAG_MAP[cid] || {})[key] || {}; Object.entries(flag).forEach(([f, v]) => save.flags[f] = (save.flags[f] || 0) + v);
  save.picks[cid] = key; persist(); sec.classList.add("is-chosen"); sec.querySelectorAll(".wt-choice-option").forEach(b => { const me = b.dataset.optionId === key; b.disabled = !me; b.setAttribute("aria-pressed", me); b.classList.toggle("is-picked", me); });
  emit("wt:choice", { choiceId: cid, optionId: key, flag });
  applyPick(ch, key, st, e, false); }
function applyPick(ch, key, st, e, replay) {
  if (replay) { // resumed save: show the choice already answered
    const sec = el("section", "wt-choice is-chosen"); sec.id = "p" + (++pid); sec.dataset.choiceId = S[e].id; const cp = el("div", "wt-panel"); cp.dataset.panelId = sec.id + "-art"; cp.append(artBox(ch.art, S[e].id)); sec.append(cp);
    const list = el("div", "wt-choice__options"); list.setAttribute("role", "group"); ch.op.options.forEach(o => { const b = el("button", "btn wt-choice-option" + (o.key === key ? " is-picked" : "")); b.setAttribute("aria-pressed", o.key === key); b.disabled = o.key !== key; b.dataset.optionId = o.key; b.textContent = (U.choices?.[S[e].id]?.[o.key]) || o.text; list.append(b); });
    sec.append(list); reg(sec, ch); strip.append(sec); }
  const opt = ch.op.options.find(o => o.key === key); const br = el("div", "wt-branch"); br.dataset.branch = key; reader.append(br);
  const out = []; compile(S[e], opt.ops, st, save.flags, out); strip = br; out.forEach(p => addPanel(p)); strip = reader;
  st.ops = ch.rest; st.resume = true; render(e, st); }
function addFin() { const f = el("section", "wt-fin"); f.id = "fin"; f.append(el("p", "wt-fin__text", "To be continued.")); strip.append(f); window.__WT_DONE = true; }

// ---------- lazy load + decode ahead (no layout shift: the art frame has a fixed aspect ratio) ----------
const near = new IntersectionObserver(es => es.forEach(x => { if (!x.isIntersecting) return; x.target.querySelectorAll("img[data-src]").forEach(im => { im.src = im.dataset.src; im.removeAttribute("data-src"); im.decode?.().then(() => im.classList.add("is-ready")).catch(() => im.classList.add("is-ready")); }); near.unobserve(x.target); }), { rootMargin: "200% 0px" });

// ---------- audio: scroll-position cues ----------
const AU = { on: false, music: [new Audio(), new Audio()], cur: 0, track: null, amb: new Map(), fired: new Set(), log: [], duck: 1, vol: 0.7 };
AU.music.forEach(a => { a.loop = true; a.preload = "none"; a.setAttribute("playsinline", ""); });
function ramp(a, to, sec, done) { const from = a.volume, t0 = performance.now(), d = Math.max(0.01, sec) * 1000; cancelAnimationFrame(a._r);
  const step = () => { const k = Math.min(1, (performance.now() - t0) / d); a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k < 1) a._r = requestAnimationFrame(step); else done && done(); }; step(); }
function playMusic(c) { const name = c ? c.track : null, gain = (c && c.gain) ?? 1; const want = name ? AU.vol * gain * AU.duck : 0;
  if (name === AU.track) { const a = AU.music[AU.cur]; if (name) ramp(a, want, 1.5); return; }
  const old = AU.music[AU.cur]; ramp(old, 0, (c && c.fadeOut) ?? M.crossfade ?? 3, () => old.pause()); AU.track = name; if (!name) return;
  const url = audioUrl(["music", "music_later"], name); if (!url) return; AU.cur ^= 1; const a = AU.music[AU.cur]; a.src = url; a.volume = 0;
  a.play().then(() => ramp(a, want, (c && c.fadeIn) ?? M.fadeIn ?? 2)).catch(e => { if (e.name !== "AbortError") AU.log.push({ err: e.name, url }); });
  AU.log.push({ kind: "music", id: name, t: Math.round(performance.now()) }); emit("wt:cue", { kind: "music", id: name }); }
function setAmb(list) { const want = new Set(list.filter(Boolean));
  for (const [u, a] of AU.amb) if (!want.has(u)) { ramp(a, 0, 1.2, () => a.pause()); AU.amb.delete(u); }
  for (const u of want) if (!AU.amb.has(u)) { const a = new Audio(u); a.loop = true; a.volume = 0; AU.amb.set(u, a); a.play().then(() => ramp(a, 0.6, 1.2)).catch(() => {}); const id = u.split("/").pop(); AU.log.push({ kind: "amb", id }); emit("wt:cue", { kind: "amb", id }); } }
function oneShot(c, key) { if (AU.fired.has(key) || !c.url) return; AU.fired.add(key); const a = new Audio(c.url); a.volume = c.kind === "voice" ? 1 : 0.8;
  if (c.kind === "voice") { AU.duck = 0.32; const m = AU.music[AU.cur]; ramp(m, m.volume * 0.32, 0.4); a.onended = () => { AU.duck = 1; ramp(AU.music[AU.cur], AU.vol, 1.5); }; }
  a.play().catch(() => {}); const id = c.url.split("/").pop(); AU.log.push({ kind: c.kind === "voice" ? "voice" : "sfx", id }); emit("wt:cue", { kind: c.kind === "voice" ? "sfx" : "sfx", id }); }
let active = null;
function enterPanel(r, down) { active = r; const p = r.p; save.at = r.node.id; persist(); emit("wt:panel-enter", { panelId: r.node.id });
  if (!AU.on) return; playMusic(p.music); setAmb(p.amb || []); if (down) (p.cues || []).forEach((c, k) => c.kind !== "amb" && oneShot(c, r.node.id + ":" + k)); }
let lastY = scrollY;
const io = new IntersectionObserver(es => { const down = scrollY >= lastY; lastY = scrollY; es.forEach(x => { if (x.isIntersecting) { const r = rows.find(r => r.node === x.target); if (r && r !== active) enterPanel(r, down); } }); }, { rootMargin: "-45% 0px -45% 0px" });
function setAudio(on) { AU.on = on; prefs.audio = on; localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); document.querySelectorAll(".wt-audio-toggle").forEach(b => { b.setAttribute("aria-pressed", on); b.classList.toggle("is-on", on); if (b.dataset.wtLabel !== "static") b.textContent = on ? "♪ On" : "♪ Off"; });
  emit("wt:audio-toggle", { on });
  if (on) { if (active) { playMusic(active.p.music); setAmb(active.p.amb || []); } } else { AU.music.forEach(a => ramp(a, 0, 0.5, () => a.pause())); AU.track = null; setAmb([]); } }
document.addEventListener("visibilitychange", () => { if (document.hidden) { AU.music.forEach(a => a.pause()); AU.amb.forEach(a => a.pause()); } else if (AU.on) { AU.music[AU.cur].src && AU.track && AU.music[AU.cur].play().catch(() => {}); AU.amb.forEach(a => a.play().catch(() => {})); } });

// ---------- menu ----------
const menu = $(".wt-menu");
function openMenu() { menu.hidden = false; $(".wt-topbar")?.classList.remove("is-hidden"); emit("wt:menu-open", {}); const list = $(".wt-menu__chapters", menu); list.innerHTML = "";
  EPISODES.forEach(ep => { const t = document.getElementById("ep-" + ep.id), b = el("button", "wt-menu__chapter", ep.title); b.type = "button"; b.disabled = !t;
    b.addEventListener("click", () => { closeMenu(); t.scrollIntoView({ behavior: "instant", block: "start" }); }); list.append(b); }); }
function closeMenu() { menu.hidden = true; emit("wt:menu-close", {}); }
const setFs = v => { prefs.fs = Math.max(0.85, Math.min(1.4, v)); document.documentElement.style.setProperty("--wt-fs", prefs.fs); localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); };
document.addEventListener("click", ev => { if (ev.target.closest("[data-wt-menu-open]")) return openMenu(); if (ev.target.closest("[data-wt-menu-close]")) return closeMenu(); if (ev.target === menu) return closeMenu();
  const t = ev.target.closest("[data-wt]"); if (!t) return; const a = t.dataset.wt;
  if (a === "audio") setAudio(!AU.on); else if (a === "menu") openMenu(); else if (a === "close") closeMenu();
  else if (a === "resume") { closeMenu(); const n = save.at && document.getElementById(save.at); (n || strip.lastElementChild).scrollIntoView({ block: "center" }); }
  else if (a === "restart") { localStorage.removeItem(SAVE_KEY); location.replace(location.pathname); }
  else if (a === "fs-up") setFs(prefs.fs + 0.1); else if (a === "fs-down") setFs(prefs.fs - 0.1); });
addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) closeMenu(); });
setFs(prefs.fs);
// top bar hides on scroll down (WEBTOON-SPEC), shows on scroll up / near the top
let barY = scrollY; addEventListener("scroll", () => { const bar = $(".wt-topbar"); if (!bar) return; const y = scrollY; if (y < 80 || y < barY) bar.classList.remove("is-hidden"); else if (y > barY + 4 && menu.hidden) bar.classList.add("is-hidden"); barY = y; }, { passive: true });
if (matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("reduce-motion");

// ---------- boot ----------
const resumeAt = save.at; const st = { bg: null, sprites: [], cg: null, music: null, amb: [], musicTag: 0 };
render(0, st);
if (resumeAt && document.getElementById(resumeAt)) requestAnimationFrame(() => document.getElementById(resumeAt).scrollIntoView({ block: "center" }));
window.WT = { get save() { return save; }, get audioLog() { return AU.log; }, rows, setAudio };
})();
