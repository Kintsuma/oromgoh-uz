/* ================= Ish jarayoni: mehmonlar, xonalar, xodimlar (db) ================= */
let EXTRA = [], GUESTS = [], ROOMS_DB = {}, STAFF = {}, REQS = [], DB = null, USER = null, UID = null, ROLE = null, ME = null, PIN = null, UNLOCKED = false;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const REC = "Do'st yoki tanish tavsiyasi";

/* ---- 1000 ta xona: 10 korpus × 4 qavat × 25 xona ---- */
const KORPUS = 'ABCDEFGHIJ'.split('');
const ROOMS = []; KORPUS.forEach(k => { for (let f = 1; f <= 4; f++) for (let n = 1; n <= 25; n++) ROOMS.push(`${k}${f}${String(n).padStart(2, '0')}`); });
let KSEL = 'A', ROOMSEL = null, ROOMCONFIRM = false, HKASK = null;
const occupant = id => GUESTS.find(g => g.holat === 'oromgohda' && g.xona === id);
const roomState = id => occupant(id) ? 'band' : (ROOMS_DB[id] && ROOMS_DB[id].toza === false ? 'iflos' : 'toza');
const freeRooms = () => ROOMS.filter(r => roomState(r) === 'toza');

/* ---- Mehmon -> statistika kubiga qator ---- */
const toifaOf = (yosh, jinsi, oila) => yosh < 16 ? (jinsi === 'erkak' ? "o'g'il bola" : 'qiz bola') : oila === 'turmush qurgan' ? (jinsi === 'erkak' ? 'erkak' : 'ayol') : (jinsi === 'erkak' ? 'yigit' : 'qiz');
const ageGroup = a => a < 16 ? 0 : a < 25 ? 1 : a < 35 ? 2 : a < 45 ? 3 : a < 55 ? 4 : a < 65 ? 5 : 6;
function guestRow(g) {
  const base = BASE.find(r => r.d === g.davlat) || BASE[0], o = zero();
  o.q = base.q; o.m = base.m; o.d = g.davlat; o.v = g.hudud; o.n = 1;
  if (g.jinsi === 'erkak') o.e = 1; else o.a = 1;
  const yosh = +g.yosh; o.s = yosh; o.c = 1;
  const ki = K.indexOf(g.kanal); if (ki >= 0) o.k[ki] = 1;
  const ti = T.indexOf(g.tavsiya); if (g.kanal === REC && ti >= 0) o.t[ti] = 1;
  const yi = Y.indexOf(g.sana.slice(0, 4)), tfk = toifaOf(yosh, g.jinsi, g.oila), tfi = TFI[tfk];
  if (yi >= 0) { o.y[yi] = 1; o.yt[yi * TF.length + tfi] = 1; }
  o.g[ageGroup(yosh)] = 1; o.tf[tfi] = 1; o.ps[PSI['kelgan']] = 1;
  const mi = PMON.indexOf(g.sana.slice(0, 7)); if (mi >= 0) o.pm[mi * PS.length + PSI['kelgan']] = 1;
  o.mo[+g.sana.slice(5, 7) - 1] = 1; o.dev[DEV.indexOf('Other/Unknown')] = 1; o.brw[BRW.indexOf('-unknown-')] = 1;
  const cl = nearestCluster(yosh, g.jinsi === 'ayol' ? 1 : 0, yosh < 16 ? 1 : 0, yosh >= 16 && g.oila === 'turmush qurgan' ? 1 : 0, g.davlat === UZ ? 1 : 0);
  o.kl[KL.indexOf(cl)] = 1;
  return o;
}
const validGuest = g => g && typeof g.ism === 'string' && g.ism.trim() && BASE.some(r => r.d === g.davlat && r.v === g.hudud) && /^\d{4}-\d{2}-\d{2}$/.test(g.sana || '')
  && Y.includes(String(g.sana).slice(0, 4)) && Number.isInteger(+g.yosh) && +g.yosh >= 0 && +g.yosh <= 100 && (g.jinsi === 'erkak' || g.jinsi === 'ayol') && K.includes(g.kanal);
function decorate(g) { g._q = (BASE.find(r => r.d === g.davlat) || {}).q; g._m = (BASE.find(r => r.d === g.davlat) || {}).m; g._toifa = toifaOf(+g.yosh, g.jinsi, g.oila); if (!g.holat) g.holat = 'ketgan'; return g; }
function rebuildExtra() {
  GUESTS = GUESTS.filter(validGuest).map(decorate);
  EXTRA = GUESTS.filter(g => g.holat === 'oromgohda' || g.holat === 'ketgan');   // bron qilinganlar hali kelmagan
  EXTRA_ROWS = EXTRA.map(guestRow); R = BASE.concat(EXTRA_ROWS); TOTAL = D.jami + EXTRA.length;
  if (ROLE === 'menejer') { buildSearch(); buildCmpOptions(); render(); }
  renderOps();
}

/* ---- Forma ---- */
function buildAddForm(keepVals) {
  const dv = $('a-davlat').value, hv = $('a-hudud').value, kv = $('a-kanal').value, tv = $('a-tavsiya').value, xv = $('a-xona').value;
  const davs = groupBy(BASE, 'd').map(x => x.k).sort((a, b) => nm(a).localeCompare(nm(b)));
  $('a-davlat').innerHTML = davs.map(d => `<option value="${esc(d)}">${esc(nm(d))}</option>`).join('');
  $('a-davlat').value = keepVals && dv ? dv : UZ;
  fillHudud(keepVals ? hv : null);
  $('a-kanal').innerHTML = K.map(k => `<option value="${esc(k)}">${esc(nm(k))}</option>`).join('');
  $('a-kanal').value = keepVals && kv ? kv : REC;
  $('a-tavsiya').innerHTML = T.map(k => `<option value="${esc(k)}">${esc(nm(k))}</option>`).join('');
  if (keepVals && tv) $('a-tavsiya').value = tv;
  $('a-tavsiya-l').hidden = $('a-kanal').value !== REC;
  document.querySelectorAll('#a-holat option').forEach(o => o.textContent = t('h_' + o.value));
  document.querySelectorAll('#g-st option').forEach(o => o.textContent = o.value === '' ? t('all') : o.value === 'faol' ? t('gs_faol') : t('h_' + o.value));
  $('g-q').placeholder = t('g_ph');
  if (!$('a-sana').value) $('a-sana').value = today();
  if (!$('a-ketish').value) $('a-ketish').value = addDays(today(), 3);
  fillRooms(keepVals ? xv : null);
}
function fillRooms(keep) {
  const fr = freeRooms(), bron = $('a-holat').value === 'bron';
  $('a-xona').innerHTML = (bron ? `<option value="">${esc(t('a_xona_later'))}</option>` : '') + fr.map(r => `<option value="${r}">${r}</option>`).join('');
  if (keep && (fr.includes(keep) || (bron && keep === ''))) $('a-xona').value = keep;
}
function fillHudud(keep) {
  const d = $('a-davlat').value, hs = BASE.filter(r => r.d === d).map(r => r.v).sort((a, b) => nm(a).localeCompare(nm(b)));
  $('a-hudud').innerHTML = hs.map(h => `<option value="${esc(h)}">${esc(nm(h))}</option>`).join('');
  if (keep && hs.includes(keep)) $('a-hudud').value = keep;
}
$('a-davlat').onchange = () => fillHudud(null);
$('a-holat').onchange = () => { $('a-sana').value = $('a-holat').value === 'bron' ? addDays(today(), 1) : today(); $('a-ketish').value = addDays($('a-sana').value, 3); fillRooms($('a-holat').value === 'bron' ? '' : null); };
$('a-kanal').onchange = () => { $('a-tavsiya-l').hidden = $('a-kanal').value !== REC; };
$('a-yosh').oninput = () => { $('a-oila').disabled = (+$('a-yosh').value < 16); };
const opmsg = (cls, key, v) => { const el = $('op-msg'); el.className = 'formmsg ' + cls; el.textContent = key ? t(key, v) : ''; clearTimeout(opmsg._t); if (cls === 'ok') opmsg._t = setTimeout(() => { el.textContent = ''; }, 6000); };
const fmsg = (cls, key, v) => { $('a-msg').className = 'formmsg ' + cls; $('a-msg').textContent = key ? t(key, v) : ''; };
$('addform').addEventListener('submit', async e => {
  e.preventDefault(); fmsg('', '');
  const y = +$('a-yosh').value, holat = $('a-holat').value;
  const g = { ism: $('a-ism').value.trim().slice(0, 60), davlat: $('a-davlat').value, hudud: $('a-hudud').value, sana: $('a-sana').value, ketish: $('a-ketish').value,
    jinsi: $('a-jinsi').value, yosh: y, oila: y < 16 ? 'voyaga yetmagan' : $('a-oila').value, kanal: $('a-kanal').value, holat, xona: $('a-xona').value || '' };
  if (g.kanal === REC) g.tavsiya = $('a-tavsiya').value;
  if (!g.ism) { fmsg('err', 'a_err_name'); $('a-ism').focus(); return; }
  if (!Number.isInteger(y) || y < 0 || y > 100 || $('a-yosh').value === '') { fmsg('err', 'a_err_age'); $('a-yosh').focus(); return; }
  if (!g.sana || g.sana < '2010-01-01' || (holat === 'oromgohda' && g.sana > today()) || (holat === 'bron' && g.sana < today())) { fmsg('err', holat === 'bron' ? 'a_err_bron' : 'a_err_date'); $('a-sana').focus(); return; }
  if (!g.ketish || g.ketish < g.sana) { fmsg('err', 'a_err_out'); $('a-ketish').focus(); return; }
  if (holat === 'oromgohda' && !g.xona) { fmsg('err', 'a_err_room'); return; }
  if (g.xona && roomState(g.xona) !== 'toza') { fmsg('err', 'a_err_roomtaken', { x: g.xona }); fillRooms(null); return; }
  $('a-save').disabled = true;
  try {
    g.createdAt = new Date().toISOString(); g.createdBy = UID; if (holat === 'oromgohda') g.keldiAt = g.createdAt;
    await DB.collection('mehmonlar').add(g); afterGuestAdded(g);
    opmsg('ok', holat === 'bron' ? 'a_saved_bron' : 'a_saved', { x: g.ism, r: g.xona }); $('a-ism').value = ''; closeDrawer();
  } catch (err) { fmsg('err', err && err.code === 'invalid_argument' ? 'a_ro' : err && err.code === 'quota_exceeded' ? 'a_quota' : 'a_fail'); }
  finally { $('a-save').disabled = false; }
});

