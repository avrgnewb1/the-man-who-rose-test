(() => {
const $ = s => document.querySelector(s);
const S = window.SCENES, A = window.ASSETS, U = window.UI_COPY, M = window.MUSIC;
let st, busy = false, log = [], auto = false, autoT = null;
const charOf = id => { if ((window.SPRITE_SILHOUETTE || []).includes(id)) return id; const c = id.replace(/_age\d+$/, ""); return (window.SPRITE_ID_ALIAS || {})[c] || c; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = s => esc(s).replace(/\[([^\]]+)\]/g, "<i>[$1]</i>");
const sid = () => S[st.scene].id;

function fresh(scene = 0) { return { scene, stack: [{ i: 0 }], flags: { ...window.FLAGS_INIT }, bg: null, sprites: [], speaker: null, cg: null, musicTag: 0, track: null }; }
function opsAt(depth) { let ops = S[st.scene].ops; for (let d = 1; d <= depth; d++) { const f = st.stack[d]; ops = ops[f.ci].options.find(o => o.key === f.key).ops; } return ops; }

// ---------- images: fetch + decode() before anything is shown ----------
const imgP = {}, imgReady = {};   // url -> Promise<HTMLImageElement|null>, url -> decoded element (kept referenced so it stays decoded)
function loadImg(url) {
  if (!url) return Promise.resolve(null);
  return imgP[url] ??= new Promise(res => {
    const im = new Image(); im.decoding = "async";
    const ok = () => { imgReady[url] = im; res(im); }, fail = () => res(null);
    im.onerror = fail; im.src = url;
    if (im.decode) im.decode().then(ok, () => (im.complete && im.naturalWidth ? ok() : fail()));
    else im.onload = ok;
  });
}
const preloadAll = urls => Promise.all([...new Set(urls.filter(Boolean))].map(loadImg));
function firstLoadable(urls) { return loadImg(urls[0]).then(i => (i ? urls[0] : null)); }
const D = A.dirs, F = window.ASSET_FILES || {};
const has = (kind, f) => (F[kind] || []).includes(f);
function resolve(kind, name) { // filename, or base name -> newest _vN version present
  if (!name) return null; if (/\.[a-z0-9]+$/i.test(name)) { if ((F[kind] || []).includes(name)) return D[kind] + name; name = name.replace(/\.[a-z0-9]+$/i, ""); const same = (F[kind] || []).find(f => f.replace(/\.[a-z0-9]+$/i, "") === name); if (same) return D[kind] + same; }
  let best = null, bv = -1; for (const f of F[kind] || []) { const m = f.match(/^(.*?)(?:_v(\d+))?\.(png|jpe?g|webp|ogg|mp3|wav)$/i);
    if (m && m[1] === name) { const v = m[2] ? +m[2] : 0, pin = (A.preferVersion || {})[kind];
      const score = pin != null && v === pin ? 1e9 : v; if (score > bv) { bv = score; best = f; } } }
  return best ? D[kind] + best : null; }
window.__resolve = resolve;
const bgByDesc = (id, desc) => { const m = ((window.BG_BY_DESC || {})[id] || []).find(([k]) => (desc || "").toLowerCase().includes(k)); return m ? resolve("bg", m[1]) : null; };
const bgCandidates = (id, desc) => [bgByDesc(id, desc), resolve("bg", "bg_" + id), resolve("bg", A.bg[id])].filter(Boolean);
const moodOf = e => Object.keys(window.EXPR_MOOD).find(m => window.EXPR_MOOD[m].includes(e)) || "neutral";
const poseFile = (id, expr, scene) => { const ch = charOf(id), f = (((window.SPRITE_POSES || {})[scene] || {})[ch] || {})[expr]; return f ? resolve("sprites_v3", ch + "/" + f) : null; };
function spriteCandidates(id, expr, scene) { const ch = charOf(id), c = []; { const pf = poseFile(id, expr, scene ?? (st && sid())); if (pf) return [pf]; } { const al = (window.SPRITE_ID_ALIAS || {})[id.replace(/_age\d+$/, "")]; if (al) id = al; } if ((window.SPRITE_SILHOUETTE || []).includes(id)) return [];
  for (const k of [id, ch]) if (A.sprites[k]) c.push(D.sprites + A.sprites[k].replace("{expr}", expr));
  if (A.probeSprites) for (const k of [...new Set([id, ch])]) c.push(`${D.sprites}${k}/${expr}.png`, `${D.sprites}${k}/${k}_${expr}.png`, `${D.sprites}${k}/${moodOf(expr)}.png`, `${D.sprites}${k}/neutral.png`);
  return [...new Set(c.map(u => resolve("sprites", u.slice(D.sprites.length))).filter(Boolean))]; }
function bgPlaceholder(id, desc) { const p = id + " " + desc, g =
  /dusk|sunset|orange/.test(p) ? ["#2a2238","#c8794a"] : /night|storm|monsoon/.test(p) ? ["#2a2238","#14121c"] :
  /morning/.test(p) ? ["#e3c79a","#8a98a8"] : /noon|day|afternoon/.test(p) ? ["#8fb8d8","#c8a878"] : ["#6b4a6e","#2b1d18"];
  return `linear-gradient(180deg,${g[0]},${g[1]})`; }
const bgUrl = (id, desc, scene) => { const u = bgCandidates(id, desc)[0] || null, f = (window.BG_FORBID || {})[scene ?? (st && S[st.scene] && S[st.scene].id)];
  if (u && f && new RegExp(f).test(u)) { console.error(`bg ${id} resolved to forbidden ${u}`); return null; } return u; };
let bgSeq = 0;
async function setBg(id, desc, instant) {
  st.bg = { id, desc }; const my = ++bgSeq, el = $("#bg"), url = bgUrl(id, desc);
  if (url) await loadImg(url);              // normally already decoded by preloadAhead(); never swap before decode
  if (my !== bgSeq) return;                  // a newer bg won
  const cur = [...el.querySelectorAll(".bg-layer.on")].pop();          // topmost
  if (cur && cur.dataset.key === id + "|" + url) return;
  const layer = document.createElement("div"); layer.className = "bg-layer"; layer.dataset.key = id + "|" + url;
  if (url && imgReady[url]) {
    const exact = url === resolve("bg", "bg_" + id) || url === bgByDesc(id, desc), tint = !exact && (A.bgTint || {})[id];
    const img = imgReady[url].cloneNode(); img.alt = ""; layer.appendChild(img);
    if (tint) { const t = document.createElement("div"); t.className = "bg-tint"; t.style.background = tint; layer.appendChild(t); }
  } else {
    const solid = (window.BG_SOLID || {})[id];
    layer.style.background = solid || (A.showPlaceholderLabels === false ? "#14121c" : bgPlaceholder(id, desc));
    if (A.showPlaceholderLabels !== false && id !== "black") { const ph = document.createElement("div"); ph.className = "ph"; ph.textContent = `[placeholder BG] ${id}`; layer.appendChild(ph); }
  }
  el.classList.remove("bg-desert"); el.appendChild(layer);
  const finish = () => { if (my === bgSeq) el.querySelectorAll(".bg-layer").forEach(l => l !== layer && l.remove()); };
  if (instant || !cur) { layer.classList.add("on", "now"); el.querySelectorAll(".bg-layer").forEach(l => l !== layer && l.remove());
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove("now"))); return; }   // VN-T10: re-enable the crossfade
  cur.classList.remove("now");
  // the new layer fades in ON TOP of the old one, which stays fully opaque until it is removed (no see-through dip)
  requestAnimationFrame(() => requestAnimationFrame(() => { layer.classList.add("on"); setTimeout(finish, 450); }));
}
function silhouette(ch, expr, bare) {
  const col = window.CHAR_COLORS[ch] || "#3b3946", kid = /^(azriel|zeke|neil|lacy|devin|michael|big_kid)(_age\d+)?$/.test(ch), hr = kid ? 26 : 30, by = kid ? 120 : 100;
  if (ch === "hercules") return `<svg viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg"><g fill="${col}" opacity=".85"><ellipse cx="100" cy="420" rx="70" ry="38"/><circle cx="150" cy="370" r="28"/><rect x="45" y="430" width="16" height="60"/><rect x="135" y="430" width="16" height="60"/></g></svg>`;
  if (bare) return `<svg viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg"><g fill="${col}" opacity=".85"><circle cx="100" cy="${by-hr-8}" r="${hr}"/><path d="M${kid?60:50} ${by} Q100 ${by-14} ${kid?140:150} ${by} L${kid?150:162} ${kid?330:300} L${kid?132:140} 500 L68 500 L${kid?50:38} ${kid?330:300} Z"/></g></svg>`;
  return `<svg viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg"><g fill="${col}" stroke="#0006" stroke-width="3">
  <circle cx="100" cy="${by-hr-8}" r="${hr}"/><path d="M${kid?60:50} ${by} Q100 ${by-14} ${kid?140:150} ${by} L${kid?150:162} ${kid?330:300} L${kid?132:140} 500 L68 500 L${kid?50:38} ${kid?330:300} Z"/></g>
  <text x="100" y="${kid?360:330}" font-family="system-ui" font-size="17" font-weight="700" text-anchor="middle" fill="#fff">${esc(ch)}</text>
  <text x="100" y="${kid?382:352}" font-family="system-ui" font-size="14" text-anchor="middle" fill="#fffc">${esc(expr)}</text></svg>`;
}
const spriteUrl = (id, expr, scene) => spriteCandidates(id, expr, scene)[0] || null;
// Posed (v3) sprites: drawn at CHAR_HEIGHT x the alpha-bbox normalisation from js/sprite_norm.js, so every pose has the same scale.
function posed(d, ch, url) { const m = url && url.match(/sprites_v3\/([^/]+\/[^/.]+)\.[a-z0-9]+$/i), n = m && (window.SPRITE_NORM || {})[m[1]];
  d.classList.toggle("posed", !!n); if (!n) { d.style.removeProperty("--s"); d.style.removeProperty("--oy"); return; }
  d.style.setProperty("--s", ((window.CHAR_HEIGHT || {})[ch] ?? 1) * n.h); d.style.setProperty("--oy", n.oy);
  d.classList.toggle("cut", !!n.cut); d.style.setProperty("--cut", n.cut || 0); }
