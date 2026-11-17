/* ================= Yer shari: aylanadigan globus, davlatni bossangiz yaqinlashib hududlarga bo'linadi =================
   d3 va topojson cdnjs'dan yuklanadi; ular bo'lmasa (internet yo'q) eski tekis dunyo xaritasi ko'rsatiladi. */
const GL = { ok: false, built: false, rot: [-64, -30], k: 1, sel: null, anim: null, byD: new Map(), byV: new Map(), A: null, rows: [], countries: [], adm: new Map(), dots: [], hover: '', selF: [], lbF: [], lastD: undefined };
const GL_RES = [70.05, 41.64];
const glReady = () => typeof window.d3 !== 'undefined' && typeof window.topojson !== 'undefined' && window.d3.geoOrthographic;
function glBuild() {
  if (GL.built) return GL.ok; GL.built = true;
  if (!glReady()) return (GL.ok = false);
  const d3 = window.d3, tj = window.topojson;
  GL.countries = tj.feature(GEO.world, GEO.world.objects.countries).features.filter(f => f.properties.d);
  const af = tj.feature(GEO.adm, GEO.adm.objects[Object.keys(GEO.adm.objects)[0]]).features;
  af.forEach(f => { const d = f.properties.d; if (!GL.adm.has(d)) GL.adm.set(d, []); GL.adm.get(d).push(f); });
  GL.dots = GEO.dots;
  GL.proj = d3.geoOrthographic().translate([400, 400]).clipAngle(90).precision(0.4);
  GL.path = d3.geoPath(GL.proj);
  GL.grat = d3.geoGraticule10();
  const svg = $('globe'); svg.setAttribute('aria-label', t('gl_aria'));
  svg.innerHTML = `<defs><radialGradient id="gl-sh" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".22"></stop><stop offset="1" stop-color="#000" stop-opacity=".18"></stop></radialGradient></defs>
    <path class="gl-sea"></path><path class="gl-grat"></path><g class="gl-c"></g><g class="gl-a"></g><g class="gl-dots"></g><g class="gl-lb"></g>
    <g class="gl-res"><circle r="6"></circle><text>Oromgoh.uz</text></g><path class="gl-shade" fill="url(#gl-sh)" pointer-events="none"></path>`;
  GL.gC = svg.querySelector('.gl-c'); GL.gA = svg.querySelector('.gl-a'); GL.gD = svg.querySelector('.gl-dots'); GL.gL = svg.querySelector('.gl-lb');
  GL.gC.innerHTML = GL.countries.map((f, i) => `<path class="c" data-d="${esc(f.properties.d)}" data-i="${i}"></path>`).join('');
  GL.gD.innerHTML = GL.dots.map((p, i) => `<circle class="dot" r="4.5" data-d="${esc(p.d)}" data-i="${i}"></circle>`).join('');
  glWire(svg);
  $('flat-world').hidden = true; $('globe-wrap').hidden = false; $('globe-bar').hidden = false;
  return (GL.ok = true);
}
function glDraw() {
  if (!GL.ok) return;
  const d3 = window.d3, P = GL.proj.rotate(GL.rot).scale(360 * GL.k), path = GL.path, svg = $('globe');
  svg.querySelector('.gl-sea').setAttribute('d', path({ type: 'Sphere' }));
  svg.querySelector('.gl-shade').setAttribute('d', path({ type: 'Sphere' }));
  svg.querySelector('.gl-grat').setAttribute('d', path(GL.grat) || '');
  const kids = GL.gC.children;
  for (let i = 0; i < kids.length; i++) kids[i].setAttribute('d', path(GL.countries[i]) || '');
  const center = [-GL.rot[0], -GL.rot[1]], vis = p => d3.geoDistance(p, center) < Math.PI / 2 - 0.02;
  const dk = GL.gD.children;
  for (let i = 0; i < dk.length; i++) { const p = [GL.dots[i].x, GL.dots[i].y], v = vis(p), xy = P(p); dk[i].style.display = v ? '' : 'none'; if (v) { dk[i].setAttribute('cx', xy[0]); dk[i].setAttribute('cy', xy[1]); dk[i].setAttribute('r', Math.min(9, 3.5 + GL.k * 0.6)); } }
  const res = svg.querySelector('.gl-res'), rv = vis(GL_RES), rxy = P(GL_RES); res.style.display = rv ? '' : 'none';
  if (rv) { res.querySelector('circle').setAttribute('cx', rxy[0]); res.querySelector('circle').setAttribute('cy', rxy[1]); const tx = res.querySelector('text'); tx.setAttribute('x', rxy[0] + 9); tx.setAttribute('y', rxy[1] - 9); }
  // tanlangan davlat hududlari
  const ak = GL.gA.children;
  for (let i = 0; i < ak.length; i++) ak[i].setAttribute('d', path(GL.selF[i]) || '');
  const lk = GL.gL.children;
  for (let i = 0; i < lk.length; i++) { const f = GL.lbF[i], c = d3.geoCentroid(f), v = vis(c), xy = P(c); lk[i].style.display = v && GL.k > 2.2 ? '' : 'none'; if (v) { lk[i].setAttribute('x', xy[0]); lk[i].setAttribute('y', xy[1]); } }
}
/* ranglar va ma'lumot (har bir filtr o'zgarganda) */
function glPaint() {
  if (!GL.ok) return;
  const A = GL.A, maxD = Math.max(1, ...GL.byD.values());
  GL.gC.querySelectorAll('path.c').forEach(el => {
    const d = el.dataset.d, n = GL.byD.get(d) || 0, c = colorFor(n, maxD);
    el.style.fill = c || ''; el.classList.toggle('none', !c); el.dataset.n = n;
    el.classList.toggle('sel', GL.sel === d); el.classList.toggle('dim', !!GL.sel && GL.sel !== d);
    el.dataset.info = n ? t('map_info', { x: `<b>${esc(nm(d))}</b>`, n: `<b>${fmt(n)}</b>`, p: pct(n, A.n) }) : t('map_none', { x: esc(nm(d)) });
  });
  GL.gD.querySelectorAll('circle').forEach(el => { const d = el.dataset.d, n = GL.byD.get(d) || 0; el.style.fill = colorFor(n, maxD) || 'var(--muted)'; el.dataset.n = n;
    el.dataset.info = n ? t('map_info', { x: `<b>${esc(nm(d))}</b>`, n: `<b>${fmt(n)}</b>`, p: pct(n, A.n) }) : t('map_none', { x: esc(nm(d)) }); });
  // tanlangan davlat hududlari
  const sel = GL.sel, feats = sel ? (GL.adm.get(sel) || []) : [];
  const rows = sel ? GL.rows.filter(r => r.d === sel) : [], byV = new Map(groupBy(rows, 'v').map(x => [x.k, x.n])), tot = rows.reduce((a, r) => a + r.n, 0);
  const vals = [...byV.values()], maxV = Math.max(1, ...vals), minV = 0;
  GL.selF = feats; GL.lbF = [];
  GL.gA.innerHTML = feats.map((f, i) => { const h = f.properties.h, n = h ? (byV.get(h) || 0) : 0, c = n ? colorFor(n, maxV, minV) : null;
    const name = h ? nm(h) : (LANG === 'ru' ? f.properties.r : f.properties.e);
    const info = n ? t('map_info', { x: `<b>${esc(name)}</b>`, n: `<b>${fmt(n)}</b>`, p: pct(n, tot) }) : t('map_none', { x: esc(name) });
    return `<path class="a1 ${c ? '' : 'none'}" ${h ? `data-h="${esc(h)}"` : ''} data-n="${n}" data-info="${esc(info)}" ${st.v && st.v === h ? 'data-sel="1"' : ''} style="${c ? 'fill:' + c : ''}"></path>`; }).join('');
  // yorliqlar: har bir hudud uchun bitta (eng katta bo'lagi)
  const seen = new Set();
  feats.forEach(f => { const h = f.properties.h; if (!h || !byV.get(h) || seen.has(h)) return; seen.add(h); GL.lbF.push(f); });
  GL.gL.innerHTML = GL.lbF.map(f => `<text class="lb">${fmt(byV.get(f.properties.h))}</text>`).join('');
  // yon panel
  $('gl-back').hidden = !sel; $('gl-side').hidden = !sel;
  $('gl-title').textContent = sel ? t('gl_sel', { x: nm(sel), n: fmt(tot) }) : t('gl_all');
  if (sel) {
    const list = groupBy(rows, 'v').sort((a, b) => b.n - a.n), r0 = R.find(x => x.d === sel);
    const noMap = list.filter(x => !feats.some(f => f.properties.h === x.k));
    $('gl-side').innerHTML = `<h3>${esc(nm(sel))}</h3><p class="hint">${t('gl_side', { n: fmt(tot), h: list.length, a: feats.length })}</p>
      ${list.length ? `<div class="gl-list">${list.map(x => `<button type="button" class="gl-row" data-v="${esc(x.k)}" aria-pressed="${st.v === x.k}"><span>${esc(nm(x.k))}</span><b>${fmt(x.n)}</b><small>${pct(x.n, tot)}</small></button>`).join('')}</div>` : `<p class="empty">${t('map_none', { x: esc(nm(sel)) })}</p>`}
      ${noMap.length ? `<p class="hint">${t('gl_nomap', { x: noMap.map(x => esc(nm(x.k))).join(', ') })}</p>` : ''}
      ${r0 ? `<button type="button" class="btn sm primary" id="gl-filter">${st.d === sel ? t('gl_unfilter') : t('gl_filter')}</button>` : ''}`;
    $('gl-side').querySelectorAll('.gl-row').forEach(b => b.onclick = () => { const r = R.find(x => x.d === sel && x.v === b.dataset.v); if (r) set(st.v === r.v ? { q: r.q, m: r.m, d: sel } : { q: r.q, m: r.m, d: sel, v: r.v }); });
    if ($('gl-filter')) $('gl-filter').onclick = () => set(st.d === sel ? {} : { q: r0.q, m: r0.m, d: sel });
  }
  glDraw();
}
/* yumshoq harakat: aylanish va yaqinlashish */
function glFly(rot, k, ms = 900) {
  const d3 = window.d3; if (GL.anim) cancelAnimationFrame(GL.anim);
  const r0 = GL.rot.slice(), k0 = GL.k, ir = d3.interpolate(r0, rot), t0 = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = now => { const u = reduce ? 1 : Math.min(1, (now - t0) / ms), e = d3.easeCubicInOut(u); GL.rot = ir(e); GL.k = k0 * Math.pow(k / k0, e); glDraw(); if (u < 1) GL.anim = requestAnimationFrame(step); else GL.anim = null; };
  GL.anim = requestAnimationFrame(step);
}
function glSelect(d) {
  const d3 = window.d3;
  if (!d) { GL.sel = null; glPaint(); glFly(GL.rot, 1); return; }
  GL.sel = d;
  const feats = GL.adm.get(d), f = GL.countries.find(c => c.properties.d === d), dot = GL.dots.find(p => p.d === d);
  // markaz va kenglik: davlatning eng katta bo'lagi bo'yicha (Alyaska, orollar markazni surib yubormasin)
  const main = g => { if (!g || g.geometry.type !== 'MultiPolygon') return g; let best = null, ba = -1;
    g.geometry.coordinates.forEach(c => { const p = { type: 'Polygon', coordinates: c }, a = d3.geoArea(p); if (a > ba) { ba = a; best = p; } }); return { type: 'Feature', geometry: best }; };
  const geo = f ? main(f) : (feats && feats.length ? { type: 'FeatureCollection', features: feats } : null);
  let c, span;
  if (geo) { c = d3.geoCentroid(geo); const b = d3.geoBounds(geo); span = Math.max(b[1][1] - b[0][1], ((b[1][0] - b[0][0]) + 360) % 360 || 1); }
  else if (dot) { c = [dot.x, dot.y]; span = 2; }
  else return;
  // juda katta davlatlar (Rossiya, Kanada) uchun markaz va kenglik
  if (span > 120) span = 120;
  const k = Math.max(1.3, Math.min(30, 95 / span));
  glPaint(); glFly([-c[0], -c[1]], k);
}
function glWire(svg) {
  let drag = null;
  svg.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, r: GL.rot.slice(), moved: false }; svg.setPointerCapture(e.pointerId); if (GL.anim) { cancelAnimationFrame(GL.anim); GL.anim = null; } });
  svg.addEventListener('pointermove', e => {
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) { const rect = svg.getBoundingClientRect(), s = 800 / rect.width * 0.25 / GL.k * 1.6; GL.rot = [drag.r[0] + dx * s, Math.max(-88, Math.min(88, drag.r[1] - dy * s))]; glDraw(); } return; }
    const el = e.target.closest('[data-info]'); if (el) $('info-world').innerHTML = el.dataset.info;
  });
  const up = e => {
    if (!drag) return; const wasDrag = drag.moved; drag = null;
    if (wasDrag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), a1 = el && el.closest('[data-h]'), c = el && el.closest('[data-d]');
    if (a1 && GL.sel) { const r = R.find(x => x.d === GL.sel && x.v === a1.dataset.h); if (r) set(st.v === r.v ? { q: r.q, m: r.m, d: GL.sel } : { q: r.q, m: r.m, d: GL.sel, v: r.v }); return; }
    if (c) glSelect(c.dataset.d === GL.sel ? GL.sel : c.dataset.d);
  };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', () => { drag = null; });
  svg.addEventListener('mouseleave', () => { $('info-world').textContent = t('gl_hover'); });
  svg.addEventListener('wheel', e => { e.preventDefault(); GL.k = Math.max(1, Math.min(30, GL.k * Math.exp(-e.deltaY * 0.0016))); glDraw(); }, { passive: false });
  $('gl-in').onclick = () => glFly(GL.rot, Math.min(30, GL.k * 1.8), 400);
  $('gl-out').onclick = () => glFly(GL.rot, Math.max(1, GL.k / 1.8), 400);
  $('gl-home').onclick = () => { if (st.d) set({}); GL.sel = null; glPaint(); glFly([-64, -30], 1); };
  $('gl-back').onclick = () => { if (st.d) set({}); glSelect(null); };
  svg.addEventListener('keydown', e => { const s = 8 / GL.k; const m = { ArrowLeft: [s, 0], ArrowRight: [-s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (m) { e.preventDefault(); GL.rot = [GL.rot[0] + m[0], Math.max(-88, Math.min(88, GL.rot[1] + m[1]))]; glDraw(); } else if (e.key === '+' || e.key === '=') $('gl-in').click(); else if (e.key === '-') $('gl-out').click(); else if (e.key === 'Escape') glSelect(null); });
}
/* app.js dagi renderMaps chaqiradi */
function renderGlobe(A, rows) {
  if (!glBuild()) return false;
  GL.A = A; GL.rows = rows; GL.byD = new Map(groupBy(rows, 'd').map(x => [x.k, x.n]));
  // filtrda davlat tanlansa, globus o'sha davlatga uchadi; filtr olib tashlansa, qaytadi
  if (st.d !== GL.lastD) { const prev = GL.lastD; GL.lastD = st.d;
    if (st.d && (GL.adm.has(st.d) || GL.countries.some(c => c.properties.d === st.d) || GL.dots.some(p => p.d === st.d))) { if (st.d !== GL.sel) glSelect(st.d); else glPaint(); }
    else if (prev && GL.sel === prev) glSelect(null); else glPaint(); }
  else glPaint();
  $('sub-world').textContent = t('sub_world', { n: fmt(A.n), d: GL.byD.size }); legend($('lg-world'), Math.max(1, ...GL.byD.values()));
  if (!$('info-world').innerHTML) $('info-world').textContent = t('gl_hover');
  return true;
}