/* ---- Yon panel (yangi mehmon) ---- */
function openDrawer() { buildAddForm(true); fmsg('', ''); $('drawer').hidden = false; $('drawer-bg').hidden = false; setTimeout(() => $('a-ism').focus(), 30); }
function closeDrawer() { if (!$('drawer')) return; $('drawer').hidden = true; $('drawer-bg').hidden = true; }
$('open-add').onclick = () => { PENDING_BRON = null; openDrawer(); }; $('close-add').onclick = closeDrawer; $('drawer-bg').onclick = closeDrawer;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('drawer').hidden) closeDrawer(); });

/* ---- Qabulxona amallari ---- */
const nowIso = () => new Date().toISOString();
let OPBUSY = false, PICK = null, DELASK = null;
let ACTERR = '';
async function act(fn) { if (OPBUSY) return; OPBUSY = true; ACTERR = ''; try { await fn(); } catch (e) { ACTERR = e && e.code === 'invalid_argument' ? 'a_ro' : 'a_fail'; if (VIEW !== 'xonalar') opmsg('err', ACTERR); } finally { OPBUSY = false; renderOps(); } }
const checkIn = (id, room) => act(async () => {
  if (roomState(room) !== 'toza') { fmsg('err', 'a_err_roomtaken', { x: room }); return; }
  await DB.doc('mehmonlar/' + id).update({ holat: 'oromgohda', xona: room, keldiAt: nowIso(), sana: today() }); PICK = null;
});
const checkOut = (id) => act(async () => {
  const g = GUESTS.find(x => x.id === id); if (!g) return;
  await DB.doc('mehmonlar/' + id).update({ holat: 'ketgan', ketdiAt: nowIso(), ketish: today() });
  if (g.xona) await DB.doc('xonalar/' + g.xona).set({ toza: false, at: nowIso(), by: UID });
});
const delGuest = (id) => act(async () => { await DB.doc('mehmonlar/' + id).delete(); DELASK = null; });
const setRoom = (room, toza) => act(async () => { await DB.doc('xonalar/' + room).set({ toza, at: nowIso(), by: UID }); ROOMCONFIRM = false; });

function guestItem(g, ctx) {
  const can = ROLE === 'menejer' || ROLE === 'qabulxona';
  const st = `<span class="pill st-${g.holat}">${esc(t('h_' + g.holat))}</span>`;
  const meta = [nm(g.davlat), g.xona ? t('g_room', { x: g.xona }) : t('g_noroom'), `${g.sana} → ${g.ketish || '—'}`].filter(Boolean).join(' · ');
  let actn = '';
  if (can && g.holat === 'bron') {
    if (PICK === g.id) { const fr = freeRooms(); const def = g.xona && fr.includes(g.xona) ? g.xona : fr[0];
      actn = `<select class="sm" data-pick-sel="${g.id}">${fr.map(r => `<option ${r === def ? 'selected' : ''}>${r}</option>`).join('')}</select><button type="button" class="btn sm primary" data-in="${g.id}">${t('g_confirm_in')}</button><button type="button" class="btn sm" data-pick-cancel="1">${t('del_no')}</button>`;
    } else actn = `<button type="button" class="btn sm primary" data-pick="${g.id}">${t('g_in')}</button>`;
  }
  if (can && g.holat === 'oromgohda') actn = `<button type="button" class="btn sm warn" data-out="${g.id}">${t('g_out')}</button>`;
  if (ROLE === 'menejer') actn += DELASK === g.id ? ` <button type="button" class="rowdel danger" data-del="${g.id}">${t('del_yes')}</button><button type="button" class="rowdel" data-del-cancel="1">${t('del_no')}</button>` : ` <button type="button" class="rowdel" data-delask="${g.id}">${t('del')}</button>`;
  return `<div class="op"><div class="op-main"><b>${esc(g.ism)}</b> ${st}<span>${esc(meta)}</span></div><div class="op-act">${actn}</div></div>`;
}
function wireOps(el) {
  el.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { PICK = b.dataset.pick; renderOps(); });
  el.querySelectorAll('[data-pick-cancel]').forEach(b => b.onclick = () => { PICK = null; renderOps(); });
  el.querySelectorAll('[data-in]').forEach(b => b.onclick = () => checkIn(b.dataset.in, el.querySelector(`[data-pick-sel="${b.dataset.in}"]`).value));
  el.querySelectorAll('[data-out]').forEach(b => b.onclick = () => checkOut(b.dataset.out));
  el.querySelectorAll('[data-delask]').forEach(b => b.onclick = () => { DELASK = b.dataset.delask; renderOps(); });
  el.querySelectorAll('[data-del-cancel]').forEach(b => b.onclick = () => { DELASK = null; renderOps(); });
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => delGuest(b.dataset.del));
}
const emptyBox = key => `<p class="empty">${t(key)}</p>`;
function renderOps() {
  if (!UNLOCKED) return;
  const td = today();
  const comingToday = GUESTS.filter(g => g.holat === 'bron' && g.sana <= td).sort((a, b) => a.sana.localeCompare(b.sana));
  const leavingToday = GUESTS.filter(g => g.holat === 'oromgohda' && g.ketish && g.ketish <= td);
  const inside = GUESTS.filter(g => g.holat === 'oromgohda');
  const cnt = { toza: 0, iflos: 0, band: 0 }; ROOMS.forEach(r => cnt[roomState(r)]++);
  $('op-kpis').innerHTML = `
    <div class="kpi lead"><span class="lbl">${t('k_inside')}</span><b>${fmt(inside.length)}</b><small>${t('k_inside_s', { n: fmt(cnt.band) })}</small></div>
    <div class="kpi"><span class="lbl">${t('k_in_today')}</span><b>${fmt(comingToday.length)}</b><small>${td}</small></div>
    <div class="kpi"><span class="lbl">${t('k_out_today')}</span><b>${fmt(leavingToday.length)}</b><small>${td}</small></div>
    <div class="kpi"><span class="lbl">${t('k_free')}</span><b style="color:var(--r-toza-t)">${fmt(cnt.toza)}</b><small>${t('k_of', { n: fmt(ROOMS.length) })}</small></div>
    <div class="kpi"><span class="lbl">${t('k_dirty')}</span><b style="color:var(--r-iflos-t)">${fmt(cnt.iflos)}</b><small>${t('k_dirty_s')}</small></div>`;
  $('sub-today-in').textContent = t('n_guests', { n: fmt(comingToday.length) });
  $('today-in').innerHTML = comingToday.length ? comingToday.slice(0, 60).map(g => guestItem(g)).join('') : emptyBox('e_in');
  $('sub-today-out').textContent = t('n_guests', { n: fmt(leavingToday.length) });
  $('today-out').innerHTML = leavingToday.length ? leavingToday.slice(0, 60).map(g => guestItem(g)).join('') : emptyBox('e_out');
  const q = $('g-q').value.trim().toLowerCase(), sf = $('g-st').value;
  const list = GUESTS.filter(g => (sf === '' || (sf === 'faol' ? g.holat !== 'ketgan' : g.holat === sf)) && (!q || g.ism.toLowerCase().includes(q) || (g.xona || '').toLowerCase().includes(q)))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  $('sub-guests').textContent = t('n_guests', { n: fmt(list.length) });
  $('guest-list').innerHTML = list.length ? list.slice(0, 100).map(g => guestItem(g)).join('') : emptyBox(GUESTS.length ? 'e_filter' : 'e_none');
  ['today-in', 'today-out', 'guest-list'].forEach(id => wireOps($(id)));
  dbState('db_ok', { n: GUESTS.length });
  if ($('a-xona').options.length !== freeRooms().length + ($('a-holat').value === 'bron' ? 1 : 0)) fillRooms($('a-xona').value);
  renderRooms(cnt); renderStaff();
}
$('g-q').addEventListener('input', renderOps); $('g-st').addEventListener('change', renderOps);
function dbState(key, v) { $('dbstate').textContent = key ? t(key, v) : ''; }