function renderSprites() { const box = $("#sprites"), keep = new Set();
  st.sprites.forEach((s, idx) => { const ch = charOf(s.id), url = spriteUrl(s.id, s.expr), key = url || "sil:" + ch + ":" + s.expr; keep.add(ch);
    let d = box.querySelector(`.sprite[data-ch="${ch}"]`);
    if (!d) { d = document.createElement("div"); d.className = "sprite"; d.dataset.ch = ch; }
    if (d.dataset.key !== key) {
      if (url && imgReady[url]) { const img = imgReady[url].cloneNode(); img.alt = s.id; d.replaceChildren(img); d.dataset.key = key; posed(d, ch, url); }
      else if (!url) posed(d, ch, null);
      else if (url) { loadImg(url).then(() => { if (st.sprites.some(x => charOf(x.id) === ch)) renderSprites(); }); if (!d.firstChild) d.style.visibility = "hidden"; }
      else { if ((window.SPRITE_SILHOUETTE || []).includes(ch)) d.innerHTML = silhouette(ch, s.expr, A.showPlaceholderLabels === false);   // planned stand-in: shape only in dist
        else if (A.showPlaceholderLabels === false) d.replaceChildren(); else d.innerHTML = silhouette(ch, s.expr); d.dataset.key = key; }
      if (d.dataset.key === key) d.style.visibility = "";
    }
    if (box.children[idx] !== d) box.insertBefore(d, box.children[idx] || null);
  });
  [...box.children].forEach(d => { if (!keep.has(d.dataset.ch)) d.remove(); });
  fitSprites(); dim(); }
// Keep a posed group on screen: one shared shrink factor (so relative sizes stay consistent).
function fitSprites() { const box = $("#sprites"); box.style.setProperty("--fit", 1);
  if (!box.querySelector(".sprite.posed")) return;
  const W = box.clientWidth * 0.96, gap = parseFloat(getComputedStyle(box).columnGap) || 0;   // synchronous: no oversized frame
  const tot = [...box.children].reduce((a, d) => a + d.getBoundingClientRect().width, 0), gaps = gap * Math.max(0, box.children.length - 1);
  if (tot + gaps > W) box.style.setProperty("--fit", Math.max(0.4, (W - gaps) / tot).toFixed(3)); }
addEventListener("resize", () => st && fitSprites());
function dim() { const sp = st.speaker && window.SPEAKER_SPRITE[st.speaker];
  document.querySelectorAll(".sprite").forEach(d => d.classList.toggle("dim", !!sp && d.dataset.ch !== sp && d.dataset.ch !== sp + "_adult")); }
function setSprite(id, expr) { const ch = charOf(id); st.sprites = st.sprites.filter(s => charOf(s.id) !== ch);
  st.sprites.push({ id, expr: (expr || "neutral").split(",")[0].trim() }); if (st.sprites.length > 3) st.sprites.shift(); renderSprites(); }
