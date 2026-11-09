/* ================= Yordamchi funksiyalar ================= */
let LANG = 'uz';
try { const s = localStorage.getItem('kt_til'); if (s && L[s]) LANG = s; } catch (e) {}
const LI = () => ({ uz: 0, ru: 1, en: 2 })[LANG];
const t = (k, v) => { let s = L[LANG][k] ?? L.uz[k] ?? k; if (v) s = String(s).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? ''); return s; };
const nm = s => { if (s == null || s === '') return s; if (NM[s] && LANG !== 'uz') return NM[s][LANG === 'ru' ? 0 : 1]; if (VALS[s]) return VALS[s][LI()]; return s; };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, LANG === 'en' ? ',' : ' ');
const dec = (x, d = 1) => { const s = Number(x).toFixed(d); return LANG === 'en' ? s : s.replace('.', ','); };
const pct = (a, b) => b ? dec(100 * a / b) + '%' : '0%';
const pct1 = x => dec(100 * x) + '%';
const w = (a, b) => b ? (100 * a / b).toFixed(2) + '%' : '0%';
const UZ = "O'zbekiston";
const { K, T, Y, G, TF, PS, PMON, DEV, BRW, KL } = D;
const TFI = Object.fromEntries(TF.map((x, i) => [x, i]));
const PSI = Object.fromEntries(PS.map((x, i) => [x, i]));

/* ================= Ma'lumot kubi ================= */
const mk = r => ({ q: r[0], m: r[1], d: r[2], v: r[3], n: r[4], e: r[5], a: r[6], s: r[7], c: r[8], asl: r[9], k: r[10], t: r[11], y: r[12], g: r[13],
  tf: r[14], yt: r[15], ps: r[16], pm: r[17], pq: r[18], mo: r[19], dev: r[20], brw: r[21], kl: r[22] });
const BASE = D.rows.map(mk);
let EXTRA_ROWS = [], R = BASE, TOTAL = D.jami;
const ARR = ['k', 't', 'y', 'g', 'tf', 'yt', 'ps', 'pm', 'pq', 'mo', 'dev', 'brw', 'kl'];
const zero = () => ({ n: 0, e: 0, a: 0, s: 0, c: 0, asl: 0, k: K.map(() => 0), t: T.map(() => 0), y: Y.map(() => 0), g: G.map(() => 0), tf: TF.map(() => 0),
  yt: Y.flatMap(() => TF.map(() => 0)), ps: PS.map(() => 0), pm: PMON.flatMap(() => PS.map(() => 0)), pq: TF.map(() => 0), mo: Array(12).fill(0),
  dev: DEV.map(() => 0), brw: BRW.map(() => 0), kl: KL.map(() => 0) });
function agg(rows) {
  const o = zero();
  for (const r of rows) { o.n += r.n; o.e += r.e; o.a += r.a; o.s += r.s; o.c += r.c; o.asl += r.asl; for (const k of ARR) { const src = r[k], dst = o[k]; for (let i = 0; i < src.length; i++) dst[i] += src[i]; } }
  return o;
}
function groupBy(rows, key) {
  const m = new Map(); for (const r of rows) { const k = typeof key === 'function' ? key(r) : r[key]; (m.get(k) || m.set(k, []).get(k)).push(r); }
  return [...m].map(([k, v]) => ({ ...agg(v), k, rows: v })).sort((a, b) => b.n - a.n);
}
const st = { q: null, m: null, d: null, v: null };
const inScope = (r, s = st) => (!s.q || r.q === s.q) && (!s.m || r.m === s.m) && (!s.d || r.d === s.d) && (!s.v || r.v === s.v);
const scopeName = (s = st) => nm(s.v || s.d || s.m || s.q) || t('all_guests');
let showAllD = false, showAllV = false, page = 0, VIEW = 'umumiy';