/* ---- Xonalar ---- */
function renderRooms(cnt) {
  cnt = cnt || (() => { const c = { toza: 0, iflos: 0, band: 0 }; ROOMS.forEach(r => c[roomState(r)]++); return c; })();
  $('i-xonalar').textContent = t(ROLE === 'tozalovchi' ? 'i_xonalar_t' : 'i_xonalar');
  if (VIEW === 'xonalar') $('pg-sub').textContent = $('i-xonalar').textContent;
  $('room-sum').innerHTML = [['toza', 'r_clean'], ['iflos', 'r_dirty'], ['band', 'r_busy']].map(([k, l]) => `<div class="rs rs-${k}"><b>${fmt(cnt[k])}</b><span>${t(l)}</span></div>`).join('');
  const kc = k => { const c = { iflos: 0, toza: 0, band: 0 }; ROOMS.filter(r => r[0] === k).forEach(r => c[roomState(r)]++); return c; };
  $('korpus-tabs').innerHTML = KORPUS.map(k => { const c = kc(k); return `<button class="tab" role="tab" type="button" aria-selected="${KSEL === k}" data-k="${k}">${t('korpus', { k })} ${c.iflos ? `<small class="dot-y">${c.iflos}</small>` : ''}</button>`; }).join('');
  $('korpus-tabs').querySelectorAll('.tab').forEach(b => b.onclick = () => { KSEL = b.dataset.k; ROOMSEL = null; renderRooms(); });
  const only = $('only-dirty').checked;
  $('sub-rooms').textContent = only ? t('r_dirty_all', { n: fmt(cnt.iflos) }) : t('r_korpus_sub', { k: KSEL });
  $('korpus-tabs').hidden = only;
  const tile = r => `<button type="button" class="room r-${roomState(r)} ${ROOMSEL === r ? 'sel' : ''}" data-r="${r}" aria-label="${r}: ${esc(t('r_' + ({ toza: 'clean', iflos: 'dirty', band: 'busy' })[roomState(r)]))}">${only ? r : r.slice(1)}</button>`;
  if (only) {
    const dirty = ROOMS.filter(r => roomState(r) === 'iflos');
    $('room-grid').innerHTML = dirty.length ? `<div class="tiles">${dirty.map(tile).join('')}</div>` : emptyBox('e_dirty');
  } else {
    $('room-grid').innerHTML = [4, 3, 2, 1].map(f => `<div class="floor"><span class="fl">${t('qavat', { f })}</span><div class="tiles">${ROOMS.filter(r => r[0] === KSEL && r[1] === String(f)).map(tile).join('')}</div></div>`).join('');
  }
  $('room-grid').querySelectorAll('.room').forEach(b => b.onclick = () => { ROOMSEL = b.dataset.r; ROOMCONFIRM = false; renderRooms(); });
  /* tozalash vazifalari ro'yxati */
  const dirtyAll = ROOMS.filter(r => roomState(r) === 'iflos').sort((x, y) => String((ROOMS_DB[x] || {}).at).localeCompare(String((ROOMS_DB[y] || {}).at)));
  $('sub-tasks').textContent = t('sub_tasks', { n: fmt(dirtyAll.length) });
  $('hk-card').hidden = ROLE !== 'tozalovchi' && !dirtyAll.length;
  $('hk-tasks').innerHTML = dirtyAll.length ? dirtyAll.slice(0, 60).map(r => `<div class="op hk"><div class="op-main"><b>${r}</b><span>${t('korpus', { k: r[0] })} · ${t('qavat', { f: r[1] })}${ROOMS_DB[r] && ROOMS_DB[r].at ? ' · ' + String(ROOMS_DB[r].at).slice(11, 16) : ''}</span></div><div class="op-act">${
    HKASK === r ? `<button type="button" class="btn sm ok" data-hk-yes="${r}">${t('r_yes_clean')}</button><button type="button" class="btn sm" data-hk-no="1">${t('del_no')}</button>` : `<button type="button" class="btn ok" data-hk="${r}">${t('r_mark_clean')}</button>`}</div></div>`).join('') : emptyBox('e_dirty');
  $('hk-tasks').querySelectorAll('[data-hk]').forEach(b => b.onclick = () => { HKASK = b.dataset.hk; renderRooms(); });
  $('hk-tasks').querySelectorAll('[data-hk-no]').forEach(b => b.onclick = () => { HKASK = null; renderRooms(); });
  $('hk-tasks').querySelectorAll('[data-hk-yes]').forEach(b => b.onclick = () => { const r = b.dataset.hkYes; HKASK = null; setRoom(r, true); });
  renderRoomInfo();
}
$('only-dirty').addEventListener('change', () => { ROOMSEL = null; renderRooms(); });
function renderRoomInfo() {
  const el = $('room-info'); if (!ROOMSEL) { el.innerHTML = `<span class="hint">${t('r_pick')}</span>`; return; }
  const r = ROOMSEL, s = roomState(r), occ = occupant(r), info = ROOMS_DB[r];
  let h = `<b class="rn r-${s}">${r}</b> <span>${t('r_' + ({ toza: 'clean', iflos: 'dirty', band: 'busy' })[s])}</span>`;
  if (s === 'band' && occ && ROLE !== 'tozalovchi') h += ` · <span>${esc(occ.ism)} · ${t('g_until', { d: occ.ketish || '—' })}</span>`;
  if (s === 'band' && ROLE === 'tozalovchi') h += ` · <span>${t('r_busy_t')}</span>`;
  if (info && info.at) h += ` <small class="hint">· ${t('r_changed', { d: String(info.at).slice(0, 16).replace('T', ' ') })}</small>`;
  if (s === 'iflos') h += ROOMCONFIRM ? ` <span>${t('r_q_clean', { x: r })}</span> <button type="button" class="btn sm ok" id="r-yes">${t('r_yes_clean')}</button><button type="button" class="btn sm" id="r-no">${t('del_no')}</button>`
    : ` <button type="button" class="btn sm ok big-btn" id="r-clean">${t('r_mark_clean')}</button>`;
  if (s === 'toza' && ROLE === 'menejer') h += ` <button type="button" class="btn sm" id="r-dirty">${t('r_mark_dirty')}</button>`;
  if (ACTERR && VIEW === 'xonalar') h += ` <span class="formmsg err">${t(ACTERR)}</span>`;
  el.innerHTML = h;
  const b = id => document.getElementById(id);
  if (b('r-clean')) b('r-clean').onclick = () => { ROOMCONFIRM = true; renderRoomInfo(); };
  if (b('r-no')) b('r-no').onclick = () => { ROOMCONFIRM = false; renderRoomInfo(); };
  if (b('r-yes')) b('r-yes').onclick = () => setRoom(r, true);
  if (b('r-dirty')) b('r-dirty').onclick = () => setRoom(r, false);
}