let cgSeq = 0;
function setCg(cg, instant) { st.cg = cg ? cg.id : null; const el = $("#cg"), my = ++cgSeq;
  const url = cg && resolve("cg", cg.file);
  const hide = then => { if (el.hidden || !el.classList.contains("on")) { el.classList.remove("on"); el.hidden = true; return then && then(); }
    el.classList.remove("on"); if (instant) { el.hidden = true; return then && then(); }
    setTimeout(() => { if (my !== cgSeq) return; el.hidden = true; el.removeAttribute("src"); then && then(); }, 420); };
  if (!url) return hide();
  const show = () => loadImg(url).then(im => { if (my !== cgSeq || !im) return;
    el.src = url; el.alt = cg.id; el.hidden = false;           // src already decoded -> paints immediately
    if (instant) { el.classList.add("on"); return; }
    requestAnimationFrame(() => requestAnimationFrame(() => my === cgSeq && el.classList.add("on"))); });
  if (!el.hidden && el.getAttribute("src") && el.getAttribute("src") !== url) hide(show); else show();
}
function cgCheck(text, instant) { // called before each line is shown
  const cur = window.CGS.find(c => c.id === st.cg);
  const nx = window.CGS.find(c => c.scene === sid() && resolve("cg", c.file) && [].concat(c.show).some(x => text.includes(x)));
  if (nx) setCg(nx, instant); else if (cur && cur.hide && text.includes(cur.hide)) setCg(null, instant);
}
function lineCue(text) { (M.lineCues || []).forEach(c => { if (c.scene === sid() && text.includes(c.at)) musicCue(c); }); }

// ---------- music (Web Audio, unlocked on first tap/key) ----------
// Music is STREAMED: two <audio> "decks" (preload="none") routed through ONE AudioContext for gain crossfades.
// Nothing is fetched until a cue actually plays, and a cue waits until the current scene's art is decoded,
// so music never competes with backgrounds on a phone connection. Same track = never restarted between scenes.
// iOS: only touchend/click/keydown are user activation (not touchstart); decks are "blessed" by a silent play()
// inside that gesture so later src changes can play; the context is resumed on every gesture/pageshow.
const audio = { ctx: null, master: null, decks: [], cur: null, want: null, wantOpts: {}, status: {}, ctxCount: 0, starts: [], seq: 0, blessed: false };
window.__AUDIO = audio;
const canOgg = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return false; } })();
const silentUrl = (() => { const n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: "audio/wav" })); })();
function trackUrl(name) { const order = canOgg ? ["ogg", "mp3"] : ["mp3", "ogg"];
  for (const k of ["music", "music_later"]) for (const x of order) if (has(k, name + "." + x)) return D[k] + name + "." + x; return null; }
function makeDeck() { const el = new Audio(); el.preload = "none"; el.loop = true; el.crossOrigin = "anonymous"; el.setAttribute("playsinline", "");
  const d = { el, name: null, gain: null, target: 0, tok: 0 };
  el.addEventListener("error", () => { if (d.name) audio.status[d.name] = "error " + (el.error && el.error.code); });
  el.addEventListener("canplay", () => { if (d.name) audio.status[d.name] = "streaming"; });
  if (audio.ctx) { d.gain = audio.ctx.createGain(); d.gain.gain.value = 0; audio.ctx.createMediaElementSource(el).connect(d.gain).connect(audio.master); }
  return d; }
function unlockAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!audio.ctx && AC) { audio.ctx = new AC(); audio.ctxCount++; audio.out = audio.ctx.createGain(); audio.out.connect(audio.ctx.destination);
    // buses: master = music, sfxBus = scene SFX/ambience, uiBus = UI clicks; all through out (mute)
    audio.master = audio.ctx.createGain(); audio.sfxBus = audio.ctx.createGain(); audio.uiBus = audio.ctx.createGain();
    // voice: music runs master -> duck -> out so a VOICE line can pull the music down without touching the user's music volume
    audio.duck = audio.ctx.createGain(); audio.voiceBus = audio.ctx.createGain(); audio.master.connect(audio.duck); audio.duck.connect(audio.out);
    [audio.sfxBus, audio.uiBus, audio.voiceBus].forEach(g => g.connect(audio.out)); applyVol(); }
  if (!audio.decks.length) audio.decks = [makeDeck(), makeDeck()];
  if (!audio.blessed) { audio.blessed = true; audio.decks.forEach(d => { if (d.name) return; d.el.src = silentUrl; const p = d.el.play(); p && p.then(() => { if (!d.name) d.el.pause(); }).catch(() => {}); }); }
  if (audio.ctx && audio.ctx.state !== "running") audio.ctx.resume().catch(() => {});
  if (!audio.cur && audio.want) playTrack(audio.want, audio.wantOpts);
}
function rampTo(d, v, secs) {
  if (d.gain && audio.ctx) { const p = d.gain.gain, t = audio.ctx.currentTime;
    if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { const now = p.value; p.cancelScheduledValues(t); p.setValueAtTime(now, t); }
    p.linearRampToValueAtTime(v, t + Math.max(0.02, secs)); }
  else { clearInterval(d.iv); const from = d.el.volume, t0 = performance.now(), ms = Math.max(20, secs * 1000);  // no Web Audio: element volume
    d.iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); d.el.volume = from + (v - from) * k; if (k >= 1) clearInterval(d.iv); }, 50); }
  d.target = v; }
let artIdle = Promise.resolve();   // resolves when the art currently being prepared is decoded
// VN-T11: cues are serialized (one at a time), each deck carries a token so a stale pause() can't hit a reused deck,
// and an AbortError from a superseded play() is ignored (a non-superseded one is retried once).
let musicChain = Promise.resolve();
function playTrack(name, opts = {}) {
  if (opts === true) opts = {};
  // T08/VN2-T02: a repeat request for the cue that is already pending (e.g. every tap re-running unlockAudio) must not supersede it
  if (name && audio.pending === name) return musicChain;
  audio.want = name; audio.wantOpts = opts; if (st) { st.track = name; st.trackOpts = opts; }
  audio.pending = name;
  const my = ++audio.seq; (audio.cueLog ||= []).push({ name, want: Math.round(performance.now()) });
  musicChain = musicChain.then(() => doPlay(name, opts, my)).catch(e => { audio.status.lastError = String(e); });
  return musicChain;
}
// VN2-T02/T08: fetch the tracks this scene (and the next scene's opener) can cue, low priority, after the art, so a cue starts from cache.
const warmed = new Set();
function warmTrack(name) { const u = name && trackUrl(name); if (!u || warmed.has(u)) return; warmed.add(u);
  artIdle.then(() => fetch(u, { priority: "low" }).then(r => r.ok && r.arrayBuffer()).catch(() => warmed.delete(u))); }