/* ================= Statik matnlar va til ================= */
function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
  document.querySelectorAll('[data-th]').forEach(el => el.innerHTML = t(el.dataset.th));
  document.querySelectorAll('.langs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG));
  $('sq').placeholder = t('f_ph'); $('f-q').placeholder = t('fl_ph');
  try { const dd = new Date(); $('tb-date').textContent = LANG === 'uz' ? `${dd.getDate()}-${L.uz.monthsL[dd.getMonth()].toLowerCase()}, ${dd.getFullYear()}` : dd.toLocaleDateString(LANG === 'ru' ? 'ru-RU' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) {}
  document.querySelectorAll('#a-jinsi option').forEach(o => o.textContent = t('o_' + o.value));
  document.querySelectorAll('#a-oila option').forEach(o => o.textContent = t(o.value === 'turmush qurgan' ? 'o_married' : 'o_single'));
}
document.querySelectorAll('.langs button').forEach(b => b.addEventListener('click', () => {
  LANG = b.dataset.lang; try { localStorage.setItem('kt_til', LANG); } catch (e) {}
  applyStatic(); buildSearch(); buildCmpOptions(); buildPredForm(); buildAddForm(true); render(); predictAll(); renderModelStatic(); if (GMODE) renderG(); else if (UNLOCKED) { unlock(); } else renderGate();
}));

/* ================= Qit'a tugmalari va qidiruv ================= */
function renderTabs() {
  const qs = groupBy(R, 'q');
  const items = [{ k: null, n: TOTAL, label: t('all') }, ...qs.map(x => ({ k: x.k, n: x.n, label: nm(x.k) }))];
  $('tabs').innerHTML = items.map(i => `<button class="tab" role="tab" type="button" aria-selected="${st.q === i.k}" data-k="${i.k === null ? '' : esc(i.k)}">${esc(i.label)} <small>${fmt(i.n)}</small></button>`).join('');
  $('tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => set({ q: b.dataset.k || null }));
}
let OPTS = [];
function buildSearch() {
  OPTS = [];
  const add = (name, type, s) => OPTS.push({ name, type, s, keys: [name, ...(NM[name] || [])].map(norm) });
  groupBy(R, 'q').forEach(x => add(x.k, 'qita', { q: x.k }));
  groupBy(R, 'm').forEach(x => { if (!OPTS.some(o => o.name === x.k)) add(x.k, 'mintaqa', { q: x.rows[0].q, m: x.k }); });
  groupBy(R, 'd').forEach(x => add(x.k, 'davlat', { q: x.rows[0].q, m: x.rows[0].m, d: x.k }));
  groupBy(R, r => r.d + '|' + r.v).forEach(x => { const r = x.rows[0]; add(r.v, 'hudud', { q: r.q, m: r.m, d: r.d, v: r.v }); OPTS[OPTS.length - 1].dn = r.d; });
  $('sopts').innerHTML = OPTS.map(o => `<option value="${esc(label(o))}"></option>`).join('');
}
const label = o => `${nm(o.name)} (${t('t_' + o.type)}${o.dn ? ' · ' + nm(o.dn) : ''})`;
const norm = s => String(s).toLowerCase().replace(/[ʻʼ‘’`´]/g, "'").replace(/ё/g, 'е').trim();
function doSearch() {
  const raw = $('sq').value; if (!raw.trim()) return;
  const exact = OPTS.find(o => label(o) === raw);
  const q = norm(raw.replace(/\s*\([^)]*\)\s*$/, ''));
  const hit = exact || OPTS.find(o => o.keys.includes(q)) || OPTS.find(o => o.keys.some(k => k.startsWith(q))) || OPTS.find(o => o.keys.some(k => k.includes(q)));
  if (!hit) { $('smsg').textContent = t('f_notfound', { q: raw }); return; }
  $('smsg').textContent = ''; $('sq').value = label(hit); set(hit.s);
}
$('sform').addEventListener('submit', e => { e.preventDefault(); doSearch(); });
$('sq').addEventListener('change', () => { if (OPTS.some(o => label(o) === $('sq').value)) doSearch(); });
$('sclear').onclick = () => { $('sq').value = ''; $('smsg').textContent = ''; set({}); };
function set(s) { st.q = s.q || null; st.m = s.m || null; st.d = s.d || null; st.v = s.v || null; showAllD = showAllV = false; page = 0; render(); }

/* ================= Umumiy chizish yordamchilari ================= */
function bars(el, items, o = {}) {
  const max = Math.max(...items.map(i => i.n), 1), tot = o.total || items.reduce((a, i) => a + i.n, 0);
  el.innerHTML = items.length ? items.map(i => {
    const tag = o.click ? 'button' : 'div', fill = i.k === UZ ? 'f-uz' : (o.alt ? 'f-alt' : 'f-main');
    return `<${tag} ${o.click ? 'type="button"' : ''} class="bar" ${o.click ? `aria-pressed="${o.sel === i.k}"` : ''} data-k="${esc(i.k)}">
      <span class="nm">${esc(i.label ?? nm(i.k))}${i.sub ? ` <em>${esc(i.sub)}</em>` : ''}</span><span class="ct">${fmt(i.n)} · ${pct(i.n, tot)}</span>
      <span class="track"><i class="${fill}" style="width:${w(i.n, max)}"></i></span></${tag}>`;
  }).join('') : `<p class="empty">${esc(o.empty || t('empty'))}</p>`;
  if (o.click) el.querySelectorAll('button.bar').forEach(b => b.onclick = () => o.click(b.dataset.k));
}
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
function chart(el, data, labels, W = 520, opt = {}) {
  const H = 240, L0 = 58, Rr = 10, T0 = 18, B = 28, cw = W - L0 - Rr, ch = H - T0 - B, ymax = niceMax(Math.max(...data.map(d => d.v), opt.ymax || 0));
  const y = v => T0 + ch - ch * v / ymax, bw = cw / data.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:400px" role="img">`;
  for (let i = 0; i <= 4; i++) { const v = ymax * i / 4; s += `<line class="grid" x1="${L0}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}"/><text x="${L0 - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
  data.forEach((d, i) => { const x = L0 + i * bw + bw * .2, bwid = bw * .6;
    s += `<rect x="${x}" y="${y(d.v)}" width="${bwid}" height="${y(0) - y(d.v)}" fill="${d.c || 'var(--lapis)'}" rx="3"><title>${esc(d.l)}: ${fmt(d.v)}</title></rect>`;
    if (labels && d.v) s += `<text x="${x + bwid / 2}" y="${y(d.v) - 5}" text-anchor="middle">${fmt(d.v)}</text>`;
    s += `<text x="${x + bwid / 2}" y="${H - 9}" text-anchor="middle">${esc(d.l)}</text>`; });
  el.innerHTML = s + '</svg>';
}

/* ================= Asosiy chizish ================= */
function render() {
  renderTabs();
  const rows = R.filter(r => inScope(r)), A = agg(rows);
  const parts = [[t('all'), {}]];
  if (st.q) parts.push([nm(st.q), { q: st.q }]);
  if (st.m && st.m !== st.q) parts.push([nm(st.m), { q: st.q, m: st.m }]);
  if (st.d) parts.push([nm(st.d), { q: st.q, m: st.m, d: st.d }]);
  if (st.v) parts.push([nm(st.v), { ...st }]);
  $('crumbs').innerHTML = parts.map((p, i) => `${i ? '<span class="sep">›</span>' : ''}<button type="button" aria-current="${i === parts.length - 1}" data-i="${i}">${esc(p[0])}</button>`).join('');
  $('crumbs').querySelectorAll('button').forEach(b => b.onclick = () => set(parts[+b.dataset.i][1]));
  renderUmumiy(A, rows); renderJoylar(A, rows); renderMaps(A, rows); renderKanal(A); renderVaqt(A); renderKelajak(A); renderPandemiya(A); renderGuruhlar(A); renderCmp(); renderTable();
}

function renderUmumiy(A, rows) {
  const nd = new Set(rows.map(r => r.d)).size, nv = new Set(rows.map(r => r.d + '|' + r.v)).size;
  $('kpis').innerHTML = `
    <div class="kpi lead"><span class="lbl">${esc(scopeName())}</span><b>${fmt(A.n)}</b><small>${t('k_guests')}</small></div>
    <div class="kpi"><span class="lbl">${t('k_share')}</span><b>${pct(A.n, TOTAL)}</b><small>${t('k_from', { n: fmt(TOTAL) })}</small></div>
    <div class="kpi"><span class="lbl">${t('k_gender')}</span><b>${pct(A.e, A.n)} / ${pct(A.a, A.n)}</b><small>${fmt(A.e)} / ${fmt(A.a)}${A.n - A.e - A.a > 0 ? ` · ${fmt(A.n - A.e - A.a)} ${t('k_nogender')}` : ''}</small></div>
    <div class="kpi"><span class="lbl">${t('k_age')}</span><b>${A.c ? dec(A.s / A.c) : '—'}</b><small>${t('k_agek', { n: fmt(A.c) })}</small></div>
    <div class="kpi"><span class="lbl">${t('k_dv')}</span><b>${nd} · ${nv}</b><small>${t('k_inscope')}</small></div>`;
  const v = k => A.tf[TFI[k]];
  const g1 = v('erkak') + v('ayol'), g2 = v('yigit') + v('qiz'), g3 = v("o'g'il bola") + v('qiz bola'), un = v('aniqlanmagan');
  const card = (k, lab, cls) => `<div class="tf ${cls}"><span class="nm">${t(lab)}</span><b>${fmt(v(k))}</b><small>${pct(v(k), A.n)}</small></div>`;
  $('sub-tf').textContent = `${scopeName()} · ${t('n_guests', { n: fmt(A.n) })}`;
  $('tf-1').innerHTML = card('erkak', 'tfp_erkak', 'm') + card('ayol', 'tfp_ayol', 'f');
  $('tf-2').innerHTML = card('yigit', 'tfp_yigit', 'm') + card('qiz', 'tfp_qiz', 'f');
  $('tf-3').innerHTML = card("o'g'il bola", 'tfp_ogil', 'm') + card('qiz bola', 'tfp_qizbola', 'f');
  $('tg-1').textContent = `${fmt(g1)} · ${pct(g1, A.n)}`; $('tg-2').textContent = `${fmt(g2)} · ${pct(g2, A.n)}`; $('tg-3').textContent = `${fmt(g3)} · ${pct(g3, A.n)}`;
  $('tf-split').innerHTML = `<i style="width:${w(g1, A.n)};background:var(--lapis)"></i><i style="width:${w(g2, A.n)};background:var(--firuza)"></i><i style="width:${w(g3, A.n)};background:var(--zar)"></i>`;
  $('note-tf').textContent = (un ? t('tf_note_unk', { n: fmt(un), p: pct(un, A.n) }) : '') +
    t('tf_note_sum', { a: fmt(g1 + g2), k: fmt(g3), sum: `${fmt(g1)} + ${fmt(g2)} + ${fmt(g3)}${un ? ' + ' + fmt(un) : ''}`, n: fmt(A.n) });
}

function renderJoylar(A, rows) {
  const baseQ = R.filter(r => !st.q || r.q === st.q);
  $('h-m').textContent = st.q ? t('h_m_in', { x: nm(st.q) }) : t('h_m');
  bars($('l-m'), groupBy(baseQ, 'm'), { sel: st.m, click: k => set({ q: st.q || R.find(r => r.m === k).q, m: st.m === k ? null : k }) });
  const baseM = baseQ.filter(r => !st.m || r.m === st.m), dav = groupBy(baseM, 'd');
  $('h-d').textContent = st.m ? t('h_d_in', { x: nm(st.m) }) : st.q ? t('h_d_in', { x: nm(st.q) }) : t('h_d');
  bars($('l-d'), showAllD ? dav : dav.slice(0, 12), { sel: st.d, total: dav.reduce((a, x) => a + x.n, 0), click: k => { const r = R.find(x => x.d === k); set(st.d === k ? { q: st.q, m: st.m } : { q: r.q, m: r.m, d: k }); } });
  $('more-d').hidden = dav.length <= 12; $('more-d').textContent = showAllD ? t('less') : t('more_d', { n: dav.length });
  const hud = groupBy(rows, r => r.d + '|' + r.v).map(x => ({ k: x.rows[0].v, d: x.rows[0].d, n: x.n, e: x.e, a: x.a }));
  $('h-v').textContent = st.d === UZ ? t('h_v_uz') : st.d ? t('h_v_d', { x: nm(st.d) }) : t('h_v_all', { x: scopeName() });
  $('sub-v').textContent = t('sub_v', { n: fmt(A.n), h: hud.length });
  const vmax = Math.max(...hud.map(h => h.n), 1);
  $('l-v').innerHTML = (showAllV ? hud : hud.slice(0, 20)).map(h => `<button type="button" class="bar" aria-pressed="${st.v === h.k}" data-k="${esc(h.k)}" data-d="${esc(h.d)}">
    <span class="nm">${esc(nm(h.k))}${st.d ? '' : ` <em>${esc(nm(h.d))}</em>`}</span><span class="ct">${fmt(h.n)} · ${pct(h.n, A.n)}</span>
    <span class="gender" style="width:${w(h.n, vmax)}"><i style="width:${w(h.e, h.n)};background:var(--lapis)"></i><i style="width:${w(h.a, h.n)};background:var(--zar)"></i><i style="flex:1;background:var(--line)"></i></span></button>`).join('');
  $('l-v').querySelectorAll('button.bar').forEach(b => b.onclick = () => { const r = R.find(x => x.v === b.dataset.k && x.d === b.dataset.d); set(st.v === r.v ? { q: r.q, m: r.m, d: r.d } : { q: r.q, m: r.m, d: r.d, v: r.v }); });
  $('more-v').hidden = hud.length <= 20; $('more-v').textContent = showAllV ? t('less') : t('more_v', { n: hud.length });
}
$('more-d').onclick = () => { showAllD = !showAllD; render(); };
$('more-v').onclick = () => { showAllV = !showAllV; render(); };

/* ================= Xarita ================= */
const RAMP = ['#dbe6f6', '#b3c9ec', '#7fa3dc', '#4e7cc6', '#2a59a8', '#163c7e'];
const RAMPD = ['#1f2c4a', '#26407a', '#2f58a6', '#4677c9', '#6f9be3', '#a9c5f2'];
const isDark = () => { const r = document.documentElement.dataset.theme; return r ? r === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function colorFor(n, max, min) { if (!n) return null; const rp = isDark() ? RAMPD : RAMP;
  const f = min != null ? (max > min ? (n - min) / (max - min) : 1) : Math.log1p(n) / Math.log1p(max + 1e-9);
  return rp[Math.max(0, Math.min(rp.length - 1, Math.floor(rp.length * f - 1e-9)))]; }
function legend(el, max, min) { const rp = isDark() ? RAMPD : RAMP; el.innerHTML = `<span>${t('map_zero')}</span><span class="ramp" style="width:16px"><i style="background:var(--line)"></i></span><span>${t('map_few')}${min != null ? ' (' + fmt(min) + ')' : ''}</span><span class="ramp">${rp.map(c => `<i style="background:${c}"></i>`).join('')}</span><span>${t('map_many')} (${fmt(max)})</span>`; }
let mapsBuilt = false;
const LBOFF = { 'Toshkent shahri': [-14, -12], 'Toshkent viloyati': [22, 8], 'Sirdaryo viloyati': [-6, 6], 'Namangan viloyati': [0, -6] };
function buildMaps() {
  const W = MAPS.world, U = MAPS.uz;
  $('map-world').setAttribute('viewBox', `0 0 ${W.w} ${W.h}`);
  $('map-world').innerHTML = W.c.map(c => `<path class="c none" d="${c.p}" ${c.d ? `data-d="${esc(c.d)}"` : ''}></path>`).join('') + W.dots.map(d => `<circle class="dot" r="4" cx="${d.x}" cy="${d.y}" data-d="${esc(d.d)}"></circle>`).join('');
  $('map-world').insertAdjacentHTML('beforeend', `<g class="resort"><circle r="5" cx="${W.resort.x}" cy="${W.resort.y}"></circle><text x="${W.resort.x + 8}" y="${W.resort.y - 8}">Oromgoh.uz</text></g>`);
  $('map-uz').setAttribute('viewBox', `0 0 ${U.w} ${U.h}`);
  $('map-uz').innerHTML = U.nb.map(p => `<path class="nb" d="${p}"></path>`).join('') + U.r.map(r => `<path class="c" d="${r.p}" data-v="${esc(r.v)}"></path>`).join('') + U.r.map(r => { const o = LBOFF[r.v] || [0, 0]; return `<text class="lb" x="${r.x + o[0]}" y="${r.y + o[1]}" data-lv="${esc(r.v)}"></text>`; }).join('');
  $('map-uz').insertAdjacentHTML('beforeend', `<g class="resort"><circle r="7" cx="${U.resort.x}" cy="${U.resort.y}"></circle><text x="${U.resort.x + 10}" y="${U.resort.y - 10}">Oromgoh.uz</text></g>`);
  const hook = (svg, info, attr, onPick) => {
    svg.addEventListener('mousemove', e => { const el = e.target.closest(`[data-${attr}]`); if (el) info.innerHTML = el.dataset.info || ''; });
    svg.addEventListener('mouseleave', () => { info.textContent = t('map_hover'); });
    svg.addEventListener('click', e => { const el = e.target.closest(`[data-${attr}]`); if (el && el.dataset.n !== '0') onPick(el.dataset[attr]); });
  };
  hook($('map-world'), $('info-world'), 'd', d => { const r = R.find(x => x.d === d); if (r) set(st.d === d ? {} : { q: r.q, m: r.m, d }); });
  hook($('map-uz'), $('info-uz'), 'v', v => { const r = R.find(x => x.d === UZ && x.v === v); if (r) set(st.v === v ? { q: r.q, m: r.m, d: UZ } : { q: r.q, m: r.m, d: UZ, v }); });
  mapsBuilt = true;
}
function renderMaps(A, rows) {
  if (!mapsBuilt) buildMaps();
  const byD = new Map(groupBy(rows, 'd').map(x => [x.k, x.n])), maxD = Math.max(1, ...byD.values());
  document.querySelectorAll('#map-world [data-d]').forEach(el => {
    const d = el.dataset.d, n = byD.get(d) || 0, c = colorFor(n, maxD);
    el.style.fill = c || ''; el.classList.toggle('none', !c); el.dataset.n = n; el.dataset.sel = st.d === d ? '1' : '0';
    el.dataset.info = n ? t('map_info', { x: `<b>${esc(nm(d))}</b>`, n: `<b>${fmt(n)}</b>`, p: pct(n, A.n) }) : t('map_none', { x: esc(nm(d)) });
    el.innerHTML = `<title>${esc(nm(d))}: ${fmt(n)}</title>`;
  });
  $('sub-world').textContent = t('sub_world', { n: fmt(A.n), d: byD.size }); legend($('lg-world'), maxD); $('info-world').textContent = t('map_hover');
  const uzRows = rows.filter(r => r.d === UZ), byV = new Map(groupBy(uzRows, 'v').map(x => [x.k, x.n])), maxV = Math.max(1, ...byV.values()), minV = byV.size > 1 ? Math.min(...byV.values()) : null, uzT = uzRows.reduce((a, r) => a + r.n, 0);
  document.querySelectorAll('#map-uz path.c').forEach(el => {
    const v = el.dataset.v, n = byV.get(v) || 0, c = colorFor(n, maxV, minV);
    el.style.fill = c || 'var(--line)'; el.dataset.n = n; el.dataset.sel = st.v === v ? '1' : '0';
    el.dataset.info = n ? t('map_info', { x: `<b>${esc(nm(v))}</b>`, n: `<b>${fmt(n)}</b>`, p: pct(n, uzT) }) : t('map_none', { x: esc(nm(v)) });
    el.innerHTML = `<title>${esc(nm(v))}: ${fmt(n)}</title>`;
  });
  document.querySelectorAll('#map-uz text.lb').forEach(el => { const n = byV.get(el.dataset.lv) || 0; el.textContent = n ? fmt(n) : ''; });
  $('sub-uz').textContent = uzT ? t('sub_uz', { n: fmt(uzT) }) : t('uz_hidden'); legend($('lg-uz'), maxV, minV); $('info-uz').textContent = t('map_hover');
}

/* ================= Kanallar va qurilmalar ================= */
function renderKanal(A) {
  $('sub-k').textContent = t('n_guests', { n: fmt(A.n) });
  bars($('l-k'), K.map((k, i) => ({ k, n: A.k[i] })).filter(x => x.n).sort((a, b) => b.n - a.n), { total: A.n });
  $('note-k').textContent = A.asl ? t('note_k_asl', { n: fmt(A.asl) }) : t('note_k_syn');
  const tav = T.map((k, i) => ({ k, n: A.t[i] })).sort((a, b) => b.n - a.n), ts = tav.reduce((a, x) => a + x.n, 0);
  $('sub-t').textContent = ts ? t('sub_t', { n: fmt(ts), p: pct(ts, A.n) }) : '';
  bars($('l-t'), ts ? tav : [], { total: ts, alt: true, empty: t('no_rec') });
  $('sub-dev').textContent = $('sub-brw').textContent = t('n_guests', { n: fmt(A.n) });
  bars($('l-dev'), DEV.map((k, i) => ({ k, n: A.dev[i] })).filter(x => x.n).sort((a, b) => b.n - a.n), { total: A.n });
  bars($('l-brw'), BRW.map((k, i) => ({ k, n: A.brw[i] })).filter(x => x.n).sort((a, b) => b.n - a.n), { total: A.n, alt: true });
}

/* ================= Yillar, oylar, fasllar ================= */
const SEASONS = [['s_qish', [11, 0, 1], 'var(--lapis)'], ['s_bahor', [2, 3, 4], 'var(--firuza)'], ['s_yoz', [5, 6, 7], 'var(--zar)'], ['s_kuz', [8, 9, 10], 'var(--qizil)']];
const seasonCounts = A => SEASONS.map(([k, ms, c]) => ({ k, n: ms.reduce((a, m) => a + A.mo[m], 0), c }));
function renderVaqt(A) {
  chart($('ch-y'), Y.map((y, i) => ({ l: "'" + y.slice(2), v: A.y[i] })), false, 900);
  const order = ['erkak', 'ayol', 'yigit', 'qiz', "o'g'il bola", 'qiz bola', 'aniqlanmagan'].map(k => TFI[k]);
  const cell = (yi, ti) => A.yt[yi * TF.length + ti];
  $('yt-body').innerHTML = Y.map((y, yi) => `<tr><td>${y}</td><td class="r"><b>${fmt(A.y[yi])}</b></td>${order.map(ti => `<td class="r">${fmt(cell(yi, ti))}</td>`).join('')}</tr>`).join('');
  $('yt-foot').innerHTML = `<tr><td>${t('th_total')}</td><td class="r">${fmt(A.n)}</td>${order.map(ti => `<td class="r">${fmt(A.tf[ti])}</td>`).join('')}</tr>`;
  $('sub-yil').textContent = `${scopeName()} · ${t('n_guests', { n: fmt(A.n) })}`;
  const sc = seasonCounts(A), top = sc.reduce((a, b) => b.n > a.n ? b : a, sc[0]);
  $('seasons').innerHTML = sc.map(s => `<div class="season ${s === top && s.n ? 'top' : ''}" style="--c:${s.c}"><span class="nm">${t(s.k)}${s === top && s.n ? ' · ' + t('s_top') : ''}</span><b>${fmt(s.n)}</b><small>${pct(s.n, A.n)}</small></div>`).join('');
  const sOf = m => SEASONS.find(s => s[1].includes(m))[2];
  chart($('ch-oy'), A.mo.map((v, i) => ({ l: L[LANG].months[i], v, c: sOf(i) })), false, 620);
  $('sub-oy').textContent = `${scopeName()} · ${t('n_guests', { n: fmt(A.n) })}`;
  chart($('ch-kid'), Y.map((y, yi) => ({ l: "'" + y.slice(2), v: cell(yi, TFI["o'g'il bola"]) + cell(yi, TFI['qiz bola']) })), false, 620);
  chart($('ch-g'), G.map((g, i) => ({ l: g, v: A.g[i] })), false);
  $('note-g').textContent = t('note_g', { n: fmt(A.n - A.c) });
}

/* ================= Kelajak bashorati ================= */
function forecast(A) {
  const pts = Y.map((y, i) => [+y, A.y[i]]).filter(([y]) => y >= 2015 && y <= 2025 && y !== 2020 && y !== 2021);
  const tot = pts.reduce((a, p) => a + p[1], 0); if (tot < 60) return null;
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = tot / n;
  const b = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0), a = my - b * mx;
  const sd = Math.sqrt(pts.reduce((s, p) => s + (p[1] - (a + b * p[0])) ** 2, 0) / Math.max(1, n - 2));
  const f = y => Math.max(0, a + b * y);
  return { a, b, sd, f, y26: f(2026), y27: f(2027), so26: A.y[Y.indexOf('2026')] };
}
function renderKelajak(A) {
  const F = forecast(A); $('sub-fc').textContent = `${scopeName()} · ${t('n_guests', { n: fmt(A.n) })}`;
  if (!F) { $('fc-nums').innerHTML = `<p class="note" style="grid-column:1/-1">${t('fc_low')}</p>`; $('ch-fc').innerHTML = ''; return; }
  const rng = v => t('fc_range', { a: fmt(Math.max(0, v - 1.96 * F.sd)), b: fmt(v + 1.96 * F.sd) });
  $('fc-nums').innerHTML = `
    <div class="pk" style="--c:var(--firuza)"><span class="nm">${t('fc_2026')}</span><b>${fmt(Math.max(F.y26, F.so26))}</b><small>${t('fc_2026s', { n: fmt(F.so26) })}</small></div>
    <div class="pk" style="--c:var(--zar)"><span class="nm">${t('fc_2027')}</span><b>${fmt(F.y27)}</b><small>${rng(F.y27)}</small></div>
    <div class="pk" style="--c:var(--lapis)"><span class="nm">${t('fc_growth')}</span><b>${F.b >= 0 ? '+' : '−'}${fmt(Math.abs(F.b))}</b><small>${t('fc_growths')}</small></div>`;
  const yrs = [...Y.map(Number), 2027], W = 900, H = 260, L0 = 60, Rr = 12, T0 = 16, B = 28, cw = W - L0 - Rr, ch = H - T0 - B;
  const ymax = niceMax(Math.max(...A.y, F.y27 + 1.96 * F.sd)), y = v => T0 + ch - ch * v / ymax, bw = cw / yrs.length, cx = i => L0 + i * bw + bw / 2;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:560px" role="img">`;
  for (let i = 0; i <= 4; i++) { const v = ymax * i / 4; s += `<line class="grid" x1="${L0}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}"/><text x="${L0 - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }
  yrs.forEach((yr, i) => {
    const x = L0 + i * bw + bw * .18, bwid = bw * .64;
    if (yr <= 2026) { const v = A.y[i]; s += `<rect x="${x}" y="${y(v)}" width="${bwid}" height="${y(0) - y(v)}" rx="3" fill="${yr === 2026 ? 'var(--firuza)' : 'var(--lapis)'}" opacity="${yr < 2015 || yr === 2020 || yr === 2021 ? .45 : 1}"><title>${yr}: ${fmt(v)}</title></rect>`; }
    else { const v = F.y27, lo = Math.max(0, v - 1.96 * F.sd), hi = v + 1.96 * F.sd;
      s += `<rect x="${x}" y="${y(v)}" width="${bwid}" height="${y(0) - y(v)}" rx="3" fill="none" stroke="var(--zar)" stroke-width="2" stroke-dasharray="5 4"><title>2027: ${fmt(v)}</title></rect><line x1="${cx(i)}" x2="${cx(i)}" y1="${y(hi)}" y2="${y(lo)}" stroke="var(--zar)" stroke-width="2"/><line x1="${cx(i) - 8}" x2="${cx(i) + 8}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--zar)" stroke-width="2"/><line x1="${cx(i) - 8}" x2="${cx(i) + 8}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--zar)" stroke-width="2"/><text x="${cx(i)}" y="${y(hi) - 6}" text-anchor="middle">${fmt(v)}</text>`; }
    s += `<text x="${cx(i)}" y="${H - 9}" text-anchor="middle">'${String(yr).slice(2)}</text>`;
  });
  const i15 = yrs.indexOf(2015), i27 = yrs.indexOf(2027);
  s += `<line x1="${cx(i15)}" x2="${cx(i27)}" y1="${y(F.f(2015))}" y2="${y(F.f(2027))}" stroke="var(--zar)" stroke-width="2.5"/>`;
  $('ch-fc').innerHTML = s + '</svg>';
}

/* ================= Pandemiya ================= */
function renderPandemiya(A) {
  const v = s => A.ps[PSI[s]];
  const ko = v('kela olmagan (karantin)'), kc = v('kela olmagan (chegara yopiq)'), mq = v('majburan qolgan (karantin)'), ck = v('cheklovlar bilan kelgan');
  $('sub-pan').textContent = t('sub_pan', { x: scopeName(), n: fmt(ko + kc + mq + ck) });
  const card = (k, n, c) => `<div class="pk" style="--c:${c}"><span class="nm">${t(k)}</span><b>${fmt(n)}</b><small>${t(k + '_s')}</small></div>`;
  $('pan-kpis').innerHTML = card('pk_ko', ko, 'var(--qizil)') + card('pk_kc', kc, 'var(--qizil)') + card('pk_mq', mq, 'var(--zar)') + card('pk_ck', ck, 'var(--firuza)');
  const q = k => A.pq[TFI[k]];
  $('pan-tf').innerHTML = [['erkak', 'tfp_erkak', 'm'], ['ayol', 'tfp_ayol', 'f'], ['yigit', 'tfp_yigit', 'm'], ['qiz', 'tfp_qiz', 'f'], ["o'g'il bola", 'tfp_ogil', 'm'], ['qiz bola', 'tfp_qizbola', 'f']]
    .map(([k, l, c]) => `<div class="tf ${c}"><span class="nm">${t(l)}</span><b>${fmt(q(k))}</b><small>${pct(q(k), mq)}</small></div>`).join('');
  const rows = PMON.map((m, mi) => { const g = s => A.pm[mi * PS.length + PSI[s]];
    return { l: m, a: g('kelgan'), b: g('cheklovlar bilan kelgan'), c: g('majburan qolgan (karantin)'), d: g('kela olmagan (karantin)') + g('kela olmagan (chegara yopiq)') }; });
  const W = 620, H = 230, L0 = 48, Rr = 8, T0 = 12, B = 34, cw = W - L0 - Rr, ch = H - T0 - B;
  const ymax = niceMax(Math.max(1, ...rows.map(r => r.a + r.b + r.c + r.d))), y = x => T0 + ch - ch * x / ymax, bw = cw / rows.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="min-width:520px" role="img">`;
  for (let i = 0; i <= 4; i++) { const x = ymax * i / 4; s += `<line class="grid" x1="${L0}" x2="${W - Rr}" y1="${y(x)}" y2="${y(x)}"/><text x="${L0 - 6}" y="${y(x) + 4}" text-anchor="end">${fmt(x)}</text>`; }
  rows.forEach((r, i) => { let acc = 0; const x = L0 + i * bw + bw * .15, bwid = bw * .7;
    [['a', 'var(--lapis)', 'ps_kelgan'], ['b', 'var(--firuza)', 'ps_chek'], ['c', 'var(--zar)', 'ps_majb'], ['d', 'var(--qizil)', 'ps_kelolm']].forEach(([k, c, lab]) => { const val = r[k]; if (!val) return;
      s += `<rect x="${x}" y="${y(acc + val)}" width="${bwid}" height="${y(acc) - y(acc + val)}" fill="${c}"><title>${r.l} · ${t(lab)}: ${fmt(val)}</title></rect>`; acc += val; });
    const mo = +r.l.slice(5, 7);
    if (mo === 1 || i === 0) s += `<text x="${x + bwid / 2}" y="${H - 6}" text-anchor="middle">${r.l.slice(0, 4)}</text>`;
    if (mo % 3 === 1 || i === 0) s += `<text x="${x + bwid / 2}" y="${H - 20}" text-anchor="middle">${L[LANG].months[mo - 1]}</text>`; });
  $('ch-pan').innerHTML = s + '</svg>';
}

/* ================= K-means guruhlari ================= */
const CLC = ['var(--lapis)', 'var(--zar)', 'var(--firuza)', 'var(--qizil)', '#7d5ba6', '#4f8a3d', '#a0634a', '#5b6782'];
function clName(p) {
  if (p.bola > .5) return `${t('cl_kids')} ${t('cl_kidsfam')}`;
  const mar = p.oilali > .5, cit = p.ozbek > .9 ? t('cl_uz') : p.ozbek < .1 ? t('cl_fx') : '';
  const who = p.ayol > .9 ? (mar ? t('cl_w') : t('cl_yw')) : p.ayol < .1 ? (mar ? t('cl_m') : t('cl_ym')) : t('cl_mix');
  return [mar ? t('cl_married') : t('cl_single'), cit, who].filter(Boolean).join(' ');
}
function renderGuruhlar(A) {
  const inG = KL.reduce((a, k, i) => a + (k >= 0 ? A.kl[i] : 0), 0);
  $('sub-cl').textContent = t('sub_cl', { x: scopeName(), n: fmt(inG) });
  $('clusters').innerHTML = KLI.profiles.map((p, j) => {
    const n = A.kl[KL.indexOf(p.id)] || 0, topk = Object.entries(p.kanal).sort((a, b) => b[1] - a[1])[0];
    return `<div class="cl" style="--c:${CLC[j % CLC.length]}"><h3>${esc(clName(p))}</h3>
      <div class="cnt"><b>${fmt(n)}</b><span>${pct(n, inG)}</span></div>
      <span class="track"><i style="width:${w(n, inG)};background:${CLC[j % CLC.length]}"></i></span>
      <dl><dt>${t('cl_age')}</dt><dd>${dec(p.yosh)}</dd><dt>${t('cl_fem')}</dt><dd>${pct1(p.ayol)}</dd><dt>${t('cl_mar')}</dt><dd>${pct1(p.oilali)}</dd>
      <dt>${t('cl_uzs')}</dt><dd>${pct1(p.ozbek)}</dd><dt>${t('cl_topk')}</dt><dd>${t('kg_' + topk[0])} · ${pct1(topk[1])}</dd></dl></div>`;
  }).join('');
  const sil = Object.entries(KLI.silhouette).map(([k, v]) => ({ l: 'K=' + k, v: Math.round(v * 1000), c: +k === KLI.k ? 'var(--zar)' : 'var(--lapis)' }));
  chart($('ch-sil'), sil, false, 520);
  $('ch-sil').querySelectorAll('text').forEach(el => { if (/^\d[\d\s, ]*$/.test(el.textContent) && el.getAttribute('text-anchor') === 'end') el.textContent = dec(+el.textContent.replace(/\D/g, '') / 1000, 2); });
  $('ch-sil').querySelectorAll('rect title').forEach((tt, i) => tt.textContent = `${sil[i].l}: ${dec(sil[i].v / 1000, 3)}`);
  $('note-cl').textContent = t('note_cl', { k: KLI.k, n: fmt(KLI.excluded) });
}
function nearestCluster(yosh, ayol, bola, oilali, ozbek) {
  const x = [yosh, ayol, bola, oilali, ozbek].map((v, i) => (v - KLI.mean[i]) / KLI.scale[i]);
  let best = 0, bd = Infinity; KLI.centers.forEach((c, i) => { const d = c.reduce((s, ci, j) => s + (ci - x[j]) ** 2, 0); if (d < bd) { bd = d; best = i; } });
  return KLI.profiles[best].id;
}

/* ================= Solishtirish ================= */
let CMP = { a: null, b: null };
function buildCmpOptions() {
  const keep = [CMP.a, CMP.b];
  const og = (lab, items) => `<optgroup label="${esc(t(lab))}">${items.map(x => `<option value="${esc(JSON.stringify(x.s))}">${esc(x.l)}</option>`).join('')}</optgroup>`;
  const q = groupBy(R, 'q').map(x => ({ s: { q: x.k }, l: nm(x.k) }));
  const m = groupBy(R, 'm').filter(x => x.k !== x.rows[0].q).map(x => ({ s: { q: x.rows[0].q, m: x.k }, l: nm(x.k) }));
  const d = groupBy(R, 'd').map(x => ({ s: { q: x.rows[0].q, m: x.rows[0].m, d: x.k }, l: nm(x.k) }));
  const v = groupBy(R, r => r.d + '|' + r.v).map(x => { const r = x.rows[0]; return { s: { q: r.q, m: r.m, d: r.d, v: r.v }, l: `${nm(r.v)} · ${nm(r.d)}` }; });
  const html = og('og_q', q) + og('og_m', m) + og('og_d', d) + og('og_v', v);
  $('cmp-a').innerHTML = html; $('cmp-b').innerHTML = html;
  const def = (sel, val, fb) => { const o = [...sel.options].find(o => o.value === val) || [...sel.options].find(o => o.value === fb); if (o) sel.value = o.value; };
  def($('cmp-a'), keep[0], JSON.stringify({ q: 'Osiyo', m: 'Markaziy Osiyo', d: UZ }));
  def($('cmp-b'), keep[1], JSON.stringify({ q: 'Osiyo', m: 'Markaziy Osiyo', d: "Qozog'iston" }));
  CMP.a = $('cmp-a').value; CMP.b = $('cmp-b').value;
}
$('cmp-a').onchange = () => { CMP.a = $('cmp-a').value; renderCmp(); };
$('cmp-b').onchange = () => { CMP.b = $('cmp-b').value; renderCmp(); };
$('cmp-swap').onclick = () => { [CMP.a, CMP.b] = [CMP.b, CMP.a]; $('cmp-a').value = CMP.a; $('cmp-b').value = CMP.b; renderCmp(); };
function renderCmp() {
  if (!CMP.a || !CMP.b) return;
  const sa = JSON.parse(CMP.a), sb = JSON.parse(CMP.b);
  const A = agg(R.filter(r => inScope(r, sa))), B = agg(R.filter(r => inScope(r, sb)));
  $('cmp-ha').textContent = scopeName(sa); $('cmp-hb').textContent = scopeName(sb);
  const tf = (X, k) => X.tf[TFI[k]];
  const topK = X => { const i = X.k.indexOf(Math.max(...X.k)); return X.n ? `${nm(K[i])} · ${pct(X.k[i], X.n)}` : '—'; };
  const topY = X => X.n ? Y[X.y.indexOf(Math.max(...X.y))] : '—';
  const topS = X => { const s = seasonCounts(X), m = s.reduce((a, b) => b.n > a.n ? b : a); return X.n ? `${t(m.k)} · ${pct(m.n, X.n)}` : '—'; };
  const pan = X => X.ps[PSI['kela olmagan (karantin)']] + X.ps[PSI['kela olmagan (chegara yopiq)']] + X.ps[PSI['majburan qolgan (karantin)']] + X.ps[PSI['cheklovlar bilan kelgan']];
  const rec = X => X.t.reduce((a, b) => a + b, 0), kids = X => tf(X, "o'g'il bola") + tf(X, 'qiz bola');
  const row = (lab, va, vb, na, nb, share) => {
    const win = na === nb ? 0 : na > nb ? 1 : 2;
    const mini = (n, c) => share ? `<span class="mini"><i style="width:${(100 * Math.min(1, n)).toFixed(1)}%;background:${c}"></i></span>` : '';
    return `<tr><td class="metric">${t(lab)}</td><td class="va ${win === 1 ? 'win' : ''}">${va}${mini(na, 'var(--lapis)')}</td><td class="vb ${win === 2 ? 'win' : ''}">${vb}${mini(nb, 'var(--zar)')}</td></tr>`;
  };
  const sh = (X, n) => X.n ? n / X.n : 0;
  const trow = (k, lab) => row(lab, `${fmt(tf(A, k))} · ${pct(tf(A, k), A.n)}`, `${fmt(tf(B, k))} · ${pct(tf(B, k), B.n)}`, sh(A, tf(A, k)), sh(B, tf(B, k)), true);
  $('cmp-tb').innerHTML =
    row('c_n', fmt(A.n), fmt(B.n), A.n, B.n) +
    row('c_share', pct(A.n, TOTAL), pct(B.n, TOTAL), A.n / TOTAL, B.n / TOTAL, true) +
    trow('erkak', 'tfp_erkak') + trow('ayol', 'tfp_ayol') + trow('yigit', 'tfp_yigit') + trow('qiz', 'tfp_qiz') + trow("o'g'il bola", 'tfp_ogil') + trow('qiz bola', 'tfp_qizbola') +
    row('c_kids', pct(kids(A), A.n), pct(kids(B), B.n), sh(A, kids(A)), sh(B, kids(B)), true) +
    row('c_age', A.c ? dec(A.s / A.c) : '—', B.c ? dec(B.s / B.c) : '—', A.c ? A.s / A.c : 0, B.c ? B.s / B.c : 0) +
    row('c_topk', topK(A), topK(B), -1, -1) +
    row('c_rec', `${fmt(rec(A))} · ${pct(rec(A), A.n)}`, `${fmt(rec(B))} · ${pct(rec(B), B.n)}`, sh(A, rec(A)), sh(B, rec(B)), true) +
    row('c_year', topY(A), topY(B), -1, -1) + row('c_season', topS(A), topS(B), -1, -1) +
    row('c_pan', `${fmt(pan(A))} · ${pct(pan(A), A.n)}`, `${fmt(pan(B))} · ${pct(pan(B), B.n)}`, sh(A, pan(A)), sh(B, pan(B)), true);
}

/* ================= Bashorat (4 model) ================= */
const sig = z => 1 / (1 + Math.exp(-z));
const sgn = x => (x >= 0 ? '+' : '−') + dec(Math.abs(x), 2);
const featLabel = k => FEATL[k] ? FEATL[k][LI()] : k;
function buildPredForm() {
  const keep = {}; document.querySelectorAll('#pform select').forEach(s => keep[s.dataset.k] = s.value);
  $('pform').innerHTML = M.features.map(f => `<label for="pm-${f.key}">${esc(featLabel(f.key))}<select id="pm-${f.key}" data-k="${f.key}">${
    f.values.map(v => `<option value="${esc(v.v)}">${esc(nm(v.v))}</option>`).join('')}</select></label>`).join('');
  document.querySelectorAll('#pform select').forEach(s => { if (keep[s.dataset.k]) s.value = keep[s.dataset.k]; });
}
$('pform').addEventListener('change', () => predictAll());
const sel = k => $('pm-' + k).value;
function predictLR() {
  let z = M.intercept; const parts = [];
  M.features.forEach(f => { const o = f.values.find(x => x.v === sel(f.key)); z += o.w; parts.push({ f, o }); });
  const p = sig(z), avg = M.metrics.booked_rate;
  $('p-val').textContent = pct1(p); $('p-bar').style.width = (100 * p).toFixed(2) + '%'; $('p-avg').style.left = `calc(${(100 * avg).toFixed(2)}% - 1px)`;
  $('p-verdict').innerHTML = t('p_answer', { a: t(p >= .5 ? 'yes_book' : 'no_book'), p: pct1(avg) });
  const maxw = Math.max(...M.features.flatMap(f => f.values.map(v => Math.abs(v.w))), .01);
  $('p-why').innerHTML = parts.map(({ f, o }) => { const r = Math.exp(o.w);
    const txt = o.w === 0 ? t('base_v') : t(r >= 1 ? 'more_x' : 'less_x', { r: dec(r, 2) });
    return `<div class="eff"><span class="nm">${esc(featLabel(f.key))}: <em>${esc(nm(o.v))}</em></span><span class="ax">${o.w ? `<i class="${o.w > 0 ? 'up' : 'dn'}" style="width:${(50 * Math.abs(o.w) / maxw).toFixed(1)}%"></i>` : ''}</span><span class="val">${txt}</span></div>`; }).join('')
    + `<p class="note" style="margin-top:6px">${t('p_odds')}</p>`;
  return p;
}
const SV = M.svm, sw = (k, v) => SV.w[`${k}=${v}`] ?? 0;
let FR = 1; { let mn = SV.intercept, mx = SV.intercept; M.features.forEach(f => { const ws = f.values.map(v => sw(f.key, v.v)); mn += Math.min(...ws); mx += Math.max(...ws); }); FR = Math.max(Math.abs(mn), Math.abs(mx), 1e-6); }
function predictSVM() {
  let f = SV.intercept; const parts = [];
  M.features.forEach(ft => { const v = sel(ft.key), w0 = sw(ft.key, v); f += w0; parts.push({ ft, v, w: w0 }); });
  $('s-val').textContent = sgn(f);
  const half = 50 * Math.min(1, Math.abs(f) / FR), bar = $('s-bar');
  bar.style.width = half.toFixed(2) + '%'; bar.style.left = f >= 0 ? '50%' : (50 - half).toFixed(2) + '%'; bar.className = f >= 0 ? 'up' : 'dn';
  const r = Math.abs(f) / FR;
  $('s-verdict').innerHTML = t('s_answer', { a: t(f > 0 ? 'yes_book' : 'no_book'), c: t(r < .12 ? 's_c1' : r < .4 ? 's_c2' : 's_c3') });
  const maxw = Math.max(...Object.values(SV.w).map(Math.abs), .01);
  $('s-why').innerHTML = parts.map(({ ft, v, w: w0 }) => `<div class="eff"><span class="nm">${esc(featLabel(ft.key))}: <em>${esc(nm(v))}</em></span>
    <span class="ax">${w0 ? `<i class="${w0 > 0 ? 'up' : 'dn'}" style="width:${(50 * Math.abs(w0) / maxw).toFixed(1)}%"></i>` : ''}</span><span class="val">${w0 ? sgn(w0) : t('base_v')}</span></div>`).join('')
    + `<p class="note" style="margin-top:6px">${t('s_note', { b: sgn(SV.intercept) })}</p>`;
  return f;
}
/* qaror daraxti */
const TREE = M.tree.root;
function layoutTree() {
  const nodes = []; let leafX = 0;
  (function walk(n, depth, path) {
    n._d = depth; n._path = path;
    if (!n.f) { n._x = leafX++; } else { walk(n.no, depth + 1, path + '0'); walk(n.yes, depth + 1, path + '1'); n._x = (n.no._x + n.yes._x) / 2; }
    nodes.push(n);
  })(TREE, 0, '');
  return { nodes, leaves: leafX, depth: Math.max(...nodes.map(n => n._d)) };
}
const TL = layoutTree();
function predictTree() {
  let n = TREE, path = '', q = 0;
  while (n.f) { const yes = sel(n.f) === n.v; path += yes ? '1' : '0'; n = yes ? n.yes : n.no; q++; }
  const W = Math.max(720, TL.leaves * 112), lvH = 92, H = (TL.depth + 1) * lvH + 10, bw = 104, bh = 54;
  const X = n => 8 + (n._x + .5) * ((W - 16) / TL.leaves), Yy = n => 10 + n._d * lvH;
  const on = n => path.startsWith(n._path);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  TL.nodes.forEach(nd => { if (!nd.f) return; [['no', 'no'], ['yes', 'yes']].forEach(([k]) => { const c = nd[k];
    s += `<line class="ed ${on(c) ? 'on' : ''}" x1="${X(nd)}" y1="${Yy(nd) + bh}" x2="${X(c)}" y2="${Yy(c)}"/>`;
    s += `<text class="el" x="${(X(nd) + X(c)) / 2 + (k === 'yes' ? 6 : -6)}" y="${(Yy(nd) + bh + Yy(c)) / 2}" text-anchor="${k === 'yes' ? 'start' : 'end'}">${t(k === 'yes' ? 't_yes' : 't_no')}</text>`; }); });
  TL.nodes.forEach(nd => { const x = X(nd) - bw / 2, y = Yy(nd);
    if (nd.f) {
      const qtxt = t('t_q', { f: featLabel(nd.f), v: nm(nd.v) });
      const lines = wrap(qtxt, 17);
      s += `<rect class="nd ${on(nd) ? 'on' : ''}" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8"/>`;
      lines.slice(0, 2).forEach((ln, i) => s += `<text x="${X(nd)}" y="${y + 18 + i * 14}" text-anchor="middle">${esc(ln)}</text>`);
      s += `<text class="sm" x="${X(nd)}" y="${y + bh - 6}" text-anchor="middle">${t('t_leafn', { n: fmt(nd.n) })}</text>`;
    } else {
      const c = nd.rate >= .5 ? 'var(--firuza)' : 'var(--zar)';
      s += `<rect class="nd ${on(nd) ? 'on' : ''}" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8" style="fill:${on(nd) ? 'var(--zar-soft)' : ''}"/>`;
      s += `<text x="${X(nd)}" y="${y + 22}" text-anchor="middle" style="font-weight:700;fill:${c}">${pct1(nd.rate)}</text>`;
      s += `<text class="sm" x="${X(nd)}" y="${y + 40}" text-anchor="middle">${t('t_leafn', { n: fmt(nd.n) })}</text>`;
    } });
  $('treebox').innerHTML = s + '</svg>';
  $('t-val').textContent = pct1(n.rate);
  $('t-verdict').innerHTML = t('t_answer', { a: t(n.rate >= .5 ? 'yes_book' : 'no_book'), q, n: fmt(n.n) });
  return n.rate;
}
function wrap(s, max) { const out = []; let cur = ''; s.split(' ').forEach(wd => { if ((cur + ' ' + wd).trim().length > max && cur) { out.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }); if (cur) out.push(cur); if (out.length > 2) out[1] = out.slice(1).join(' ').slice(0, max - 1) + '…'; return out; }
/* davlat */
const DM = M.dest;
function predictDest() {
  const z = DM.intercept.slice();
  M.features.forEach(f => { const col = `${f.key}=${sel(f.key)}`, ws = DM.w[col]; if (ws) ws.forEach((x, j) => z[j] += x); });
  const mx = Math.max(...z), ex = z.map(v => Math.exp(v - mx)), s = ex.reduce((a, b) => a + b, 0), P = ex.map(v => v / s);
  const order = P.map((p, j) => [DM.classes[j], p]).sort((a, b) => b[1] - a[1]);
  const dn = c => nm(c === 'boshqa' ? 'boshqa_davlat' : c);
  $('d-val').textContent = `${dn(order[0][0])} · ${pct1(order[0][1])}`;
  $('d-verdict').textContent = t('d_answer');
  const top = order.slice(0, 5), maxp = top[0][1];
  $('d-list').innerHTML = top.map(([c, p]) => `<div class="bar"><span class="nm">${esc(dn(c))}</span><span class="ct">${pct1(p)}</span><span class="track"><i class="f-main" style="width:${(100 * p / maxp).toFixed(2)}%"></i></span></div>`).join('');
  return order;
}
function predictAll() {
  const p = predictLR(), f = predictSVM(), tr = predictTree(); predictDest();
  const a = p >= .5, b = f > 0, c = tr >= .5, same = a === b && b === c;
  $('p-agree').className = 'agree ' + (same ? 'ok' : 'diff');
  $('p-agree').innerHTML = same ? t('agree_ok', { a: t(a ? 'yes_book' : 'no_book') }) : t('agree_diff', { a: t(a ? 'yes_book' : 'no_book'), b: t(b ? 'yes_book' : 'no_book'), c: t(c ? 'yes_book' : 'no_book') });
}
function renderModelStatic() {
  const mm = M.metrics, sm = SV.metrics, rb = SV.rbf, tm = M.tree.metrics, dm = DM.metrics, au = x => dec(x, 2);
  const met = (a, b, c) => `<div><b>${a}</b><span>${t('m_acc')}</span></div><div><b>${b}</b><span>${t('m_base')}</span></div><div><b>${c}</b><span>${t('m_auc')}</span></div>`;
  $('p-metrics').innerHTML = met(pct1(mm.accuracy), pct1(mm.baseline), au(mm.auc));
  $('s-metrics').innerHTML = met(pct1(sm.accuracy), pct1(mm.baseline), au(sm.auc));
  $('t-metrics').innerHTML = met(pct1(tm.accuracy), pct1(mm.baseline), au(tm.auc)) + `<p class="note" style="grid-column:1/-1;margin:0">${t('tree_deep', { l: tm.deep_leaves, a: pct1(tm.deep_accuracy), u: au(tm.deep_auc) })}</p>`;
  $('d-metrics').innerHTML = `<div><b>${pct1(dm.accuracy)}</b><span>${t('d_m_acc')}</span></div><div><b>${au(dm.ndcg5)}</b><span>${t('d_m_ndcg')}</span></div><div><b>${au(dm.base_ndcg5)}</b><span>${t('d_m_base')}</span></div>`;
  const full = t('tst_full', { a: fmt(mm.n_train), b: fmt(mm.n_test) }), same = t('tst_same', { a: fmt(mm.n_train), b: fmt(mm.n_test) });
  $('cmp-body').innerHTML = [
    [t('r_lr'), pct1(mm.accuracy), au(mm.auc), t('a_prob'), full], [t('r_svm'), pct1(sm.accuracy), au(sm.auc), t('a_dist'), same],
    [t('r_rbf'), pct1(rb.accuracy), au(rb.auc), t('a_distc'), t('tst_full', { a: fmt(rb.n_train), b: fmt(rb.n_test) })],
    [t('r_tree'), pct1(tm.accuracy), au(tm.auc), t('a_leaf'), same], [t('r_dest'), pct1(dm.accuracy), 'NDCG@5 ' + au(dm.ndcg5), t('a_dest'), same],
  ].map(r => `<tr><td>${r[0]}</td><td class="r">${r[1]}</td><td class="r">${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('');
  $('cmp-note').textContent = t('cmp_text', { n: fmt(rb.n_train) });
}

/* ================= Ro'yxat ================= */
const S = D.sample; // [id, ism, qita, mintaqa, davlat, hudud, toifa, yosh, sana, kanal, tavsiya, manba, tashrif, klaster]
function buildListFilter() {
  const keep = $('f-k').value;
  $('f-k').innerHTML = `<option value="">${esc(t('all'))}</option>` + K.map(k => `<option value="${esc(k)}">${esc(nm(k))}</option>`).join('');
  $('f-k').value = keep || '';
}
function renderTable() {
  buildListFilter();
  const q = $('f-q').value.trim().toLowerCase(), kk = $('f-k').value;
  const extra = EXTRA.map(g => ['—', g.ism, g._q, g._m, g.davlat, g.hudud, g._toifa, g.yosh, g.sana, g.kanal, g.tavsiya || '', 'site', 'kelgan', -1]);
  const all = [...extra, ...S];
  const f = all.filter(r => (!st.q || r[2] === st.q) && (!st.m || r[3] === st.m) && (!st.d || r[4] === st.d) && (!st.v || r[5] === st.v) && (!q || String(r[1]).toLowerCase().includes(q)) && (!kk || r[9] === kk));
  const PER = 25, pages = Math.max(1, Math.ceil(f.length / PER)); page = Math.min(page, pages - 1);
  const pill = r => r[11] === 'site' ? `<span class="pill new">${t('src_site')}</span>` : `<span class="pill ${r[11] === 'asl' ? 'asl' : 'qo'}">${t(r[11] === 'asl' ? 'src_asl' : 'src_add')}</span>`;
  $('tbody').innerHTML = f.slice(page * PER, page * PER + PER).map(r => `<tr><td class="r">${typeof r[0] === 'number' ? fmt(r[0]) : r[0]}</td><td>${esc(r[1])}</td><td>${esc(nm(r[4]))}</td><td>${esc(nm(r[5]))}</td><td>${esc(nm(r[3]))}</td><td>${esc(nm(r[6]))}</td><td class="r">${r[7] ?? '—'}</td><td>${esc(r[8])}</td><td>${esc(nm(r[9]))}</td><td>${esc(nm(r[10]) || '—')}</td><td>${pill(r)}</td></tr>`).join('')
    || `<tr><td colspan="11" style="color:var(--muted)">${t('tab_empty')}</td></tr>`;
  $('pg-info').textContent = f.length ? t('pg_info', { n: fmt(f.length), p: page + 1, t: pages }) : '0';
  $('pg-prev').disabled = page === 0; $('pg-next').disabled = page >= pages - 1;
  $('sub-tab').textContent = t('sub_tab', { n: fmt(TOTAL), s: fmt(S.length + EXTRA.length) });
}
['f-q', 'f-k'].forEach(id => $(id).addEventListener('input', () => { page = 0; renderTable(); }));
$('pg-prev').onclick = () => { page--; renderTable(); }; $('pg-next').onclick = () => { page++; renderTable(); };