/* ---- Xodimlar va so'rovlar (menejer) ---- */
const roleName = r => t('lvl_' + r);
let STAFFASK = null;
const approve = (q) => act(async () => {
  if (q.turi === 'parol') await DB.doc('xodimlar/' + q.id).update({ parolReset: nowIso() });
  else await DB.doc('xodimlar/' + q.id).set({ ism: q.ism, rol: q.rol, login: q.login || '', holat: 'faol', approvedAt: nowIso(), approvedBy: UID });
  await DB.doc('sorovlar/' + q.id).update({ holat: 'qabul qilindi', hal: nowIso() });
});
const reject = (q) => act(async () => { await DB.doc('sorovlar/' + q.id).update({ holat: 'rad etildi', hal: nowIso() }); });
function reqButtons(q) { return `<button type="button" class="btn sm ok" data-ok="${q.id}">${t('rq_ok')}</button><button type="button" class="btn sm danger" data-no="${q.id}">${t('rq_no')}</button>`; }
function wireReq(el) {
  el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => approve(REQS.find(q => q.id === b.dataset.ok)));
  el.querySelectorAll('[data-no]').forEach(b => b.onclick = () => reject(REQS.find(q => q.id === b.dataset.no)));
}
function renderStaff() {
  if (ROLE !== 'menejer') { $('mgr-notice').hidden = true; return; }
  const pend = REQS.filter(q => q.holat === 'kutilmoqda');
  $('req-badge').hidden = !pend.length; $('req-badge').textContent = pend.length;
  const dup = q => q.login && Object.entries(STAFF).some(([id, s]) => id !== q.id && s.login === q.login && s.holat === 'faol');
  const qtxt = q => (q.turi === 'parol' ? t('rq_pass', { x: esc(q.ism), l: esc(q.login || '') }) : t('rq_new', { x: esc(q.ism), l: esc(q.login || ''), r: esc(roleName(q.rol)) })) + (dup(q) ? ' · ' + t('rq_dup') : '');
  $('sub-req').textContent = t('rq_count', { n: pend.length });
  $('req-list').innerHTML = pend.length ? pend.map(q => `<div class="op"><div class="op-main"><b>${qtxt(q)}</b><span>${esc(String(q.at || '').slice(0, 16).replace('T', ' '))}</span></div><div class="op-act">${reqButtons(q)}</div></div>`).join('') : emptyBox('e_req');
  wireReq($('req-list'));
  if (pend.length) {
    const q = pend[0];
    $('mgr-notice').innerHTML = `<span class="bell" aria-hidden="true"></span><span>${qtxt(q)}${pend.length > 1 ? ' ' + t('rq_more', { n: pend.length - 1 }) : ''}</span><span class="op-act">${reqButtons(q)}<button type="button" class="btn sm" data-goreq="1">${t('rq_all')}</button></span>`;
    $('mgr-notice').hidden = false; wireReq($('mgr-notice'));
    $('mgr-notice').querySelector('[data-goreq]').onclick = () => { try { location.hash = 'xodimlar'; } catch (e) { showView('xodimlar', true); } };
  } else $('mgr-notice').hidden = true;
  const staff = Object.entries(STAFF).map(([id, s]) => ({ id, ...s })).sort((a, b) => String(a.ism).localeCompare(String(b.ism)));
  $('sub-staff').textContent = t('st_count', { n: staff.filter(s => s.holat === 'faol').length });
  $('staff-list').innerHTML = staff.length ? staff.map(s => `<div class="op"><div class="op-main"><b>${esc(s.ism)}</b> <span>@${esc(s.login || '—')}</span> <span class="pill ${s.holat === 'faol' ? 'st-oromgohda' : 'st-ketgan'}">${esc(t(s.holat === 'faol' ? 'st_active' : 'st_off'))}</span><span>${esc(roleName(s.rol))}</span></div><div class="op-act">
      <select class="sm" data-role="${s.id}" aria-label="${esc(t('st_role'))}">${['qabulxona', 'tozalovchi'].map(r => `<option value="${r}" ${s.rol === r ? 'selected' : ''}>${esc(roleName(r))}</option>`).join('')}</select>
      ${s.holat === 'faol' ? (STAFFASK === s.id ? `<button type="button" class="rowdel danger" data-off="${s.id}">${t('st_off_yes')}</button><button type="button" class="rowdel" data-off-cancel="1">${t('del_no')}</button>` : `<button type="button" class="rowdel" data-offask="${s.id}">${t('st_remove')}</button>`)
        : `<button type="button" class="rowdel" data-on="${s.id}">${t('st_restore')}</button>`}</div></div>`).join('') : emptyBox('e_staff');
  const el = $('staff-list');
  el.querySelectorAll('[data-role]').forEach(s => s.onchange = () => act(() => DB.doc('xodimlar/' + s.dataset.role).update({ rol: s.value })));
  el.querySelectorAll('[data-offask]').forEach(b => b.onclick = () => { STAFFASK = b.dataset.offask; renderStaff(); });
  el.querySelectorAll('[data-off-cancel]').forEach(b => b.onclick = () => { STAFFASK = null; renderStaff(); });
  el.querySelectorAll('[data-off]').forEach(b => b.onclick = () => { STAFFASK = null; act(() => DB.doc('xodimlar/' + b.dataset.off).update({ holat: "o'chirilgan" })); });
  el.querySelectorAll('[data-on]').forEach(b => b.onclick = () => act(() => DB.doc('xodimlar/' + b.dataset.on).update({ holat: 'faol' })));
}