const cueTrack = c => !c ? null : typeof c === "string" ? c : c.track;
function warmSceneMusic(i) { const sc = S[i]; if (!sc) return; const id = sc.id;
  [M.sceneStart[id], ...(M.tags[id] || []), ...Object.entries(M.bgCues || {}).filter(([k]) => k.startsWith(id + ":")).map(([, c]) => c),
   ...(M.lineCues || []).filter(c => c.scene === id)].map(cueTrack).forEach(warmTrack);
  if (S[i + 1]) warmTrack(cueTrack(M.sceneStart[S[i + 1].id])); }
async function doPlay(name, opts, my) { try { return await doPlay1(name, opts, my); } finally { if (my === audio.seq) audio.pending = null; } }
async function doPlay1(name, opts, my) {
  if (my !== audio.seq || !audio.decks.length) return;                // superseded, or not unlocked yet (unlockAudio replays want)
  const gain = opts.gain ?? 1, fadeIn = opts.fadeIn ?? M.fadeIn ?? M.crossfade, fadeOut = opts.fadeOut ?? (name ? M.crossfade : M.stopFade);
  const old = audio.cur;
  if (old && old.name === name) { if (Math.abs(old.target - gain) > 0.01) rampTo(old, gain, fadeIn); return; }  // never restart the same loop
  if (old) { rampTo(old, 0, fadeOut); const tok = ++old.tok; old.name = null;
    setTimeout(() => { if (old.tok === tok && audio.cur !== old) old.el.pause(); }, fadeOut * 1000 + 150); audio.cur = null; }
  if (!name) return;
  await Promise.race([artIdle, new Promise(r => setTimeout(r, 1200))]);   // art first, but never hold a cue more than 1.2 s (3G: VN2-T02)
  if (my !== audio.seq) return;
  const url = trackUrl(name); if (!url) { audio.status[name] = "missing"; return; }
  const d = audio.decks.find(x => x !== old) || audio.decks[0];
  const tok = ++d.tok; d.name = name; clearInterval(d.iv);
  if (d.gain && audio.ctx) { d.gain.gain.cancelScheduledValues(audio.ctx.currentTime); d.gain.gain.setValueAtTime(0, audio.ctx.currentTime); } else d.el.volume = 0;
  if (!d.el.src.endsWith(url)) { d.el.preload = "auto"; d.el.src = url; }  // streams; starts as soon as enough is buffered
  try { d.el.currentTime = 0; } catch (e) {}
  for (let attempt = 0; attempt < 2; attempt++) {
    try { await d.el.play(); break; }
    catch (e) { if (my !== audio.seq || d.tok !== tok) return;            // superseded: ignore
      if (e.name !== "AbortError" || attempt) { audio.status[name] = "play blocked: " + e.name; d.name = null; return; }
      await new Promise(r => setTimeout(r, 250)); }
  }
  if (my !== audio.seq || d.tok !== tok) { if (d.tok === tok) d.el.pause(); return; }
  { const c = (audio.cueLog || []).findLast(c => c.name === name && !c.start); if (c) c.start = Math.round(performance.now()); }
  audio.cur = d; rampTo(d, gain, fadeIn); audio.starts.push(name); audio.status[name] = "playing";
}
function musicCue(c) { if (c === undefined) return; if (c === null || typeof c === "string") return playTrack(c);
  return playTrack(c.track ?? null, c); }
["touchend", "click", "keydown", "pointerup"].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener("visibilitychange", () => { if (!audio.ctx) return; if (document.hidden) audio.ctx.suspend().catch(() => {}); });
window.addEventListener("pageshow", () => { if (audio.ctx && audio.ctx.state !== "running") audio.ctx.resume().catch(() => {}); });
// Volume / mute settings (Menu): music, sound effects, UI sounds, mute all. Saved in localStorage.
const vol = { ...(window.AUDIO_DEFAULTS || { music: 0.7, sfx: 0.8, ui: 0.35, mute: false }), ...JSON.parse(localStorage.getItem("tmwr_vol") || "{}") };
function applyVol() { const set = (g, v) => g && (g.gain.value = v);
  set(audio.out, vol.mute ? 0 : 1); set(audio.master, vol.music); set(audio.sfxBus, vol.sfx); set(audio.uiBus, vol.ui); set(audio.voiceBus, vol.voice ?? 1);
  if (!audio.ctx) audio.decks.forEach(d => d.el.volume = vol.mute ? 0 : Math.min(d.el.volume, vol.music)); }
[["#m-vol", "music"], ["#m-sfx", "sfx"], ["#m-ui", "ui"], ["#m-voice", "voice"]].forEach(([id, k]) => { const el = $(id); if (!el) return; el.value = vol[k];
  el.oninput = e => { vol[k] = +e.target.value; applyVol(); localStorage.setItem("tmwr_vol", JSON.stringify(vol)); }; });
$("#m-mute") && ($("#m-mute").checked = vol.mute, $("#m-mute").onchange = e => { vol.mute = e.target.checked; applyVol(); localStorage.setItem("tmwr_vol", JSON.stringify(vol)); });
// UI sounds: tiny one-shots, decoded once, never block anything; silently skipped if a file is missing.
const uiBuf = {};
function uiSfx(name) { const f = (window.UI_SFX || {})[name]; if (!f || !audio.ctx || vol.mute || !vol.ui) return;
  const url = resolve("sfx", f) || (!canOgg && resolve("sfx", f.replace(/\.ogg$/, ".mp3"))); if (!url) return;
  (uiBuf[url] ??= fetch(url).then(r => r.ok ? r.arrayBuffer() : null).then(b => b && audio.ctx.decodeAudioData(b)).catch(() => null))
    .then(buf => { if (!buf) return; const s = audio.ctx.createBufferSource(); s.buffer = buf; s.connect(audio.uiBus); s.start(); }); }
window.__uiSfx = uiSfx;

const sfxSlug = d => d.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
const sfxFound = {};
// VN-T07: every SFX keeps a handle. Files named *_loop are ambience beds: they loop, are never doubled, and fade out
// on a location (bg) change, a fade to black and a scene change. One-shots are stopped on fade/scene change too.
const sfxActive = new Set();
function sfxFile(slug) { const mapped = A.sfx[slug]; return mapped ? resolve("sfx", mapped) || (canOgg ? null : resolve("sfx", mapped.replace(/\.ogg$/, ".mp3"))) : resolve("sfx", slug); }
function sfxPlay(desc) {
  const slug = sfxSlug(desc), url = sfxFile(slug);
  if (!url || !audio.ctx) return;
  const loop = /_loop\.[a-z0-9]+$/i.test(url);
  if (loop && [...sfxActive].some(h => h.url === url && !h.stopping)) return;
  const p = sfxFound[url] ??= (async () => { await artIdle; try { const r = await fetch(url); if (r.ok) return await audio.ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) {} return null; })();
  const scene = st && st.scene, gen = sfxGen;
  p.then(buf => { if (!buf || gen !== sfxGen || (st && st.scene !== scene)) return;
    if (loop && [...sfxActive].some(h => h.url === url && !h.stopping)) return;   // a second cue resolved while the first was decoding
    const src = audio.ctx.createBufferSource(), g = audio.ctx.createGain(); src.buffer = buf; src.loop = loop;
    if (loop && /\.mp3$/.test(url)) src.loopStart = 1105 / 44100;      // MP3 encoder delay (Echo's note)
    src.connect(g).connect(audio.sfxBus); g.gain.value = 1; src.start();
    const grp = loop && (window.SFX_EXCLUSIVE || []).find(gr => gr.some(f => url.includes(f.replace(/\.[a-z0-9]+$/, ""))));
    if (grp) { const t = audio.ctx.currentTime; for (const o of sfxActive) if (o.loop && !o.stopping && o.url !== url && grp.some(f => o.url.includes(f.replace(/\.[a-z0-9]+$/, "")))) {
      o.stopping = true; o.g.gain.setValueAtTime(o.g.gain.value, t); o.g.gain.linearRampToValueAtTime(0, t + 2); try { o.src.stop(t + 2.05); } catch (e) {} } }   // VN2-T04: one road bed at a time
    const h = { url, src, g, loop, stopping: false, bg: st && st.bg && st.bg.id }; sfxActive.add(h); src.onended = () => sfxActive.delete(h); });
}
let sfxGen = 0;
function stopSfx(which = "all", secs = 1.2) { if (which === "all" || which === "here") sfxGen++;
  for (const h of [...sfxActive]) { if (h.stopping || (which === "loops" && !h.loop)) continue; h.stopping = true;
    const t = audio.ctx.currentTime; h.g.gain.cancelScheduledValues(t); h.g.gain.setValueAtTime(h.g.gain.value, t); h.g.gain.linearRampToValueAtTime(0, t + secs);
    try { h.src.stop(t + secs + 0.05); } catch (e) {} } }
window.__SFX = sfxActive;
function sfxCaption(desc) { sfxPlay(desc); const el = $("#sfx"); el.hidden = false; el.textContent = "🔊 " + desc; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 3500); }

// ---------- runner ----------
// ---- VOICE (real recordings): queued one after another (never overlap), never looped, never cut short;
// stopVoice() is only called on a scene change, a restart/load or returning to the title.
audio.voiceGen = 0; audio.voiceQ = Promise.resolve(); audio.voiceBufs = {}; audio.voiceLog = []; audio.voiceNow = null;
const voiceUrl = id => { const order = canOgg ? ["ogg", "mp3"] : ["mp3", "ogg"]; for (const x of order) if (has("voice", id + "." + x)) return D.voice + id + "." + x; return null; };
function voiceBuf(id) { if (audio.voiceBufs[id]) return audio.voiceBufs[id]; const u = voiceUrl(id); if (!u || !audio.ctx) return Promise.resolve(null);
  return audio.voiceBufs[id] = fetch(u).then(r => r.ok ? r.arrayBuffer() : null).then(b => b && new Promise((ok, no) => audio.ctx.decodeAudioData(b, ok, no))).catch(() => (delete audio.voiceBufs[id], null)); }
function warmVoices(i) { const sc = S[i]; if (!sc || !audio.ctx) return; const w = ops => ops.forEach(o => { if (o.op === "voice") voiceBuf(o.id); if (o.options) o.options.forEach(x => w(x.ops)); }); w(sc.ops); }
function duckMusic(on) { if (!audio.duck) return; const V = window.VOICE || {}, g = audio.duck.gain, t = audio.ctx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(on ? Math.pow(10, (V.duckDb ?? -10) / 20) : 1, t + (on ? V.duckIn ?? 0.4 : V.duckOut ?? 1.5)); }
function voicePlay(id) { const gen = audio.voiceGen, want = performance.now(); if (!audio.ctx) return;
  audio.voiceQ = audio.voiceQ.then(async () => { const buf = await voiceBuf(id); if (gen !== audio.voiceGen) return;
    if (!buf) { audio.voiceLog.push({ id, want, error: "missing" }); return; }
    if (audio.ctx.state === "suspended") await audio.ctx.resume().catch(() => {});
    duckMusic(true); const src = audio.ctx.createBufferSource(); src.buffer = buf; src.loop = false; src.connect(audio.voiceBus);
    const rec = { id, want, start: performance.now(), dur: buf.duration }; audio.voiceLog.push(rec); audio.voiceNow = { src, rec };
    await new Promise(done => { src.onended = done; src.start(); audio.voiceStop = done; });
    rec.end = performance.now(); audio.voiceNow = null; if (gen === audio.voiceGen) duckMusic(false); }); }
function stopVoice() { audio.voiceGen++; const v = audio.voiceNow; if (v) { v.rec.stopped = true; try { v.src.onended = null; v.src.stop(); } catch (e) {} audio.voiceNow = null; audio.voiceStop && audio.voiceStop(); }
  audio.voiceQ = Promise.resolve(); if (audio.duck) duckMusic(false); }
function sceneStart() { stopVoice(); warmVoices(st.scene); warmSceneMusic(st.scene); if (audio.ctx) stopSfx("all", 0.5); st.stack = [{ i: 0 }]; st.sprites = []; st.musicTag = 0; st.flashback = false; st.hardCut = false; applyFlashback(); setCg(null, true); renderSprites(); title();
  musicCue(M.sceneStart[sid()]); }