/* ================= Kirish: login, parol, darajalar ================= */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
async function passHash(pass, saltHex, iter) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unhex(saltHex), iterations: iter, hash: 'SHA-256' }, key, 256));
}
async function saveCred(login, pass, rol) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16))), iter = 150000;
  const doc = { login, rol: rol || ROLE, salt, iter, hash: await passHash(pass, salt, iter), at: nowIso() };
  await DB.doc(`data/users/${UID}/kirish`).set(doc); PIN = doc;
}
const normLogin = s => String(s || '').trim().toLowerCase();
const loginOk = s => /^[a-z0-9._-]{3,20}$/.test(s);
const passOk = s => s.length >= 8 && /[A-Za-zА-Яа-яЁё]/.test(s) && /\d/.test(s);
const gate = html => { $('gate').hidden = false; $('gate-card').innerHTML = `<div class="gate-brand"><b>Oromgoh<span>.uz</span></b><small>${t('brand_sub')}</small></div>` + html + `<p class="gate-back"><button type="button" class="linkbtn" data-gate-back="1">← ${t('gate_back')}</button></p>`; };
$('gate-card').addEventListener('click', e => { if (e.target.closest('[data-gate-back]')) { try { location.hash = 'mehmon'; } catch (x) { enterGuest(); } } });
const gmsg = (key, v, cls = 'err') => { const el = $('g-msg'); if (el) { el.className = 'formmsg ' + cls; el.textContent = key ? t(key, v) : ''; } };
let IS_OWNER = false, GSTATE = 'loading', FAILS = 0, WAIT_UNTIL = 0, LVL = null, IS_MGR = false;
const LEVELS = [['menejer', 'var(--lapis)', '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>'], ['qabulxona', 'var(--firuza)', '<path d="M3 20h18M5 20V10h14v10M9 20v-5h6v5"/><path d="M12 4l8 6H4z"/>'], ['tozalovchi', 'var(--zar)', '<path d="M4 20l6-6M14 4l6 6-8 8-6-6z"/><path d="M3 21h6"/>']];
const lvlColor = r => (LEVELS.find(l => l[0] === r) || LEVELS[0])[1];
function lvlTabs(sel, allowMgr = true, lockTo = null) {
  return `<div class="lvl-tabs" role="tablist">${LEVELS.map(([r, c, ic]) => `<button type="button" role="tab" class="lvl" style="--lvc:${c}" data-lvl="${r}" aria-selected="${sel === r}" ${!allowMgr && r === 'menejer' ? 'data-info="1"' : ''} ${lockTo && r !== lockTo ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><span>${t('lvl_' + r)}</span></button>`).join('')}</div>`;
}
function wireTabs(onPick) { document.querySelectorAll('.lvl-tabs [data-lvl]').forEach(b => b.onclick = () => { LVL = b.dataset.lvl; onPick(); }); }
const inp = (id, key, type = 'text', ac = 'off', extra = '') => type === 'password'
  ? `<label for="${id}">${t(key)}<span class="pwbox"><input id="${id}" type="password" autocomplete="${ac}" ${extra}><button type="button" class="pweye" data-for="${id}" aria-label="${t('pw_show')}" title="${t('pw_show')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label>`
  : `<label for="${id}">${t(key)}<input id="${id}" type="${type}" autocomplete="${ac}" ${extra}></label>`;
const PWCHK = () => `<ul class="pwchk" id="pwchk" aria-live="polite">${['pw_len', 'pw_let', 'pw_dig', 'pw_same'].map(k => `<li data-k="${k}">${t(k)}</li>`).join('')}</ul>`;
function wirePw() {
  document.querySelectorAll('.pweye').forEach(b => b.onclick = () => { const i = $(b.dataset.for); const sh = i.type === 'password'; i.type = sh ? 'text' : 'password'; b.classList.toggle('on', sh); b.title = b.ariaLabel = t(sh ? 'pw_hide' : 'pw_show'); });
  const box = $('pwchk'); if (!box) return;
  const upd = () => { const p = $('g-pass').value, q = $('g-pass2').value;
    const ok = { pw_len: p.length >= 8, pw_let: /[A-Za-zА-Яа-яЁё]/.test(p), pw_dig: /\d/.test(p), pw_same: !!p && p === q };
    box.querySelectorAll('li').forEach(li => { li.classList.toggle('ok', ok[li.dataset.k]); li.classList.toggle('no', !ok[li.dataset.k] && (li.dataset.k === 'pw_same' ? !!q : !!p)); });
    if (li_len) li_len.textContent = t('pw_len') + (p ? ` (${p.length}/8)` : ''); };
  const li_len = box.querySelector('[data-k=pw_len]');
  $('g-pass').addEventListener('input', upd); $('g-pass2').addEventListener('input', upd); upd();
}
function lockAll() {
  UNLOCKED = false; $('controls').hidden = true; $('who').hidden = true; $('mgr-notice').hidden = true; $('side').hidden = true; $('app').classList.add('noside'); closeDrawer();
  $('pg-title').textContent = t('gt_title'); $('pg-sub').textContent = t('brand_sub');
  document.querySelectorAll('.view').forEach(v => v.hidden = true); document.querySelector('.about').hidden = true;
}
function renderGate() {
  if (UNLOCKED) { $('gate').hidden = true; return; }
  lockAll();
  const s = GSTATE;
  if (s === 'loading') return gate(`<h2>${t('gt_loading')}</h2>`);
  if (s === 'outside') return gate(`<h2>${t('gt_outside_h')}</h2><p>${t('gt_outside')}</p>`);
  if (s === 'register') {
    LVL = LVL || 'qabulxona';
    if (LVL === 'menejer') return gate(lvlTabs(LVL, false) + `<div class="lvl-win" style="--lvc:${lvlColor('menejer')}"><h2>${t('win_menejer')}</h2><p>${t('gt_mgr_only')}</p></div>`), wireTabs(renderGate);
    return gate(lvlTabs(LVL, false) + `<div class="lvl-win" style="--lvc:${lvlColor(LVL)}"><h2>${t('gt_reg_h_' + LVL)}</h2><p>${t('gt_reg')}</p>
      <form id="g-form" class="gform" novalidate>
        ${inp('g-ism', 'a_ism', 'text', 'name', 'maxlength="60"')}${inp('g-login', 'gt_login_new', 'text', 'username', 'maxlength="20" autocapitalize="none" spellcheck="false"')}
        ${inp('g-pass', 'gt_pass_new', 'password', 'new-password')}${inp('g-pass2', 'gt_pass_rep', 'password', 'new-password')}${PWCHK()}
        <button class="btn primary big-btn" type="submit">${t('gt_reg_btn')}</button><span class="formmsg" id="g-msg" role="status"></span>
      </form><p class="hint">${t('gt_pass_hint')}</p></div>`), wireTabs(renderGate), wireRegister(), wirePw();
  }
  if (s === 'pending') return gate(`<h2>${t('gt_pend_h')}</h2><p>${t(PENDTYPE === 'parol' ? 'gt_pend_pass' : 'gt_pend')}</p><p class="hint">${t('gt_pend_live')}</p>`);
  if (s === 'rejected') return gate(`<h2>${t('gt_rej_h')}</h2><p>${t('gt_rej')}</p><button class="btn" type="button" id="g-again">${t('gt_again')}</button>`), ($('g-again').onclick = () => { GSTATE = 'register'; renderGate(); });
  if (s === 'removed') return gate(`<h2>${t('gt_off_h')}</h2><p>${t('gt_off')}</p>`);
  if (s === 'setcred') {
    const keepLogin = PIN && PIN.login ? PIN.login : (ME && ME.login) || '';
    const L0 = IS_MGR ? (LVL = LVL || (PIN && PIN.rol) || 'menejer') : (LVL = ROLE);
    const head = IS_MGR ? `<h2>${t('gt_set_h_' + L0)}</h2><p>${t(L0 === 'menejer' ? 'gt_set_mgr' : 'gt_set_owner_lvl', { r: esc(t('lvl_' + L0)) })}</p>` : `<h2>${t('gt_set_h')}</h2><p>${t('gt_set')}</p><p class="hint">${t('gt_lvl_locked')}</p>`;
    return gate(lvlTabs(L0, true, IS_MGR ? null : ROLE) + `<div class="lvl-win" style="--lvc:${lvlColor(L0)}">${head}
      <form id="g-form" class="gform" novalidate>
        ${inp('g-login', 'gt_login_new', 'text', 'username', `maxlength="20" autocapitalize="none" spellcheck="false" value="${esc(keepLogin)}" ${!IS_MGR && keepLogin ? 'readonly' : ''}`)}
        <span></span>${inp('g-pass', 'gt_pass_new', 'password', 'new-password')}${inp('g-pass2', 'gt_pass_rep', 'password', 'new-password')}${PWCHK()}
        <button class="btn primary big-btn" type="submit">${t('gt_set_btn')}</button><span class="formmsg" id="g-msg" role="status"></span>
      </form><p class="hint">${t('gt_pass_hint')}</p></div>`), wireTabs(renderGate), wireSetCred(), wirePw();
  }
  if (s === 'login') {
    LVL = LVL || ROLE;
    return gate(lvlTabs(LVL) + `<div class="lvl-win" style="--lvc:${lvlColor(LVL)}"><h2>${t('win_' + LVL)}</h2><p>${t('gt_login_p', { r: esc(t('lvl_' + LVL)) })}</p>
      <form id="g-form" class="gform one" novalidate>
        ${inp('g-login', 'gt_login', 'text', 'username', 'maxlength="20" autocapitalize="none" spellcheck="false" autofocus')}${inp('g-pass', 'gt_pass', 'password', 'current-password')}
        <button class="btn primary big-btn" type="submit">${t('gt_enter')}</button><span class="formmsg" id="g-msg" role="status"></span>
      </form><button class="btn sm" type="button" id="g-forgot">${t('gt_forgot')}</button><span class="formmsg" id="g-msg2"></span></div>`), wireTabs(renderGate), wireLogin(), wirePw();
  }
}
let PENDTYPE = 'royxat';
function wireRegister() {
  $('g-form').addEventListener('submit', async e => {
    e.preventDefault();
    const ism = $('g-ism').value.trim().slice(0, 60), login = normLogin($('g-login').value), p1 = $('g-pass').value, p2 = $('g-pass2').value, rol = LVL;
    if (!ism) return gmsg('a_err_name'); if (!loginOk(login)) return gmsg('gt_login_bad'); if (!passOk(p1)) return gmsg('gt_pass_bad'); if (p1 !== p2) return gmsg('gt_pass_diff');
    const btn = $('g-form').querySelector('button[type=submit]'); btn.disabled = true;
    try { await saveCred(login, p1); await DB.doc('sorovlar/' + UID).set({ ism, rol, login, turi: 'royxat', holat: 'kutilmoqda', at: nowIso() }); PENDTYPE = 'royxat'; GSTATE = 'pending'; renderGate(); }
    catch (err) { btn.disabled = false; gmsg(err && err.code === 'invalid_argument' ? 'gt_no_write' : 'a_fail'); }
  });
}
function wireSetCred() {
  $('g-form').addEventListener('submit', async e => {
    e.preventDefault(); const login = normLogin($('g-login').value), p1 = $('g-pass').value, p2 = $('g-pass2').value;
    if (!loginOk(login)) return gmsg('gt_login_bad'); if (!passOk(p1)) return gmsg('gt_pass_bad'); if (p1 !== p2) return gmsg('gt_pass_diff');
    const btn = $('g-form').querySelector('button[type=submit]'); btn.disabled = true;
    try { if (IS_MGR) ROLE = LVL; await saveCred(login, p1, ROLE); unlock(); } catch (err) { btn.disabled = false; gmsg(err && err.code === 'invalid_argument' ? 'gt_no_write' : 'a_fail'); }
  });
}
function wireLogin() {
  $('g-form').addEventListener('submit', async e => {
    e.preventDefault(); const now = Date.now();
    if (now < WAIT_UNTIL) return gmsg('gt_wait', { s: Math.ceil((WAIT_UNTIL - now) / 1000) });
    const login = normLogin($('g-login').value), pass = $('g-pass').value;
    if (!login || !pass) return gmsg('gt_fill');
    const h = await passHash(pass, PIN.salt, PIN.iter || 150000);
    if (login === PIN.login && h === PIN.hash) {
      if (LVL !== ROLE) { $('g-pass').value = ''; return gmsg('gt_lvl_wrong', { r: t('lvl_' + ROLE) }); }
      FAILS = 0; unlock();
    } else { FAILS++; $('g-pass').value = ''; if (FAILS >= 5) { WAIT_UNTIL = Date.now() + 30000; FAILS = 0; gmsg('gt_wait', { s: 30 }); } else gmsg('gt_wrong', { n: 5 - FAILS }); }
  });
  $('g-forgot').onclick = async () => {
    const m = $('g-msg2');
    if (IS_MGR) { LVL = ROLE; GSTATE = 'setcred'; renderGate(); return; }
    try { await DB.doc('sorovlar/' + UID).set({ ism: ME ? ME.ism : '', rol: ROLE, login: PIN ? PIN.login : '', turi: 'parol', holat: 'kutilmoqda', at: nowIso() }); PENDTYPE = 'parol'; GSTATE = 'pending'; renderGate(); }
    catch (err) { m.className = 'formmsg err'; m.textContent = t('a_fail'); }
  };
}
function unlock() {
  UNLOCKED = true; try { sessionStorage.setItem('kt_unlock', UID); } catch (e) {}
  $('gate').hidden = true; $('controls').hidden = false; document.querySelector('.about').hidden = false;
  const nmx = ME ? ME.ism : (PIN && PIN.login ? PIN.login : '');
  $('who').hidden = false; $('who-name').textContent = nmx; $('who-role').textContent = t('lvl_' + ROLE);
  $('who').style.setProperty('--lvc', lvlColor(ROLE)); $('who-av').textContent = nmx.split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '?';
  const side = ROLE !== 'tozalovchi'; $('side').hidden = !side; $('app').classList.toggle('noside', !side);
  $('rolebar').style.setProperty('--lvc', lvlColor(ROLE)); $('rolebar').innerHTML = `<b>${t('panel_' + ROLE)}</b><span>${t('panel_s_' + ROLE)}</span>`;
  NAVB.forEach(b => b.hidden = !(b.dataset.roles || '').split(' ').includes(ROLE));
  document.querySelectorAll('.nav-g').forEach(g => g.hidden = ![...g.querySelectorAll('button')].some(b => !b.hidden));
  $('demo-btn').hidden = ROLE !== 'menejer'; if (ROLE !== 'menejer' && DEMO) setDemo(false);
  $('demo-btn').textContent = t(DEMO ? 'demo_off' : 'demo_on');
  $('to-guest').hidden = false;
  startData(); buildAddForm(true); showView(location.hash.slice(1), false); renderOps(); renderClients(); renderKatalog(true);
}
$('lock-btn').addEventListener('click', () => {
  try { sessionStorage.removeItem('kt_unlock'); } catch (e) {}
  if (DEMO) setDemo(false);
  UNLOCKED = false; LVL = ROLE; GSTATE = PIN ? 'login' : 'setcred'; renderGate(); window.scrollTo(0, 0);
});
let DATA_STARTED = false;
let UNSUBS = [];
function stopData() { UNSUBS.forEach(u => { try { typeof u === 'function' && u(); } catch (e) {} }); UNSUBS = []; DATA_STARTED = false; }
function startData() {
  if (DATA_STARTED) return; DATA_STARTED = true;
  const timer = setTimeout(() => dbState('db_slow'), 10000); const keep = u => UNSUBS.push(u);
  keep(DB.collection('mehmonlar').onSnapshot(s => { if (!s.metadata || !s.metadata.fromCache) clearTimeout(timer); GUESTS = s.docs.map(d => ({ id: d.id, ...d.data() })); rebuildExtra(); }, () => { clearTimeout(timer); dbState('db_err'); }));
  keep(DB.collection('xonalar').onSnapshot(s => { ROOMS_DB = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); renderOps(); }, () => {}));
  if (ROLE === 'menejer') {
    keep(DB.collection('xodimlar').onSnapshot(s => { STAFF = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); renderStaff(); }, () => {}));
    keep(DB.collection('sorovlar').onSnapshot(s => { REQS = s.docs.map(d => ({ id: d.id, ...d.data() })); renderStaff(); }, () => {}));
  }
  if (ROLE !== 'tozalovchi') startClientData(keep);
}