// Walk forward (without mutating state) to the next line/choice and collect every image it will need.
function lookahead() { const urls = []; let scene = st.scene, stack = st.stack.map(f => ({ ...f }));
  const opsFor = (sc, stk) => { let ops = S[sc].ops; for (let d = 1; d < stk.length; d++) ops = ops[stk[d].ci].options.find(o => o.key === stk[d].key).ops; return ops; };
  for (let n = 0; n < 400; n++) {
    const depth = stack.length - 1, ops = opsFor(scene, stack), f = stack[depth];
    if (f.i >= ops.length) { if (depth > 0) { stack.pop(); stack[stack.length - 1].i++; continue; } if (scene + 1 < S.length) { scene++; stack = [{ i: 0 }]; continue; } break; }
    const op = ops[f.i];
    if (op.op === "bg") urls.push(bgUrl(op.id, op.desc, S[scene].id));
    else if (op.op === "sprite") urls.push(spriteUrl(op.id, (op.desc || "neutral").split(",")[0].trim(), S[scene].id));
    else if (op.op === "say") { (window.LINE_POSE || []).forEach(([sc, t, id, e]) => { if (sc === S[scene].id && op.text.includes(t)) urls.push(spriteUrl(id, e, sc)); }); const c = window.CGS.find(c => c.scene === S[scene].id && [].concat(c.show).some(x => op.text.includes(x))); if (c) urls.push(resolve("cg", c.file)); break; }
    else if (op.op === "cond") { const o = op.options.find(o => (st.flags[o.key] || 0) > 0); if (o) { stack.push({ ci: f.i, key: o.key, i: 0 }); continue; } }
    else if (op.op === "cg") { const c = window.CGS.find(c => c.id === op.id); if (c) urls.push(resolve("cg", c.file)); }
    else if (op.op === "choice") { op.options.forEach(o => o.ops.slice(0, 6).forEach(x => { if (x.op === "sprite") urls.push(spriteUrl(x.id, x.desc.split(",")[0].trim(), S[scene].id)); if (x.op === "say") { const c = window.CGS.find(c => c.scene === S[scene].id && [].concat(c.show).some(y => x.text.includes(y))); if (c) urls.push(resolve("cg", c.file)); } })); break; }
    f.i++;
  }
  return urls.filter(Boolean);
}
// Every image a scene can show (all branches): bgs, sprites, CGs.
function sceneImages(i) { const sc = S[i]; if (!sc) return []; const u = [];
  const walk = ops => ops.forEach(o => { if (o.op === "bg") u.push(bgUrl(o.id, o.desc, sc.id)); if (o.op === "sprite") u.push(spriteUrl(o.id, (o.desc || "neutral").split(",")[0].trim(), sc.id));
    if (o.op === "choice" || o.op === "cond") o.options.forEach(x => walk(x.ops)); }); walk(sc.ops);
  window.CGS.filter(c => c.scene === sc.id).forEach(c => u.push(resolve("cg", c.file))); return [...new Set(u.filter(Boolean))]; }
// Sequentially (one request at a time, after the current art) decode the next scene so fades never wait.
let warmSeq = 0;
async function warmNextScene() { const my = ++warmSeq, cur = st.scene; await artIdle;
  for (const u of sceneImages(cur + 1)) { if (my !== warmSeq) return; await loadImg(u); } }
// iOS has a small decoded-image budget: only keep the current and next scene decoded.
function pruneImages() { const keep = new Set([...sceneImages(st.scene), ...sceneImages(st.scene + 1), resolve("cg", A.titleArt)]);
  for (const u of Object.keys(imgP)) if (!keep.has(u)) { delete imgP[u]; delete imgReady[u]; } }
let holdBlack = false, preparing = false;
async function step() {
  if (busy || preparing) return;
  const need = lookahead().filter(u => !imgReady[u]);
  if (need.length) { preparing = true; window.__busyPreload = true; const p = preloadAll(need); artIdle = p;
    try { await p; } finally { preparing = false; window.__busyPreload = false; } }
  runStep();
}
function reveal() { if (!holdBlack) return; holdBlack = false; requestAnimationFrame(() => requestAnimationFrame(() => $("#fade").classList.remove("on"))); }
function runStep() {
  if (busy) return; clearTimeout(autoT); $("#choices").hidden = true; $("#choices").innerHTML = ""; $("#btn-choice-menu").hidden = true;
  for (;;) {
    const depth = st.stack.length - 1, ops = opsAt(depth), f = st.stack[depth];
    if (f.i >= ops.length) {
      if (depth > 0) { st.stack.pop(); st.stack[st.stack.length - 1].i++; continue; }
      if (st.scene + 1 < S.length) { const prev = S[st.scene].part; st.scene++; sceneStart(); pruneImages(); warmNextScene();
        if (S[st.scene].part !== prev) return partCard(S[st.scene].part);
        continue; }
      return endChapter();
    }
    const op = ops[f.i];
    switch (op.op) {
      case "bg": { const G = window.BG_GROUP || {}, g = id => G[id] || id;
        if (st.bg && g(st.bg.id) !== g(op.id) && audio.ctx) stopSfx("here", 1.2); }   // VN2-T03: loops AND one-shots of the old location
        if (st.cgOp) { st.cgOp = false; setCg(null); }
        st.sprites = []; renderSprites(); { const cut = st.hardCut; st.hardCut = false; const pb = setBg(op.id, op.desc, holdBlack || cut); if (cut) pb.then(applyFlashback); } musicCue((M.bgCues || {})[sid() + ":" + op.id]); f.i++; break;
      case "sprite": setSprite(op.id, op.desc); f.i++; break;
      case "sfx": sfxCaption(op.desc); f.i++; break;
      case "voice": voicePlay(op.id); f.i++; break;
      case "flashback": st.flashback = !!op.on; if (op.on) applyFlashback(); else st.hardCut = true;   /* tint drops in the same frame as the new bg */ f.i++; break;   // Sage: sepia+vignette; hard cut back
      case "music": { const tags = M.tags[sid()] || []; musicCue(tags[st.musicTag++]); f.i++; break; }
      case "fade": { f.i++; busy = true; $("#textbox").hidden = true; $("#sfx").hidden = true; setCg(null); if (audio.ctx) stopSfx("all", 0.7);
        artIdle = preloadAll(sceneImages(st.scene + 1).slice(0, 4));   // next bg(s) load while the screen goes black
        const fo = (M.fadeOutOnFade || {})[sid()]; if (fo !== undefined) playTrack(null, { fadeOut: fo });
        $("#fade").classList.add("on");
        // stay black: the next bg/sprites/CG are decoded and applied UNDER the black, then reveal() fades in
        setTimeout(() => { busy = false; holdBlack = true; step(); }, 750); return; }
      case "say": f.i++; (window.LINE_POSE || []).forEach(([sc, t, id, pose]) => { if (sc === sid() && op.text.includes(t)) setSprite(id, pose); }); cgCheck(op.text, holdBlack); lineCue(op.text); show(op.who, op.text, op.style); reveal(); return;
      case "choice": showChoice(op, f.i); reveal(); return;
      case "cond": { const o = op.options.find(o => (st.flags[o.key] || 0) > 0); if (o) st.stack.push({ ci: f.i, key: o.key, i: 0 }); else f.i++; break; }
      case "cg": { const c = window.CGS.find(c => c.id === op.id && resolve("cg", c.file)); if (c) { setCg(c, true); st.cgOp = true; } f.i++; break; }
      case "fx": { f.i++; if (op.kind !== "flash" && op.kind !== "flash_out") break;
        // timed beat: white frame (CG is set underneath on the next op), then the white decays and the CG holds a moment
        const on = op.kind === "flash"; if (on) { $("#textbox").hidden = true; flash(true); } else flash(false);
        busy = true; setTimeout(() => { busy = false; runStep(); }, on ? 90 : 1400); return; }
      case "ui": f.i++; toast("📱 " + op.desc.replace(/^phone notification\s*[—–-]\s*/i, "")); break;
      default: f.i++;
    }
  }
}
// Lightning: CSS white flash (one bright frame, then a short decay). Reduced motion -> softer.
function flash(on) { const el = $("#flash"); if (!el) return;
  if (on) { el.classList.remove("out"); el.classList.add("on"); }
  else { requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add("out"); el.classList.remove("on"); })); } }
function toast(text) { const el = $("#sfx"); el.hidden = false; el.textContent = text; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(() => el.style.opacity = 0, 3500); }
function title() { /* scene name kept in state for Log; Juno's layout has no top bar */ }
function applyFlashback() { $("#game").classList.toggle("flashback", !!(st && st.flashback)); }
function show(who, text, style) {
  document.querySelectorAll(".sprite.echo").forEach(d => d.classList.remove("echo")); if (style === "echo") { const sp = window.SPEAKER_SPRITE[who]; document.querySelectorAll(".sprite").forEach(d => (d.dataset.ch === sp || d.dataset.ch === sp + "_adult") && d.classList.add("echo")); }
  $("#textbox").classList.remove("echo"); if (style === "echo") { void $("#textbox").offsetWidth; $("#textbox").classList.add("echo"); }
  st.speaker = who === "NARRATION" ? null : who;
  $("#textbox").classList.toggle("narration", who === "NARRATION");
  $("#name").textContent = U.names[who] ?? (who.charAt(0) + who.slice(1).toLowerCase());
  $("#text").innerHTML = fmt(text); $("#textbox").hidden = false; dim();
  log.push((who === "NARRATION" ? "" : (U.names[who] || who) + ": ") + text); if (log.length > 300) log.shift();
  if (auto) autoT = setTimeout(advance, 1800 + text.length * 45);
}
function showChoice(op, ci) {
  $("#textbox").hidden = true; const box = $("#choices"); box.hidden = false; $("#btn-choice-menu").hidden = false;   // Menu stays reachable at a choice
  box.innerHTML = `<p class="choices__prompt">${esc(U.choicePrompt)}</p>`;
  const copy = U.choices[sid()] || {};
  op.options.forEach(o => { const b = document.createElement("button"); b.className = "btn choice"; b.textContent = copy[o.key] ?? o.text; b.dataset.key = o.key;
    b.onclick = e => { e.stopPropagation(); uiSfx("choice_select"); pick(o.key, ci); };
    b.onpointerenter = b.onfocus = () => uiSfx("choice_hover"); box.appendChild(b); });
  box.querySelector("button").focus({ preventScroll: true });
}
function pick(key, ci) {
  const delta = (window.FLAG_MAP[sid()] || {})[key] || {};
  for (const k in delta) st.flags[k] = (st.flags[k] || 0) + delta[k];
  log.push(`› ${(U.choices[sid()] || {})[key] || key}`); st.stack.push({ ci, key, i: 0 }); step();
}
function endChapter() { playTrack(null, { fadeOut: M.endFade ?? 6 }); if (audio.ctx) stopSfx("all", 3); reveal(); $("#textbox").hidden = true; $("#end").hidden = false; $("#end-flags").textContent = JSON.stringify(st.flags, null, 2);
  const P = (U.parts || {})[S[st.scene].part]; if (P) { $("#end .chapter__num").textContent = P.endNum || ("End of " + P.num); $("#end .chapter__title").textContent = P.title; } window.__VN_DONE = true; }
// Cover the stage in black, swap everything underneath, then fade in: no stale bg, no title->game flash.
async function start(scene = 0, saved) {
  if (busy) return; busy = true;
  $("#fade").classList.add("on", "now"); holdBlack = true;            // instant black cover (opaque night colour, not white)
  stopVoice();
  st = saved || fresh(scene); st.flags = { ...window.FLAGS_INIT, ...st.flags };   // older saves get the new (Part 2) flags at 0 log = []; window.__VN_DONE = false;
  $("#textbox").hidden = true; $("#choices").hidden = true; $("#end").hidden = true; setCg(null, true); $("#btn-choice-menu").hidden = true;
  const card = !saved && (scene === 0 || S[scene].part !== S[scene - 1].part);
  if (card) { const c = $("#chapter"); cardText(S[scene].part); c.classList.remove("out"); c.hidden = false; if (scene === 0) musicCue(M.title); else musicCue(M.sceneStart[S[scene].id] ?? null); }
  requestAnimationFrame(() => { $("#title").hidden = true; requestAnimationFrame(() => $("#fade").classList.remove("now")); });
  if (saved) { await preloadAll([bgUrl(st.bg?.id, st.bg?.desc), ...st.sprites.map(s => spriteUrl(s.id, s.expr)), st.cg && resolve("cg", (window.CGS.find(c => c.id === st.cg) || {}).file)]);
    if (st.bg) setBg(st.bg.id, st.bg.desc, true); renderSprites(); setCg(window.CGS.find(c => c.id === st.cg), true); playTrack(st.track ?? null, st.trackOpts || {});
    const top = st.stack[st.stack.length - 1], ops = opsAt(st.stack.length - 1); if (top.i > 0 && ops[top.i - 1]?.op === "say") top.i--; }
  else if (!card) musicCue(M.sceneStart[S[scene].id] ?? null);
  st.sprites = st.sprites || []; applyFlashback(); renderSprites(); warmNextScene();
  if (card) { const prep = preloadAll([...lookahead(), ...sceneImages(scene)]); artIdle = prep; busy = false; return chapterCard(prep); }
  busy = false; step();
}
function cardText(part) { const P = (U.parts || {})[part] || U.chapter; $("#ch-num").textContent = P.num; $("#ch-title").textContent = P.title; $("#ch-meta").textContent = P.meta || ""; }
function partCard(part) { const c = $("#chapter"); cardText(part); c.classList.remove("out"); c.hidden = false; $("#textbox").hidden = true;
  const prep = preloadAll([...lookahead(), ...sceneImages(st.scene)]); artIdle = prep; chapterCard(prep); }