/* ================= Namuna (demo) rejim: taxminiy raqamlar, faqat xotirada ================= */
let DEMO = false, REAL_DB = null;
function memDB(seed, onWrite) {
  const st = {}, subs = {}, col = c => st[c] || (st[c] = new Map());
  const dump = () => Object.fromEntries(Object.entries(st).map(([c, m]) => [c, Object.fromEntries(m)]));
  Object.entries(seed).forEach(([c, o]) => Object.entries(o).forEach(([id, d]) => col(c).set(id, d)));
  const snap = c => ({ metadata: { fromCache: false }, docs: [...col(c)].map(([id, d]) => ({ id, data: () => ({ ...d }) })) });
  const fire = c => { if (onWrite) onWrite(dump()); (subs[c] || []).forEach(cb => cb(snap(c))); };
  const sub = (c, cb) => { (subs[c] = subs[c] || []).push(cb); setTimeout(() => cb(snap(c)), 0); return () => { subs[c] = subs[c].filter(x => x !== cb); }; };
  const sp = p => { const i = p.indexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; };
  return {
    collection: c => ({ onSnapshot: cb => sub(c, cb), add: async o => { const id = 'n' + Math.random().toString(36).slice(2, 10); col(c).set(id, { ...o }); fire(c); return { id }; } }),
    doc: p => { const [c, id] = sp(p); return {
      get: async () => ({ exists: col(c).has(id), data: () => col(c).get(id) }),
      set: async o => { col(c).set(id, { ...o }); fire(c); },
      update: async o => { col(c).set(id, { ...(col(c).get(id) || {}), ...o }); fire(c); },
      delete: async () => { col(c).delete(id); fire(c); },
      onSnapshot: cb => sub(c, () => cb({ exists: col(c).has(id), data: () => col(c).get(id) })) }; }
  };
}
function demoSeed() {
  let x = 20261107; const rnd = () => (x = (x * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const tot = BASE.reduce((a, r) => a + r.n, 0);
  const wpick = () => { let u = rnd() * tot; for (const r of BASE) { u -= r.n; if (u <= 0) return r; } return BASE[0]; };
  const NM_ = {
    uz: [['Aziz', 'Bekzod', 'Jasur', 'Sardor', 'Otabek', 'Ulug\'bek', 'Shohruh', 'Doniyor', 'Akmal', 'Rustam', 'Sherzod', 'Bobur', 'Farrux', 'Islom', 'Javohir'],
         ['Dilnoza', 'Malika', 'Nigora', 'Shahnoza', 'Gulnora', 'Madina', 'Sevara', 'Kamola', 'Zarina', 'Mohira', 'Feruza', 'Nodira', 'Laylo', 'Munisa', 'Sabina'],
         ['Karimov', 'Rahimov', 'Toshmatov', 'Yusupov', 'Aliyev', 'Ergashev', 'Nazarov', 'Saidov', 'Qodirov', 'Mirzayev', 'Xolmatov', 'Sobirov']],
    ru: [['Ivan', 'Dmitriy', 'Sergey', 'Aleksey', 'Nikolay', 'Pavel'], ['Anna', 'Olga', 'Yelena', 'Mariya', 'Tatyana', 'Irina'], ['Ivanov', 'Smirnov', 'Petrov', 'Kuznetsov', 'Volkov', 'Sokolov']],
    as: [['Wei', 'Min-jun', 'Hiroshi', 'Arjun', 'Ahmet', 'Ali', 'Reza', 'Omar'], ['Li Na', 'Ji-woo', 'Yuki', 'Priya', 'Elif', 'Aisha', 'Maryam', 'Fatima'], ['Wang', 'Kim', 'Tanaka', 'Sharma', 'Yilmaz', 'Hassan', 'Karimi', 'Khan']],
    en: [['John', 'Michael', 'David', 'Thomas', 'Lukas', 'Pierre'], ['Emily', 'Sarah', 'Anna', 'Sophie', 'Laura', 'Claire'], ['Smith', 'Johnson', 'Brown', 'Muller', 'Martin', 'Wilson']]
  };
  const CA = [UZ, "Qozog'iston", "Qirg'iziston", 'Tojikiston', 'Turkmaniston', 'Ozarbayjon'];
  const pool = d => CA.includes(d) ? NM_.uz : d === 'Rossiya' || d === 'Gruziya' ? NM_.ru : ['AQSh', 'Germaniya', 'Fransiya'].includes(d) ? NM_.en : NM_.as;
  const td = today(), hhmm = () => `${String(7 + Math.floor(rnd() * 11)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`;
  const mk = (holat, sana, ketish, xona) => {
    const r = wpick(), jinsi = rnd() < 0.5 ? 'erkak' : 'ayol', p = pool(r.d), yosh = rnd() < 0.15 ? 3 + Math.floor(rnd() * 13) : 17 + Math.floor(rnd() * 50);
    const kanal = pick(K), g = { ism: `${pick(p[jinsi === 'erkak' ? 0 : 1])} ${pick(p[2])}`, davlat: r.d, hudud: r.v, sana, ketish, jinsi, yosh,
      oila: yosh < 16 ? 'voyaga yetmagan' : rnd() < 0.6 ? 'turmush qurgan' : 'turmush qurmagan', kanal, holat, xona: xona || '', createdAt: `${sana}T${hhmm()}:00.000Z` };
    if (kanal === REC) g.tavsiya = pick(T);
    if (holat === 'oromgohda') g.keldiAt = g.createdAt;
    return g;
  };
  const rooms = ROOMS.slice().sort(() => rnd() - 0.5);
  const N_IN = 624, N_OUT = 41, N_ARR = 38, N_BRON = 57, N_DIRTY = 73;
  const mehmonlar = {}; let i = 0;
  for (let k = 0; k < N_IN; k++) { const out = k < N_OUT; const st = addDays(td, -(1 + Math.floor(rnd() * 6)));
    mehmonlar['demo' + (i++)] = mk('oromgohda', st, out ? td : addDays(td, 1 + Math.floor(rnd() * 6)), rooms[k]); }
  for (let k = 0; k < N_ARR; k++) mehmonlar['demo' + (i++)] = mk('bron', td, addDays(td, 2 + Math.floor(rnd() * 5)));
  for (let k = 0; k < N_BRON; k++) { const st = addDays(td, 1 + Math.floor(rnd() * 20)); mehmonlar['demo' + (i++)] = mk('bron', st, addDays(st, 2 + Math.floor(rnd() * 5))); }
  for (let k = 0; k < 160; k++) { const st = addDays(td, -(8 + Math.floor(rnd() * 60))); mehmonlar['demo' + (i++)] = mk('ketgan', st, addDays(st, 2 + Math.floor(rnd() * 5))); }
  const xonalar = {}; rooms.slice(N_IN, N_IN + N_DIRTY).forEach(r => xonalar[r] = { toza: false, at: `${td}T${hhmm()}:00.000Z`, by: 'demo' });
  const xodimlar = {}, S = [['Aziza Karimova', 'aziza', 'qabulxona'], ['Bekzod Rahimov', 'bekzod', 'qabulxona'], ['Madina Yusupova', 'madina', 'qabulxona'], ['Sardor Aliyev', 'sardor', 'qabulxona'],
    ['Nodira Saidova', 'nodira', 'qabulxona'], ['Gulnora Ergasheva', 'gulnora', 'tozalovchi'], ['Feruza Nazarova', 'feruza', 'tozalovchi'], ['Laylo Qodirova', 'laylo', 'tozalovchi'],
    ['Rustam Sobirov', 'rustam', 'tozalovchi'], ['Munisa Xolmatova', 'munisa', 'tozalovchi'], ['Kamola Mirzayeva', 'kamola', 'tozalovchi'], ['Akmal Toshmatov', 'akmal', 'qabulxona']];
  S.forEach(([ism, login, rol], k) => xodimlar['ds' + k] = { ism, login, rol, holat: k === 11 ? "o'chirilgan" : 'faol', approvedAt: `${addDays(td, -30 - k * 9)}T09:00:00.000Z` });
  const sorovlar = { dq1: { ism: 'Otabek Nazarov', login: 'otabek', rol: 'qabulxona', turi: 'royxat', holat: 'kutilmoqda', at: `${td}T09:12:00.000Z` },
    dq2: { ism: 'Sevara Yusupova', login: 'sevara', rol: 'tozalovchi', turi: 'royxat', holat: 'kutilmoqda', at: `${td}T10:47:00.000Z` },
    ds6: { ism: 'Feruza Nazarova', login: 'feruza', rol: 'tozalovchi', turi: 'parol', holat: 'kutilmoqda', at: `${td}T11:30:00.000Z` } };
  const dm = demoGuests(rnd, pick, NM_);
  return { mehmonlar, xonalar, xodimlar, sorovlar, mijozlar: dm.mijozlar, hamyon: dm.hamyon, katalog: { sozlama: JSON.parse(JSON.stringify(KAT.sozlama || DEF_SOZ)), aksiyalar: { list: JSON.parse(JSON.stringify(KAT.aksiyalar)) }, menyu: { list: JSON.parse(JSON.stringify(KAT.menyu)) }, qulayliklar: { list: JSON.parse(JSON.stringify(KAT.qulayliklar)) } }, data: PIN ? { [`users/${UID}/kirish`]: PIN } : {} };
}
function setDemo(on) {
  if (on === DEMO) return;
  stopData(); DEMO = on;
  if (on) { REAL_DB = DB; DB = memDB(demoSeed()); } else { DB = REAL_DB; GUESTS = []; ROOMS_DB = {}; STAFF = {}; REQS = []; CLIENTS = {}; WALLETS = {}; }
  KDIRTY = {};
  $('demo-bar').hidden = !on; $('demo-btn').textContent = t(on ? 'demo_off' : 'demo_on'); $('demo-btn').classList.toggle('on', on);
  ROOMSEL = null; PICK = null; startData(); renderOps();
}
$('demo-btn').onclick = () => setDemo(!DEMO);
$('demo-off').onclick = () => setDemo(false);

/* xodimning o'z holatini jonli kuzatish (tasdiqlash, PIN tiklash, o'chirish) */
function watchSelf() {
  let mine = null, req = null;
  const decide = () => {
    if (ROLE === 'menejer') return;
    if (mine && mine.holat === 'faol') {
      const roleChanged = ROLE && ROLE !== mine.rol; ME = mine; ROLE = mine.rol;
      if (mine.parolReset && (!PIN || String(mine.parolReset) > String(PIN.at))) { if (GSTATE !== 'setcred') { UNLOCKED = false; GSTATE = 'setcred'; renderGate(); } return; }
      if (UNLOCKED) { if (roleChanged) unlock(); return; }
      if (req && req.holat === 'kutilmoqda' && req.turi === 'parol') { PENDTYPE = 'parol'; GSTATE = 'pending'; return renderGate(); }
      if (!PIN) { GSTATE = 'setcred'; return renderGate(); }
      let rem = null; try { rem = sessionStorage.getItem('kt_unlock'); } catch (e) {}
      if (rem === UID) return unlock();
      LVL = ROLE; GSTATE = 'login'; return renderGate();
    }
    UNLOCKED = false;
    if (mine && mine.holat !== 'faol') { GSTATE = 'removed'; return renderGate(); }
    if (req && req.holat === 'kutilmoqda') { PENDTYPE = req.turi || 'royxat'; GSTATE = 'pending'; return renderGate(); }
    if (req && req.holat === 'rad etildi') { GSTATE = 'rejected'; return renderGate(); }
    if (GSTATE !== 'register') { GSTATE = 'register'; renderGate(); }
  };
  let got = 0; const ready = () => { if (++got >= 2) decide(); };
  DB.doc('xodimlar/' + UID).onSnapshot(s => { mine = s.exists ? s.data() : null; got >= 2 ? decide() : ready(); }, () => { enterGuest(); });
  DB.doc('sorovlar/' + UID).onSnapshot(s => { req = s.exists ? s.data() : null; got >= 2 ? decide() : ready(); }, () => {});
}
async function initApp() {
  GSTATE = 'loading'; renderGate();
  const fail = () => { INIT_FAILED = true; if (GMODE) return enterGuest(); GSTATE = 'outside'; renderGate(); };
  let db = null, user = null;
  if (!window.claude || typeof window.claude.use !== 'function') { const lb = localBackend(); db = lb.db; user = lb.user; }   // claude.ai'dan tashqarida (GitHub Pages): brauzer xotirasi
  else try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) {}
  if (!db || !user) return fail();
  DB = db; USER = user;
  try { UID = await user.id(); } catch (e) {}
  if (!UID) return fail();
  let mgr = false, ed = false; try { mgr = !!(await user.isOwner()); ed = !!(await user.canEdit()); } catch (e) {}
  IS_OWNER = mgr; STAFF_OK = mgr || ed;
  if (GMODE || (!mgr && !ed)) return enterGuest();   // mehmonlar sayti: Contributor va past, yoki #mehmon
  try { const p = await DB.doc(`data/users/${UID}/kirish`).get(); PIN = p.exists ? p.data() : null; } catch (e) { PIN = null; }
  if (mgr) {
    IS_MGR = true; ROLE = (PIN && ['menejer', 'qabulxona', 'tozalovchi'].includes(PIN.rol)) ? PIN.rol : 'menejer'; ME = null;
    let rem = null; try { rem = sessionStorage.getItem('kt_unlock'); } catch (e) {}
    if (!PIN) { GSTATE = 'setcred'; return renderGate(); }
    if (rem === UID) return unlock();
    LVL = ROLE; GSTATE = 'login'; return renderGate();
  }
  watchSelf();
}

/* ================= Bo'limlar (tugmalar) ================= */
const VIEWS = [...document.querySelectorAll('.view')].map(v => v.dataset.view);
const NAVB = [...document.querySelectorAll('#sections button')];
const DEFAULT_VIEW = { menejer: 'qabulxona', qabulxona: 'qabulxona', tozalovchi: 'xonalar' };
const allowed = v => { const b = NAVB.find(x => x.dataset.go === v); return b && (b.dataset.roles || '').split(' ').includes(ROLE); };
function showView(v, scroll) {
  if (!UNLOCKED) return;
  if (!VIEWS.includes(v) || !allowed(v)) v = DEFAULT_VIEW[ROLE] || 'umumiy'; VIEW = v;
  document.querySelectorAll('.view').forEach(el => el.hidden = el.dataset.view !== v);
  NAVB.forEach(b => b.setAttribute('aria-current', b.dataset.go === v ? 'page' : 'false'));
  const ops = ['qabulxona', 'xonalar', 'xodimlar', 'mijozlar', 'xizmatlar'].includes(v), noF = ops || v === 'bashorat' || v === 'solishtir';
  $('filterbox').hidden = noF; $('nofilter').hidden = !(v === 'bashorat' || v === 'solishtir');
  $('controls').hidden = noF && !(v === 'bashorat' || v === 'solishtir');
  $('nofilter').textContent = v === 'solishtir' ? t('nofilter_cmp') : t('nofilter_bash');
  const nb = NAVB.find(b => b.dataset.go === v), vi = document.querySelector(`.view[data-view="${v}"] .view-intro`);
  $('pg-title').textContent = nb ? nb.querySelector('span').textContent : ''; $('pg-sub').textContent = vi ? vi.textContent : '';
  if (scroll) { const top = $('sections').getBoundingClientRect().top + window.scrollY - 8; if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' }); }
}
NAVB.forEach(b => b.addEventListener('click', () => { try { if (location.hash !== '#' + b.dataset.go) location.hash = b.dataset.go; else showView(b.dataset.go, true); } catch (e) { showView(b.dataset.go, true); } }));
window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (h === 'mehmon' || h.startsWith('g-')) return gRoute(h);
  if (GMODE) { if (h === 'xodim' || (VIEWS.includes(h) && STAFF_OK)) return leaveGuest(); return gRoute(h); }
  if (h === '' && !UNLOCKED) return gRoute(h);
  showView(h, true);
});
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render()); } catch (e) {}

/* ================= Ishga tushirish ================= */
applyStatic(); buildSearch(); buildCmpOptions(); buildPredForm(); buildAddForm(false);
render(); predictAll(); renderModelStatic();