function chapterCard(prep) {
  const c = $("#chapter"); let gone = false;
  $("#fade").classList.remove("on"); holdBlack = false;    // card itself is opaque
  const go = async () => { if (gone) return; gone = true; clearTimeout(t);
    await prep; runStep();                                   // first bg/sprites applied underneath the card
    requestAnimationFrame(() => requestAnimationFrame(() => { c.classList.add("out"); setTimeout(() => { c.hidden = true; c.classList.remove("out"); }, 420); })); };
  const t = setTimeout(go, 2900); c.onclick = e => { e.stopPropagation(); go(); };
}
function advance() {
  if (busy || preparing || !$("#chapter").hidden || !$("#choices").hidden || !$("#title").hidden || !$("#end").hidden || document.querySelector(".overlay:not([hidden])")) return;
  step();
}

// ---------- UI ----------
$("#textbox").addEventListener("click", e => { if (!e.target.closest(".dialogue__controls")) { if (!busy && !preparing) uiSfx("text_advance"); advance(); } });
$("#game").addEventListener("click", e => { if (e.target.id === "bg" || e.target.id === "cg" || e.target.closest("#sprites") || e.target.classList.contains("scrim") && !e.target.closest("#title") || e.target.id === "game") advance(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { document.querySelectorAll(".overlay").forEach(o => o.hidden = true); return; }
  if (document.querySelector(".overlay:not([hidden])")) return;          // no choice/advance keys behind an open menu
  if ((e.key === "m" || e.key === "M") && st && $("#title").hidden) { $("#btn-menu").onclick(e); return; }
  const btns = $("#choices").querySelectorAll("button"); if (btns.length && /^[1-9]$/.test(e.key) && btns[e.key - 1]) return btns[e.key - 1].click();
  if ((e.key === " " || e.key === "Enter") && !btns.length && e.target.tagName !== "BUTTON") { e.preventDefault(); advance(); }
});
$("#title-h1").textContent = U.title; $("#tagline").textContent = U.tagline;
$("#btn-start").textContent = U.menu.begin; $("#btn-continue").textContent = U.menu.cont; $("#btn-settings").textContent = U.menu.settings;
// Title: keep the menu hidden until the key art is decoded (max 2.5 s) so the art never pops in under the buttons.
{ const ka = resolve("cg", A.titleArt), ti = $("#title"); ti.classList.add("loading");
  const done = () => { ti.classList.remove("loading"); ti.classList.add("ready"); }; const tmo = setTimeout(done, 6000);
  if (ka) loadImg(ka).then(im => { warmTrack(cueTrack(M.title)); warmSceneMusic(0); if (im) { const k = $("#keyart"); k.src = ka; k.alt = U.title; k.hidden = false; ti.classList.add("has-art"); requestAnimationFrame(() => k.classList.add("on")); }
    requestAnimationFrame(() => { clearTimeout(tmo); done(); }); }); else { clearTimeout(tmo); done(); } }
const sel = $("#scene-jump"); sel.innerHTML = `<option value="">Scene select (dev)…</option>` + S.map((s, i) => `<option value="${i}">${i + 1}. ${s.title}</option>`).join("");
sel.onchange = () => sel.value !== "" && start(+sel.value);
const open = id => { $(id).hidden = false; uiSfx("menu_open"); };
const toTitle = () => { stopVoice(); $("#game").classList.remove("flashback"); document.querySelectorAll(".overlay").forEach(o => o.hidden = true); $("#title").hidden = false; $("#btn-choice-menu").hidden = true;
  requestAnimationFrame(() => { $("#end").hidden = true; $("#textbox").hidden = true; setCg(null, true); });
  $("#btn-continue").hidden = !localStorage.getItem("tmwr_save"); musicCue(M.title); };
// Dev jump: ?part=2 (or ?scene=<id>) makes Begin start there. Part 2 flags start at 0 (Ch1 flags too).
const QP = new URLSearchParams(location.search), jumpTo = QP.get("scene") ? S.findIndex(s => s.id === QP.get("scene")) : QP.get("part") ? S.findIndex(s => String(s.part) === QP.get("part")) : 0;
$("#btn-start").onclick = () => start(Math.max(0, jumpTo));
$("#btn-continue").hidden = !localStorage.getItem("tmwr_save");
$("#btn-continue").onclick = () => { const s = JSON.parse(localStorage.getItem("tmwr_save")); start(s.scene, s); };
$("#btn-settings").onclick = () => { $("#m-flags").textContent = st ? JSON.stringify(st.flags, null, 2) : ""; open("#menu"); };
document.querySelectorAll(".help-open").forEach(b => b.onclick = e => { e.stopPropagation(); open("#help"); });
$("#btn-choice-menu").onclick = e => { e.stopPropagation(); e.preventDefault(); $("#btn-menu").onclick(e); };
$("#btn-menu").onclick = e => { e.stopPropagation(); $("#m-flags").textContent = st ? JSON.stringify(st.flags, null, 2) : ""; open("#menu"); };
$("#btn-log").onclick = e => { e.stopPropagation(); $("#log-body").innerHTML = log.map(l => `<p>${fmt(l)}</p>`).join(""); open("#log"); };
$("#btn-auto").onclick = e => { e.stopPropagation(); auto = !auto; e.currentTarget.setAttribute("aria-pressed", auto); e.currentTarget.classList.toggle("btn--primary", auto); if (auto) autoT = setTimeout(advance, 1500); else clearTimeout(autoT); };
document.querySelectorAll(".overlay .close").forEach(b => b.onclick = e => { e.stopPropagation(); uiSfx(b.closest("#menu") ? "menu_close" : "back"); b.closest(".overlay").hidden = true; });
$("#m-save").onclick = () => { uiSfx("save_confirm"); localStorage.setItem("tmwr_save", JSON.stringify(st)); $("#m-save").textContent = "Saved ✓"; setTimeout(() => $("#m-save").textContent = "Save", 1200); };
$("#m-load").onclick = () => { const s = localStorage.getItem("tmwr_save"); if (s) { uiSfx("load_confirm"); $("#menu").hidden = true; const o = JSON.parse(s); start(o.scene, o); } };
$("#m-title").onclick = $("#btn-end-title").onclick = () => { uiSfx("back"); toTitle(); };
audio.want = typeof M.title === "string" ? M.title : M.title.track; audio.wantOpts = typeof M.title === "object" ? M.title : {}; // starts on first tap (mobile autoplay policy)
$("#btn-about") && ($("#btn-about").onclick = e => { e.stopPropagation(); open("#about"); });
$("#about-body") && ($("#about-body").innerHTML = (window.CREDITS || []).map(l => `<p>${esc(l)}</p>`).join(""));
window.VN = { get state() { return st; }, start, advance, scenes: S.map(s => s.id) };
})();
