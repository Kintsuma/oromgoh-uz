/* ================= Mehmonlar sayti (mijoz kabineti) va xodimlar uchun mijozlar/xizmatlar ================= */
/* Birinchi sahifa — mehmonlar sayti. Xodimlar paneli faqat yashirin kirish orqali: #xodim havolasi
   yoki mehmonlar saytidagi "Oromgoh.uz" logotipini 5 marta tez bosish. Xodim panelida turgan bo'lsa (#qabulxona va h.k.), sahifa yangilanganda panel qoladi. */
const isStaffHash = h => h === 'xodim' || (!!h && h !== 'mehmon' && !!document.querySelector(`.view[data-view="${h}"]`));
let GMODE = !isStaffHash(location.hash.slice(1)), STAFF_OK = false, INIT_FAILED = false;
const DEF_SOZ = { narx: 450000, muddatOy: 12, darajalar: [{ nom: 'Bronza', min: 0, ch: 0 }, { nom: 'Kumush', min: 3, ch: 5 }, { nom: 'Oltin', min: 6, ch: 10 }, { nom: 'Platina', min: 10, ch: 15 }] };
let KAT = { sozlama: null, aksiyalar: [], menyu: [], qulayliklar: [] };
let CLIENTS = {}, WALLETS = {};
const MENU_TUR = ['nonushta', 'tushlik', 'kechki', 'ichimlik', 'shirinlik'];
const PAY_USUL = ['naqd', 'karta', 'otkazma'];

/* ---- hisob-kitob ---- */
const soz = () => { const s = KAT.sozlama || {}; return { narx: +s.narx > 0 ? +s.narx : DEF_SOZ.narx, muddatOy: +s.muddatOy > 0 ? +s.muddatOy : DEF_SOZ.muddatOy,
  darajalar: (Array.isArray(s.darajalar) && s.darajalar.length ? s.darajalar : DEF_SOZ.darajalar).map(d => ({ nom: String(d.nom || ''), min: +d.min || 0, ch: +d.ch || 0 })).sort((a, b) => a.min - b.min) }; };
function tierOf(visits) {
  const ds = soz().darajalar; let i = 0; ds.forEach((d, k) => { if (visits >= d.min) i = k; });
  return { ...ds[i], idx: i, next: ds[i + 1] || null, all: ds };
}
const addMonths = (s, m) => { const d = new Date(s + 'T12:00:00'); d.setMonth(d.getMonth() + m); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
function walletCalc(w) {
  w = w || {}; const s = soz(), tier = tierOf(+w.tashriflar || 0), balans = +w.balans || 0;
  const kunlik = Math.round(s.narx * (100 - tier.ch) / 100), muddat = w.muddat || '', td = today();
  const left = muddat ? daysBetween(td, muddat) : null, expired = !!muddat && left < 0;
  return { balans, kunlik, narx: s.narx, tier, kunlar: expired || !kunlik ? 0 : Math.floor(balans / kunlik), muddat, left, expired, soon: !!muddat && left >= 0 && left <= 30 };
}
const som = n => `${fmt(n || 0)} ${t('som')}`;

/* ---- katalog (aksiyalar, menyu, qulayliklar, sozlama) ---- */
function katFromSnap(s) {
  const o = { sozlama: null, aksiyalar: [], menyu: [], qulayliklar: [] };
  s.docs.forEach(d => { const v = d.data() || {}; if (d.id === 'sozlama') o.sozlama = v; else if (d.id in o) o[d.id] = Array.isArray(v.list) ? v.list : []; });
  return o;
}
function startClientData(keep) {
  keep(DB.collection('katalog').onSnapshot(s => { KAT = katFromSnap(s); renderClients(); renderKatalog(); }, () => {}));
  keep(DB.collection('mijozlar').onSnapshot(s => { CLIENTS = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); renderClients(); }, () => {}));
  keep(DB.collection('hamyon').onSnapshot(s => { WALLETS = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); renderClients(); }, () => {}));
}

/* ================= XODIMLAR TOMONI: Mijozlar ================= */
let CL_BUSY = false;
async function walletOp(uid, delta, izoh, visit) {
  const w = WALLETS[uid] || {}, s = soz(), nb = (+w.balans || 0) + delta;
  if (nb < 0) throw { code: 'low' };
  let muddat = w.muddat || '';
  if (delta > 0) { const m = addMonths(today(), s.muddatOy); if (!muddat || m > muddat) muddat = m; }
  const tarix = (Array.isArray(w.tarix) ? w.tarix : []).concat(delta ? [{ at: nowIso(), summa: delta, izoh: String(izoh || '').slice(0, 80) }] : []).slice(-60);
  await DB.doc('hamyon/' + uid).set({ balans: nb, muddat, tashriflar: (+w.tashriflar || 0) + (visit ? 1 : 0), tarix, at: nowIso() });
}
const clmsg = (cls, key, v) => { const el = $('cl-msg'); if (!el) return; el.className = 'formmsg ' + cls; el.textContent = key ? t(key, v) : ''; };
async function clAct(fn, okKey, v) {
  if (CL_BUSY) return; CL_BUSY = true; clmsg('', '');
  try { await fn(); if (okKey) clmsg('ok', okKey, v); }
  catch (e) { clmsg('err', e && e.code === 'low' ? 'cl_low' : e && e.code === 'invalid_argument' ? 'a_ro' : 'a_fail'); }
  finally { CL_BUSY = false; renderClients(); }
}
function renderClients() {
  if (!UNLOCKED || ROLE === 'tozalovchi' || !$('client-list')) return;
  const ids = Object.keys(CLIENTS), td = today();
  const pend = ids.filter(id => CLIENTS[id] && CLIENTS[id].sorov && +CLIENTS[id].sorov.summa > 0);
  const allPend = pend.length + reqItems('bronlar', b => b.holat === 'kutilmoqda').length + reqItems('buyurtmalar', o => o.holat === 'kutilmoqda').length + reqItems('xabarlar', m => !m.javob).length;
  $('tu-badge').hidden = !allPend; $('tu-badge').textContent = allPend;
  let jami = 0, soon = 0; ids.forEach(id => { const c = walletCalc(WALLETS[id]); jami += c.balans; if (c.soon) soon++; });
  $('cl-kpis').innerHTML = `
    <div class="kpi lead"><span class="lbl">${t('cl_k_acc')}</span><b>${fmt(ids.length)}</b><small>${t('cl_k_acc_s')}</small></div>
    <div class="kpi"><span class="lbl">${t('cl_k_sum')}</span><b>${fmt(jami)}</b><small>${t('som')}</small></div>
    <div class="kpi"><span class="lbl">${t('cl_k_req')}</span><b style="color:var(--r-iflos-t)">${fmt(allPend)}</b><small>${t('cl_k_req_s')}</small></div>
    <div class="kpi"><span class="lbl">${t('cl_k_soon')}</span><b>${fmt(soon)}</b><small>${t('cl_k_soon_s')}</small></div>
    <div class="kpi"><span class="lbl">${t('cl_k_price')}</span><b>${fmt(soz().narx)}</b><small>${t('cl_k_price_s')}</small></div>`;
  $('sub-topups').textContent = t('rq_count', { n: pend.length });
  $('topup-list').innerHTML = pend.length ? pend.map(id => { const c = CLIENTS[id], q = c.sorov;
    return `<div class="op"><div class="op-main"><b>${esc(c.ism || '—')}</b> <span>@${esc(c.login || '')}</span><b>${som(q.summa)}</b><span>${esc(t('pay_' + q.usul))} · ${esc(String(q.at || '').slice(0, 16).replace('T', ' '))}</span></div>
      <div class="op-act"><button type="button" class="btn sm ok" data-tu-ok="${id}">${t('tu_ok')}</button><button type="button" class="btn sm danger" data-tu-no="${id}">${t('rq_no')}</button></div></div>`; }).join('') : emptyBox('e_topup');
  $('topup-list').querySelectorAll('[data-tu-ok]').forEach(b => b.onclick = () => { const id = b.dataset.tuOk, q = CLIENTS[id].sorov;
    clAct(async () => { await walletOp(id, +q.summa, t('tx_topup') + ' · ' + t('pay_' + q.usul)); await DB.doc('mijozlar/' + id).update({ sorov: null, sorovHal: { holat: 'qabul', summa: +q.summa, at: nowIso() } }); }, 'cl_done_add', { s: som(q.summa), x: CLIENTS[id].ism }); });
  $('topup-list').querySelectorAll('[data-tu-no]').forEach(b => b.onclick = () => { const id = b.dataset.tuNo, q = CLIENTS[id].sorov;
    clAct(() => DB.doc('mijozlar/' + id).update({ sorov: null, sorovHal: { holat: 'rad', summa: +q.summa, at: nowIso() } })); });
  renderGuestReqs();
  const qq = ($('cl-q').value || '').trim().toLowerCase();
  const list = ids.filter(id => { const c = CLIENTS[id] || {}; return !qq || [c.ism, c.login, c.tel].some(x => String(x || '').toLowerCase().includes(qq)); })
    .sort((a, b) => String(CLIENTS[a].ism).localeCompare(String(CLIENTS[b].ism)));
  $('sub-clients').textContent = t('cl_count', { n: fmt(list.length) });
  $('client-list').innerHTML = list.length ? list.slice(0, 150).map(id => { const c = CLIENTS[id], w = walletCalc(WALLETS[id]);
    const exp = w.muddat ? (w.expired ? `<span class="pill st-ketgan">${t('w_expired_s')}</span>` : `<span>${t('cl_until', { d: w.muddat })}</span>`) : '';
    return `<div class="op cl"><div class="op-main"><b>${esc(c.ism || '—')}</b> <span>@${esc(c.login || '')}${c.tel ? ' · ' + esc(c.tel) : ''}</span>
        <span class="pill tier t${w.tier.idx}">${esc(w.tier.nom)} · ${w.tier.ch}%</span>
        <b class="cl-bal">${som(w.balans)}</b><span>≈ ${t('w_days_n', { n: fmt(w.kunlar) })}</span>${exp}<span>${t('cl_visits', { n: +((WALLETS[id] || {}).tashriflar) || 0 })}</span></div>
      <div class="op-act"><input class="cl-num" type="number" min="0" step="10000" placeholder="${esc(t('cl_amount'))}" data-amt="${id}" aria-label="${esc(t('cl_amount'))}"><input class="cl-iz" maxlength="60" placeholder="${esc(t('cl_note_ph'))}" data-iz="${id}" aria-label="${esc(t('cl_note_ph'))}">
        <button type="button" class="btn sm ok" data-add="${id}">${t('cl_add')}</button><button type="button" class="btn sm warn" data-sub="${id}">${t('cl_sub')}</button><button type="button" class="btn sm" data-visit="${id}">${t('cl_visit')}</button></div></div>`; }).join('')
    : emptyBox(ids.length ? 'e_filter' : 'e_clients');
  const el = $('client-list'), amt = id => Math.round(+(el.querySelector(`[data-amt="${id}"]`).value || 0)), iz = id => el.querySelector(`[data-iz="${id}"]`).value.trim();
  el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const id = b.dataset.add, a = amt(id); if (!(a > 0)) return clmsg('err', 'cl_amt_bad');
    clAct(() => walletOp(id, a, iz(id) || t('tx_topup')), 'cl_done_add', { s: som(a), x: CLIENTS[id].ism }); });
  el.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { const id = b.dataset.sub, a = amt(id); if (!(a > 0)) return clmsg('err', 'cl_amt_bad');
    clAct(() => walletOp(id, -a, iz(id) || t('tx_charge')), 'cl_done_sub', { s: som(a), x: CLIENTS[id].ism }); });
  el.querySelectorAll('[data-visit]').forEach(b => b.onclick = () => { const id = b.dataset.visit; clAct(() => walletOp(id, 0, '', true), 'cl_done_visit', { x: CLIENTS[id].ism }); });
}
$('cl-q').addEventListener('input', renderClients);

/* ---- mehmon so'rovlari: bron, ovqat buyurtmasi, xabar ---- */
const reqItems = (field, f) => Object.entries(CLIENTS).flatMap(([uid, c]) => arr((c || {})[field]).filter(f).map(x => ({ uid, c, x })));
async function patchItem(uid, field, id, patch) {
  const list = arr((CLIENTS[uid] || {})[field]).map(x => x.id === id ? { ...x, ...patch } : x);
  await DB.doc('mijozlar/' + uid).update({ [field]: list });
}
let PENDING_BRON = null;
function afterGuestAdded(g) { const pb = PENDING_BRON; PENDING_BRON = null; if (pb) patchItem(pb.uid, 'bronlar', pb.id, { holat: 'qabul', hal: nowIso(), xona: g.xona || '' }).catch(() => {}); }
function renderGuestReqs() {
  const brs = reqItems('bronlar', b => b.holat === 'kutilmoqda').sort((a, b) => String(a.x.kel).localeCompare(String(b.x.kel)));
  $('sub-gbron').textContent = t('rq_count', { n: brs.length });
  $('gbron-list').innerHTML = brs.length ? brs.map(({ uid, c, x }) => `<div class="op"><div class="op-main"><b>${esc(c.ism || '—')}</b> <span>${esc(c.tel || '')}</span><b>${esc(x.kel)} → ${esc(x.ket)}</b><span>${esc(x.tur)} · ${t('bron_ppl', { a: x.katta, c: x.bola })} · ≈ ${som(x.taxmin)}${x.izoh ? ' · ' + esc(x.izoh) : ''}</span></div>
    <div class="op-act"><button type="button" class="btn sm ok" data-gb-ok="${uid}|${x.id}">${t('gb_ok')}</button><button type="button" class="btn sm danger" data-gb-no="${uid}|${x.id}">${t('rq_no')}</button></div></div>`).join('') : emptyBox('e_gbron');
  const ords = reqItems('buyurtmalar', o => o.holat === 'kutilmoqda').sort((a, b) => String(a.x.at).localeCompare(String(b.x.at)));
  $('sub-gord').textContent = t('rq_count', { n: ords.length });
  $('gord-list').innerHTML = ords.length ? ords.map(({ uid, c, x }) => `<div class="op"><div class="op-main"><b>${esc(c.ism || '—')}</b> <span>${esc(x.joy || '')} · ${esc(String(x.at || '').slice(11, 16))}</span><span>${esc(arr(x.items).map(i => `${i.nom} × ${i.soni}`).join(', '))}</span><b>${som(x.jami)}</b></div>
    <div class="op-act"><button type="button" class="btn sm ok" data-go-ok="${uid}|${x.id}">${t('go_ok')}</button><button type="button" class="btn sm" data-go-cash="${uid}|${x.id}">${t('go_cash')}</button><button type="button" class="btn sm danger" data-go-no="${uid}|${x.id}">${t('rq_no')}</button></div></div>`).join('') : emptyBox('e_gord');
  const msgs = reqItems('xabarlar', m => !m.javob).sort((a, b) => String(a.x.at).localeCompare(String(b.x.at)));
  $('sub-gmsg').textContent = t('rq_count', { n: msgs.length });
  $('gmsg-list').innerHTML = msgs.length ? msgs.map(({ uid, c, x }) => `<div class="op"><div class="op-main"><b>${esc(c.ism || '—')}</b> <span>${esc(String(x.at || '').slice(0, 16).replace('T', ' '))}</span><span class="msgtxt">${esc(x.matn)}</span></div>
    <div class="op-act"><input class="cl-iz" maxlength="300" placeholder="${esc(t('gm_ph'))}" data-gm-in="${uid}|${x.id}" aria-label="${esc(t('gm_ph'))}"><button type="button" class="btn sm primary" data-gm="${uid}|${x.id}">${t('gm_send')}</button></div></div>`).join('') : emptyBox('e_gmsg');
  const sp = s => s.split('|'), V = document.querySelector('.view[data-view="mijozlar"]');
  V.querySelectorAll('[data-gb-ok]').forEach(b => b.onclick = () => { const [uid, id] = sp(b.dataset.gbOk), c = CLIENTS[uid], x = arr(c.bronlar).find(y => y.id === id); if (!x) return;
    PENDING_BRON = { uid, id }; openDrawer(); $('a-ism').value = c.ism || ''; $('a-holat').value = 'bron'; $('a-holat').dispatchEvent(new Event('change')); $('a-sana').value = x.kel; $('a-ketish').value = x.ket;
    fmsg('ok', 'gb_fill', { x: c.ism || '' }); });
  V.querySelectorAll('[data-gb-no]').forEach(b => b.onclick = () => { const [uid, id] = sp(b.dataset.gbNo); clAct(() => patchItem(uid, 'bronlar', id, { holat: 'rad', hal: nowIso() })); });
  V.querySelectorAll('[data-go-ok]').forEach(b => b.onclick = () => { const [uid, id] = sp(b.dataset.goOk), x = arr(CLIENTS[uid].buyurtmalar).find(y => y.id === id); if (!x) return;
    clAct(async () => { await walletOp(uid, -(+x.jami || 0), t('tx_order') + ': ' + arr(x.items).map(i => i.nom).join(', ')); await patchItem(uid, 'buyurtmalar', id, { holat: 'tayyor', hal: nowIso() }); }, 'cl_done_sub', { s: som(x.jami), x: CLIENTS[uid].ism }); });
  V.querySelectorAll('[data-go-cash]').forEach(b => b.onclick = () => { const [uid, id] = sp(b.dataset.goCash); clAct(() => patchItem(uid, 'buyurtmalar', id, { holat: 'tayyor', naqd: true, hal: nowIso() })); });
  V.querySelectorAll('[data-go-no]').forEach(b => b.onclick = () => { const [uid, id] = sp(b.dataset.goNo); clAct(() => patchItem(uid, 'buyurtmalar', id, { holat: 'rad', hal: nowIso() })); });
  V.querySelectorAll('[data-gm]').forEach(b => b.onclick = () => { const k = b.dataset.gm, [uid, id] = sp(k), v = V.querySelector(`[data-gm-in="${k}"]`).value.trim().slice(0, 300); if (!v) return clmsg('err', 'gm_empty');
    clAct(() => patchItem(uid, 'xabarlar', id, { javob: v, javobAt: nowIso() }), 'gm_done', { x: CLIENTS[uid].ism }); });
}

/* ================= XODIMLAR TOMONI: Xizmatlar (aksiyalar, menyu, qulayliklar, narx) ================= */
const KFIELDS = {
  aksiyalar: [['nom', 'text', 'kf_nom'], ['matn', 'text', 'kf_matn'], ['chegirma', 'number', 'kf_ch'], ['gacha', 'date', 'kf_gacha']],
  menyu: [['tur', 'tur', 'kf_tur'], ['nom', 'text', 'kf_nom'], ['tavsif', 'text', 'kf_tavsif'], ['narx', 'number', 'kf_narx']],
  qulayliklar: [['nom', 'text', 'kf_nom'], ['vaqt', 'text', 'kf_vaqt'], ['matn', 'text', 'kf_matn'], ['pullik', 'pullik', 'kf_pullik']],
  darajalar: [['nom', 'text', 'kf_nom'], ['min', 'number', 'kf_min'], ['ch', 'number', 'kf_ch']],
  turlar: [['nom', 'text', 'kf_nom'], ['k', 'number', 'kf_k'], ['matn', 'text', 'kf_matn']]
};
let KED = {}, KDIRTY = {};
const canEditKat = () => IS_OWNER && ROLE === 'menejer';
function kedSource(key) { if (key === 'darajalar') return soz().darajalar; if (key === 'turlar') return roomTypes(); if (key === 'sozlama') return { narx: soz().narx, muddatOy: soz().muddatOy }; return KAT[key] || []; }
function cellInput(key, i, f, v) {
  const [name, type, lbl] = f, a = `data-ked="${key}" data-i="${i}" data-f="${name}" aria-label="${esc(t(lbl))}"`;
  if (type === 'tur') return `<select ${a}>${MENU_TUR.map(x => `<option value="${x}" ${v === x ? 'selected' : ''}>${esc(t('mt_' + x))}</option>`).join('')}</select>`;
  if (type === 'pullik') return `<select ${a}><option value="0" ${!v ? 'selected' : ''}>${esc(t('q_free'))}</option><option value="1" ${v ? 'selected' : ''}>${esc(t('q_paid'))}</option></select>`;
  return `<input ${a} type="${type}" ${type === 'number' ? `min="0" step="${name === 'k' ? '0.1' : '1'}"` : 'maxlength="140"'} value="${esc(v ?? '')}">`;
}
function cellText(f, v) {
  const [, type] = f;
  if (type === 'tur') return esc(t('mt_' + v)); if (type === 'pullik') return esc(t(v ? 'q_paid' : 'q_free'));
  if (f[0] === 'narx') return som(v); if (f[0] === 'chegirma' || f[0] === 'ch') return (+v || 0) + '%'; if (f[0] === 'k') return '×' + dec(+v || 1, 1);
  return esc(v ?? '');
}
function listEditor(key) {
  const fs = KFIELDS[key], rows = KED[key], ed = canEditKat();
  const head = `<tr>${fs.map(f => `<th>${esc(t(f[2]))}</th>`).join('')}${ed ? '<th></th>' : ''}</tr>`;
  const body = rows.length ? rows.map((r, i) => `<tr>${fs.map(f => `<td>${ed ? cellInput(key, i, f, r[f[0]]) : cellText(f, r[f[0]])}</td>`).join('')}${ed ? `<td><button type="button" class="rowdel" data-kdel="${key}" data-i="${i}">${t('del')}</button></td>` : ''}</tr>`).join('')
    : `<tr><td colspan="${fs.length + 1}" class="empty">${t('e_kat')}</td></tr>`;
  return `<div class="tablebox"><table class="ktable">${'<thead>' + head + '</thead>'}<tbody>${body}</tbody></table></div>` +
    (ed ? `<div class="k-act"><button type="button" class="btn sm" data-kadd="${key}">${t('k_add')}</button><button type="button" class="btn sm primary" data-ksave="${key}">${t('k_save')}</button><span class="formmsg" id="kmsg-${key}"></span></div>` : '');
}
function renderKatalog(force) {
  if (!UNLOCKED || !$('ed-aksiyalar') || ROLE === 'tozalovchi') return;
  ['aksiyalar', 'menyu', 'qulayliklar', 'darajalar', 'turlar', 'sozlama'].forEach(k => { if (force || !KDIRTY[k]) KED[k] = JSON.parse(JSON.stringify(kedSource(k))); });
  const ed = canEditKat(), s = KED.sozlama;
  $('ed-sozlama').innerHTML = ed ? `<div class="filters">
      <label for="k-narx"><span>${t('k_narx')}</span><input id="k-narx" type="number" min="0" step="10000" value="${esc(s.narx)}" data-ked="sozlama" data-f="narx"></label>
      <label for="k-oy"><span>${t('k_oy')}</span><input id="k-oy" type="number" min="1" max="60" value="${esc(s.muddatOy)}" data-ked="sozlama" data-f="muddatOy"></label></div>
      <h3 class="k-h">${t('k_tiers')}</h3>${listEditor('darajalar')}<h3 class="k-h">${t('k_types')}</h3>${listEditor('turlar')}`
    : `<p>${t('k_narx')}: <b>${som(s.narx)}</b> · ${t('k_oy')}: <b>${s.muddatOy}</b></p><h3 class="k-h">${t('k_tiers')}</h3>${listEditor('darajalar')}<h3 class="k-h">${t('k_types')}</h3>${listEditor('turlar')}`;
  ['aksiyalar', 'menyu', 'qulayliklar'].forEach(k => $('ed-' + k).innerHTML = listEditor(k));
  $('k-ro').hidden = ed;
  const root = document.querySelector('.view[data-view="xizmatlar"]');
  root.querySelectorAll('[data-ked]').forEach(inp => inp.addEventListener('input', () => {
    const k = inp.dataset.ked, f = inp.dataset.f, v = inp.type === 'number' ? (inp.value === '' ? '' : +inp.value) : f === 'pullik' ? inp.value === '1' : inp.value;
    if (k === 'sozlama') KED.sozlama[f] = v; else KED[k][+inp.dataset.i][f] = v;
    KDIRTY[k] = true;
  }));
  root.querySelectorAll('select[data-ked]').forEach(sel => sel.addEventListener('change', () => sel.dispatchEvent(new Event('input'))));
  root.querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { const k = b.dataset.kdel; KED[k].splice(+b.dataset.i, 1); KDIRTY[k] = true; renderKatalog(); });
  root.querySelectorAll('[data-kadd]').forEach(b => b.onclick = () => { const k = b.dataset.kadd; const r = {}; KFIELDS[k].forEach(([n, ty]) => r[n] = ty === 'number' ? 0 : ty === 'tur' ? 'tushlik' : ty === 'pullik' ? false : ''); KED[k].push(r); KDIRTY[k] = true; renderKatalog(); });
  root.querySelectorAll('[data-ksave]').forEach(b => b.onclick = () => saveKat(b.dataset.ksave));
}
async function saveKat(key) {
  const m = $('kmsg-' + key), say = (c, k) => { if (m) { m.className = 'formmsg ' + c; m.textContent = t(k); } };
  const clean = (k) => KED[k].map(r => { const o = {}; KFIELDS[k].forEach(([n, ty]) => o[n] = ty === 'number' ? Math.max(0, n === 'k' ? Math.round((+r[n] || 0) * 100) / 100 : Math.round(+r[n] || 0)) : ty === 'pullik' ? !!r[n] : String(r[n] ?? '').trim().slice(0, 140)); return o; }).filter(r => r.nom);
  try {
    if (key === 'turlar') {
      const tr = clean('turlar').filter(r => r.k > 0); if (!tr.length) return say('err', 'k_need_tier');
      await DB.doc('katalog/sozlama').set({ ...soz(), ...(KAT.sozlama || {}), turlar: tr, at: nowIso() }); KDIRTY.turlar = false;
    } else if (key === 'darajalar') {
      const ds = clean('darajalar'); if (!ds.length) return say('err', 'k_need_tier');
      const n = +KED.sozlama.narx, oy = +KED.sozlama.muddatOy; if (!(n > 0) || !(oy >= 1)) return say('err', 'k_bad_num');
      await DB.doc('katalog/sozlama').set({ ...(KAT.sozlama || {}), narx: Math.round(n), muddatOy: Math.round(oy), darajalar: ds.map(d => ({ ...d, ch: Math.min(90, d.ch) })), at: nowIso() });
      KDIRTY.darajalar = KDIRTY.sozlama = false;
    } else { await DB.doc('katalog/' + key).set({ list: clean(key), at: nowIso() }); KDIRTY[key] = false; }
    renderKatalog(true); const m2 = $('kmsg-' + key); if (m2) { m2.className = 'formmsg ok'; m2.textContent = t('k_saved'); }
  } catch (e) { say('err', e && e.code === 'invalid_argument' ? 'a_ro' : 'a_fail'); }
}

/* ================= MEHMONLAR SAYTI ================= */
let GSTAGE = 'loading', GCRED = null, GPROF = null, GWAL = null, GTAB = 'bosh', GSTARTED = false, GFAILS = 0, GWAIT = 0, GTOPUP = false, GSUM = 500000;
const ggmsg = (key, v, cls = 'err') => { const el = $('gg-msg'); if (el) { el.className = 'formmsg ' + cls; el.textContent = key ? t(key, v) : ''; } };
function showGuestShell(on) {
  $('gsite').hidden = !on; document.querySelector('.topbar2').hidden = on; $('app').hidden = on;
  if (on) closeDrawer();
}
async function enterGuest() {
  GMODE = true; showGuestShell(true);
  if (!DB || !UID) { GSTAGE = INIT_FAILED ? 'outside' : 'loading'; return renderG(); }
  if (GSTARTED) return renderG();
  GSTARTED = true; GSTAGE = 'loading'; renderG();
  try { const c = await DB.doc(`data/users/${UID}/mehmon`).get(); GCRED = c.exists ? c.data() : null; } catch (e) { GCRED = null; }
  DB.collection('katalog').onSnapshot(s => { KAT = katFromSnap(s); if (GSTAGE === 'in') gRefresh(); }, () => {});
  DB.doc('mijozlar/' + UID).onSnapshot(s => { GPROF = s.exists ? s.data() : null; if (GSTAGE === 'in') gRefresh(); }, () => {});
  DB.doc('hamyon/' + UID).onSnapshot(s => { GWAL = s.exists ? s.data() : null; if (GSTAGE === 'in') gRefresh(); }, () => {});
  let rem = null; try { rem = sessionStorage.getItem('kt_g'); } catch (e) {}
  GSTAGE = GCRED ? (rem === UID ? 'in' : 'login') : 'register'; renderG();
}
function leaveGuest() {
  GMODE = false; showGuestShell(false);
  if (UNLOCKED) { showView(location.hash.slice(1), false); return; }
  GSTATE = 'loading'; renderGate(); initApp();
}
let TAPS = [];
$('g-logo').addEventListener('click', () => {
  const now = Date.now(); TAPS = TAPS.filter(x => now - x < 2500); TAPS.push(now);
  if (TAPS.length >= 5) { TAPS = []; try { if (location.hash === '#xodim') leaveGuest(); else location.hash = 'xodim'; } catch (x) { leaveGuest(); } }
});
$('to-guest').onclick = () => { try { location.hash = 'mehmon'; } catch (x) { enterGuest(); } };
$('g-out').onclick = () => { try { sessionStorage.removeItem('kt_g'); } catch (e) {} GTOPUP = false; GSTAGE = GCRED ? 'login' : 'register'; renderG(); window.scrollTo(0, 0); };

const gin = (id, key, type = 'text', ac = 'off', extra = '') => `<label for="${id}">${t(key)}${type === 'password'
  ? `<span class="pwbox"><input id="${id}" type="password" autocomplete="${ac}" ${extra}><button type="button" class="pweye" data-for="${id}" aria-label="${t('pw_show')}" title="${t('pw_show')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button></span>`
  : `<input id="${id}" type="${type}" autocomplete="${ac}" ${extra}>`}</label>`;
function wireGPw() {
  document.querySelectorAll('#gsite .pweye').forEach(b => b.onclick = () => { const i = $(b.dataset.for); const sh = i.type === 'password'; i.type = sh ? 'text' : 'password'; b.classList.toggle('on', sh); b.title = b.ariaLabel = t(sh ? 'pw_hide' : 'pw_show'); });
  const box = $('gg-chk'); if (!box) return;
  const upd = () => { const p = $('gg-pass').value, q = $('gg-pass2').value;
    const ok = { pw_len: p.length >= 8, pw_let: /[A-Za-zА-Яа-яЁё]/.test(p), pw_dig: /\d/.test(p), pw_same: !!p && p === q };
    box.querySelectorAll('li').forEach(li => { const k = li.dataset.k; li.classList.toggle('ok', ok[k]); li.classList.toggle('no', !ok[k] && (k === 'pw_same' ? !!q : !!p)); if (k === 'pw_len') li.textContent = t('pw_len') + (p ? ` (${p.length}/8)` : ''); }); };
  $('gg-pass').addEventListener('input', upd); $('gg-pass2').addEventListener('input', upd); upd();
}
const gAuthCard = (inner) => `<div class="g-auth"><div class="g-auth-hero"><b class="tb-brand">Oromgoh<span>.uz</span></b><p>${t('g_hero')}</p>
  <ul class="g-perks"><li>${t('g_perk1')}</li><li>${t('g_perk2')}</li><li>${t('g_perk3')}</li><li>${t('g_perk4')}</li></ul></div><div class="g-auth-card">${inner}</div></div>`;
function renderG() {
  const M = $('g-main'); $('g-out').hidden = GSTAGE !== 'in'; $('g-who').hidden = GSTAGE !== 'in';
  if (GSTAGE === 'loading') { M.innerHTML = `<div class="g-auth-card solo"><h2>${t('gt_loading')}</h2></div>`; return; }
  if (GSTAGE === 'outside') { M.innerHTML = `<div class="g-auth-card solo"><h2>${t('g_out_h')}</h2><p>${t('g_out_p')}</p></div>`; return; }
  if (GSTAGE === 'register' || GSTAGE === 'reset') {
    const reset = GSTAGE === 'reset', p = GPROF || {};
    M.innerHTML = gAuthCard(`<h2>${t(reset ? 'g_reset_h' : 'g_reg_h')}</h2><p class="g-sub">${t(reset ? 'g_reset_p' : 'g_reg_p')}</p>
      <form id="gg-form" class="gform" novalidate>
        ${gin('gg-ism', 'g_ism', 'text', 'name', `maxlength="60" value="${esc(p.ism || '')}"`)}${gin('gg-tel', 'g_tel', 'tel', 'tel', `maxlength="20" placeholder="+998 90 123 45 67" value="${esc(p.tel || '')}"`)}
        ${gin('gg-login', 'gt_login_new', 'text', 'username', `maxlength="20" autocapitalize="none" spellcheck="false" value="${esc((GCRED && GCRED.login) || p.login || '')}"`)}<span></span>
        ${gin('gg-pass', 'gt_pass_new', 'password', 'new-password')}${gin('gg-pass2', 'gt_pass_rep', 'password', 'new-password')}
        <ul class="pwchk" id="gg-chk" aria-live="polite">${['pw_len', 'pw_let', 'pw_dig', 'pw_same'].map(k => `<li data-k="${k}">${t(k)}</li>`).join('')}</ul>
        <button class="btn primary big-btn" type="submit">${t(reset ? 'g_reset_btn' : 'g_reg_btn')}</button><span class="formmsg" id="gg-msg" role="status"></span>
      </form>
      <p class="g-switch">${t(reset ? 'g_remember' : 'g_have')} <button type="button" class="linkbtn" id="gg-tologin">${t(reset ? 'g_back_login' : 'g_have_btn')}</button></p>`);
    wireGPw(); $('gg-tologin').onclick = () => { GSTAGE = 'login'; renderG(); };
    $('gg-form').addEventListener('submit', async e => {
      e.preventDefault();
      const ism = $('gg-ism').value.trim().slice(0, 60), tel = $('gg-tel').value.trim().slice(0, 20), login = normLogin($('gg-login').value), p1 = $('gg-pass').value, p2 = $('gg-pass2').value;
      if (!ism) return ggmsg('a_err_name'); if (!/^\+?[\d\s()-]{7,20}$/.test(tel)) return ggmsg('g_tel_bad');
      if (!loginOk(login)) return ggmsg('gt_login_bad'); if (!passOk(p1)) return ggmsg('gt_pass_bad'); if (p1 !== p2) return ggmsg('gt_pass_diff');
      const btn = $('gg-form').querySelector('button[type=submit]'); btn.disabled = true;
      try {
        const salt = hex(crypto.getRandomValues(new Uint8Array(16))), iter = 150000, hash = await passHash(p1, salt, iter);
        const cred = { login, salt, iter, hash, at: nowIso() };
        await DB.doc(`data/users/${UID}/mehmon`).set(cred); GCRED = cred;
        const prev = GPROF || {};
        await DB.doc('mijozlar/' + UID).set({ ism, tel, login, createdAt: prev.createdAt || nowIso(), sorov: prev.sorov || null, sorovHal: prev.sorovHal || null });
        try { sessionStorage.setItem('kt_g', UID); } catch (x) {}
        GSTAGE = 'in'; renderG(); window.scrollTo(0, 0);
      } catch (err) { btn.disabled = false; ggmsg(err && err.code === 'invalid_argument' ? 'g_no_write' : 'a_fail'); }
    });
    return;
  }
  if (GSTAGE === 'login') {
    M.innerHTML = gAuthCard(`<h2>${t('g_login_h')}</h2><p class="g-sub">${t('g_login_p')}</p>
      ${GCRED ? '' : `<p class="notice-s">${t('g_no_acc')}</p>`}
      <form id="gg-form" class="gform one" novalidate>
        ${gin('gg-login', 'gt_login', 'text', 'username', 'maxlength="20" autocapitalize="none" spellcheck="false"')}${gin('gg-pass', 'gt_pass', 'password', 'current-password')}
        <button class="btn primary big-btn" type="submit">${t('gt_enter')}</button><span class="formmsg" id="gg-msg" role="status"></span>
      </form>
      <p class="g-switch">${t('g_no_have')} <button type="button" class="linkbtn" id="gg-toreg">${t('g_no_have_btn')}</button>${GCRED ? ` · <button type="button" class="linkbtn" id="gg-forgot">${t('gt_forgot')}</button>` : ''}</p>`);
    wireGPw();
    $('gg-toreg').onclick = () => { GSTAGE = GCRED ? 'reset' : 'register'; renderG(); };
    if ($('gg-forgot')) $('gg-forgot').onclick = () => { GSTAGE = 'reset'; renderG(); };
    $('gg-form').addEventListener('submit', async e => {
      e.preventDefault(); const now = Date.now();
      if (now < GWAIT) return ggmsg('gt_wait', { s: Math.ceil((GWAIT - now) / 1000) });
      const login = normLogin($('gg-login').value), pass = $('gg-pass').value;
      if (!login || !pass) return ggmsg('gt_fill');
      if (!GCRED) return ggmsg('g_no_acc');
      const h = await passHash(pass, GCRED.salt, GCRED.iter || 150000);
      if (login === GCRED.login && h === GCRED.hash) { GFAILS = 0; try { sessionStorage.setItem('kt_g', UID); } catch (x) {} GSTAGE = 'in'; renderG(); window.scrollTo(0, 0); }
      else { GFAILS++; $('gg-pass').value = ''; if (GFAILS >= 5) { GWAIT = Date.now() + 30000; GFAILS = 0; ggmsg('gt_wait', { s: 30 }); } else ggmsg('gt_wrong', { n: 5 - GFAILS }); }
    });
    return;
  }
  renderPortal();
}

/* ---- yo'naltirish: #mehmon = bosh sahifa, #g-<bo'lim> = bo'lim (brauzerning "Orqaga" tugmasi ham ishlaydi) ---- */
const GSECS = ['hamyon', 'bron', 'taomnoma', 'aksiyalar', 'chegirmalar', 'qulayliklar', 'haqida', 'yordam', 'profil'];
const tabFromHash = h => { h = String(h || '').replace(/^#/, ''); const k = h.startsWith('g-') ? h.slice(2) : ''; return GSECS.includes(k) ? k : 'bosh'; };
GTAB = tabFromHash(location.hash);
function goTab(k) { GTOPUP = false; const h = k === 'bosh' ? 'mehmon' : 'g-' + k; try { if (location.hash === '#' + h) { GTAB = k; renderG(); } else location.hash = h; } catch (e) { GTAB = k; renderG(); } window.scrollTo(0, 0); }
function gRoute(h) { if (!GMODE) { GTAB = tabFromHash(h); return enterGuest(); } GTAB = tabFromHash(h); renderG(); window.scrollTo(0, 0); }
/* yozayotgan paytda sahifa qayta chizilmasin */
let GPENDING = false;
function gRefresh() {
  const a = document.activeElement;
  if (a && $('g-main').contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { GPENDING = true; return; }
  GPENDING = false; renderG();
}
setInterval(() => { if (GPENDING) gRefresh(); }, 1200);

const GICON = {
  hamyon: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>',
  bron: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3v3H8z"/>',
  taomnoma: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 13v8"/><path d="M17 3c-2 0-3 2.5-3 6s1 4 3 4v8"/>',
  aksiyalar: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  chegirmalar: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
  qulayliklar: '<path d="M2 18c2 0 2-1.5 4-1.5S8 18 10 18s2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0M8 9h8"/>',
  haqida: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="10" r="2.4"/>',
  yordam: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.5"/>',
  profil: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
  bosh: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'
};
const gic = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${GICON[k] || ''}</svg>`;
const GGROUPS = [['gg_money', ['hamyon']], ['gg_stay', ['bron', 'qulayliklar']], ['gg_food', ['taomnoma']], ['gg_perks', ['aksiyalar', 'chegirmalar']], ['gg_info', ['haqida', 'yordam', 'profil']]];
const GBOTTOM = ['bosh', 'hamyon', 'bron', 'taomnoma', 'profil'];
const uidN = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const arr = x => Array.isArray(x) ? x : [];
const ROOM_DEF = [{ nom: 'Standart', k: 1, matn: '2 kishilik, tog' + "'" + 'ga qaragan' }, { nom: 'Oilaviy', k: 1.3, matn: '4 kishilik, ikki xonali' }, { nom: 'Lyuks', k: 1.8, matn: 'suv ombori manzarasi, alohida ayvon' }];
const roomTypes = () => { const r = (KAT.sozlama || {}).turlar; return (Array.isArray(r) && r.length ? r : ROOM_DEF).map(x => ({ nom: String(x.nom || ''), k: +x.k > 0 ? +x.k : 1, matn: String(x.matn || '') })); };
const stPill = h => `<span class="pill gst-${h}">${t('gs_' + h)}</span>`;
async function profPatch(o) { await DB.doc('mijozlar/' + UID).update(o); }

/* ---- bildirishnomalar (ma'lumotdan hisoblanadi) ---- */
function gNotices(w) {
  const p = GPROF || {}, td = today(), out = [], recent = at => at && daysBetween(String(at).slice(0, 10), td) <= 5;
  if (p.sorov && +p.sorov.summa > 0) out.push(['wait', t('n_topup_wait', { s: som(p.sorov.summa) }), 'hamyon']);
  else if (p.sorovHal && recent(p.sorovHal.at)) out.push([p.sorovHal.holat === 'qabul' ? 'ok' : 'bad', t(p.sorovHal.holat === 'qabul' ? 'w_hal_ok' : 'w_hal_no', { s: som(p.sorovHal.summa) }), 'hamyon']);
  arr(p.bronlar).forEach(b => { if (b.holat === 'kutilmoqda') out.push(['wait', t('n_bron_wait', { d: b.kel }), 'bron']); else if (recent(b.hal)) out.push([b.holat === 'qabul' ? 'ok' : 'bad', t(b.holat === 'qabul' ? 'n_bron_ok' : 'n_bron_no', { d: b.kel }), 'bron']); });
  arr(p.buyurtmalar).forEach(o => { if (o.holat === 'kutilmoqda') out.push(['wait', t('n_ord_wait', { s: som(o.jami) }), 'taomnoma']); else if (recent(o.hal)) out.push([o.holat === 'rad' ? 'bad' : 'ok', t(o.holat === 'rad' ? 'n_ord_no' : 'n_ord_ok', { s: som(o.jami) }), 'taomnoma']); });
  arr(p.xabarlar).forEach(m => { if (m.javob && recent(m.javobAt)) out.push(['ok', t('n_msg_reply'), 'yordam']); });
  if (w.expired) out.push(['bad', t('w_expired', { d: w.muddat }), 'hamyon']); else if (w.soon) out.push(['wait', t('n_soon', { n: w.left }), 'hamyon']);
  if (w.balans > 0 && w.kunlar < 1 && !w.expired) out.push(['wait', t('n_low'), 'hamyon']);
  const promos = (KAT.aksiyalar || []).filter(a => !a.gacha || a.gacha >= td).length; if (promos) out.push(['info', t('n_promos', { n: promos }), 'aksiyalar']);
  return out;
}

/* ---- qidiruv ---- */
function gSearch(q) {
  q = q.trim().toLowerCase(); if (q.length < 2) return [];
  const has = (...xs) => xs.some(x => String(x || '').toLowerCase().includes(q)), r = [];
  ['bosh', ...GSECS].forEach(k => { if (k !== 'bosh' && has(t('gt_' + k), t('gd_' + k))) r.push([t('gt_' + k), t('gd_' + k), k]); });
  (KAT.menyu || []).forEach(i => { if (has(i.nom, i.tavsif)) r.push([i.nom, `${t('gt_taomnoma')} · ${som(i.narx)}`, 'taomnoma']); });
  (KAT.aksiyalar || []).forEach(a => { if (has(a.nom, a.matn)) r.push([a.nom, t('gt_aksiyalar'), 'aksiyalar']); });
  (KAT.qulayliklar || []).forEach(a => { if (has(a.nom, a.matn)) r.push([a.nom, t('gt_qulayliklar') + (a.vaqt ? ' · ' + a.vaqt : ''), 'qulayliklar']); });
  for (let i = 1; i <= 8; i++) if (has(t('faq_q' + i), t('faq_a' + i))) r.push([t('faq_q' + i), t('gt_yordam'), 'yordam']);
  return r.slice(0, 12);
}

function renderPortal() {
  const p = GPROF || {}, w = walletCalc(GWAL);
  const nmx = p.ism || (GCRED && GCRED.login) || '';
  $('g-who-n').textContent = nmx; $('g-who-av').textContent = nmx.split(/\s+/).map(x => x[0] || '').join('').slice(0, 2).toUpperCase() || '?';
  const nav = `<nav class="g-nav" aria-label="${esc(t('g_nav'))}">${GBOTTOM.map(k => `<button type="button" data-go-g="${k}" ${GTAB === k ? 'aria-current="page"' : ''}>${gic(k)}<span>${t('gn_' + k)}</span></button>`).join('')}</nav>`;
  let body;
  if (GTAB === 'bosh') body = gHome(w, nmx);
  else body = `<div class="g-crumb"><button type="button" class="g-back" data-go-g="bosh"><span aria-hidden="true">←</span> ${t('g_back')}</button><span class="g-path"><button type="button" class="linkbtn" data-go-g="bosh">${t('gt_bosh')}</button> / ${t('gt_' + GTAB)}</span></div>
    <header class="g-sech">${gic(GTAB)}<div><h1>${t('gt_' + GTAB)}</h1><p>${t('gd_' + GTAB)}</p></div></header>` + gSection(w);
  $('g-main').innerHTML = body + nav;
  const M = $('g-main');
  M.querySelectorAll('[data-go-g]').forEach(b => b.onclick = () => goTab(b.dataset.goG));
  wireSection(w);
}

function walletCard(w, compact) {
  const p = GPROF || {}, q = p.sorov && +p.sorov.summa > 0 ? p.sorov : null;
  const exp = !w.muddat ? `<span>${t('w_no_term')}</span>` : w.expired ? `<span class="w-warn">${t('w_expired', { d: w.muddat })}</span>`
    : `<span>${t('w_term', { d: w.muddat })} <em>${t('w_left', { n: fmt(w.left) })}</em></span>${w.soon ? `<span class="w-warn">${t('w_soon')}</span>` : ''}`;
  return `<section class="wallet ${compact ? 'compact' : ''}">
      <div class="w-top"><span class="w-lbl">${t('w_title')}</span><span class="w-lbl">${t('w_rate', { s: som(w.kunlik) })}${w.tier.ch ? ' · ' + t('w_rate_d', { c: w.tier.ch }) : ''}</span></div>
      <b class="w-bal">${fmt(w.balans)} <small>${t('som')}</small></b>
      <div class="w-grid"><div><span class="w-lbl">${t('w_days')}</span><b>${t('w_days_n', { n: fmt(w.kunlar) })}</b></div><div><span class="w-lbl">${t('w_term_l')}</span>${exp}</div></div>
      ${compact ? `<div class="w-acts"><button type="button" class="btn w-btn" data-go-g="hamyon">${t('w_open')}</button><button type="button" class="btn w-btn ghost" data-topup-go="1">${t('w_topup')}</button></div>`
        : q ? `<div class="w-pend">${t('w_pend', { s: som(q.summa), u: esc(t('pay_' + q.usul)) })} <button type="button" class="btn sm" id="tu-cancel">${t('w_pend_cancel')}</button></div>`
        : `<button type="button" class="btn w-btn" id="tu-open" aria-expanded="${GTOPUP}">${t('w_topup')}</button>${GTOPUP ? `<form class="w-form" id="tu-form" novalidate>
        <div class="w-amts">${[300000, 500000, 1000000, 2000000].map(a => `<button type="button" class="btn sm ${GSUM === a ? 'sel' : ''}" data-sum="${a}">${fmt(a)}</button>`).join('')}</div>
        <label for="tu-sum">${t('w_sum')}<input id="tu-sum" type="number" min="50000" step="50000" value="${GSUM}"></label>
        <label for="tu-usul">${t('w_usul')}<select id="tu-usul">${PAY_USUL.map(u => `<option value="${u}">${esc(t('pay_' + u))}</option>`).join('')}</select></label>
        <button type="submit" class="btn primary">${t('w_send')}</button><span class="formmsg" id="tu-msg" role="status"></span>
        <p class="w-note">${t('w_safe')}</p></form>` : ''}`}
    </section>`;
}

function gHome(w, nmx) {
  const ns = gNotices(w), td = today();
  const badge = k => { const p = GPROF || {};
    if (k === 'bron') { const n = arr(p.bronlar).filter(b => b.holat === 'kutilmoqda').length; return n ? `<b class="badge">${n}</b>` : ''; }
    if (k === 'taomnoma') { const n = cartCount(); return n ? `<b class="badge">${n}</b>` : ''; }
    if (k === 'aksiyalar') { const n = (KAT.aksiyalar || []).filter(a => !a.gacha || a.gacha >= td).length; return n ? `<b class="badge soft">${n}</b>` : ''; }
    if (k === 'yordam') { const n = arr(p.xabarlar).filter(m => m.javob && daysBetween(String(m.javobAt || '').slice(0, 10), td) <= 5).length; return n ? `<b class="badge">${n}</b>` : ''; }
    return ''; };
  return `<section class="g-hello"><h1>${t('g_hi', { x: esc(nmx.split(/\s+/)[0] || '') })}</h1><span class="pill tier t${w.tier.idx}">${t('g_tier_chip', { t: esc(w.tier.nom), c: w.tier.ch })}</span></section>
    ${walletCard(w, true)}
    <div class="g-search"><label for="g-sq" class="sr">${t('g_search')}</label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="g-sq" type="search" placeholder="${esc(t('g_search_ph'))}" autocomplete="off"><div class="g-sres" id="g-sres"></div></div>
    ${ns.length ? `<section class="g-notes"><h2>${t('g_notes')}</h2>${ns.slice(0, 5).map(([c, txt, k]) => `<button type="button" class="g-note n-${c}" data-go-g="${k}"><span>${esc(txt)}</span><span aria-hidden="true">›</span></button>`).join('')}</section>` : ''}
    ${GGROUPS.map(([g, ks]) => `<section class="g-group"><h2>${t(g)}</h2><div class="g-tiles">${ks.map(k => `<button type="button" class="g-tile" data-go-g="${k}">${gic(k)}<span class="g-tt"><b>${t('gt_' + k)}</b><small>${t('gd_' + k)}</small></span>${badge(k)}</button>`).join('')}</div></section>`).join('')}`;
}

/* ---- savatcha ---- */
let GCART = {}, GPLACE = '';
const cartCount = () => Object.values(GCART).reduce((a, b) => a + b, 0);
const cartLines = () => (KAT.menyu || []).map((i, k) => ({ ...i, k, soni: GCART[k] || 0 })).filter(i => i.soni > 0);

function gSection(w) {
  const td = today(), ch = w.tier.ch, dp = n => Math.round(n * (100 - ch) / 100), p = GPROF || {};
  if (GTAB === 'hamyon') {
    const tx = arr((GWAL || {}).tarix).slice().reverse();
    return walletCard(w, false) + `<section class="g-body"><h2>${t('h_tx')}</h2>` + (tx.length ? `<div class="g-list">${tx.map(x => `<div class="g-row"><span>${esc(String(x.at || '').slice(0, 16).replace('T', ' '))}<br><small>${esc(x.izoh || '')}</small></span><b class="${x.summa >= 0 ? 'plus' : 'minus'}">${x.summa >= 0 ? '+' : '−'}${som(Math.abs(x.summa))}</b></div>`).join('')}</div>` : `<p class="empty">${t('e_tx')}</p>`)
      + `<p class="hint">${t('g_wallet_how', { m: soz().muddatOy })}</p></section>`;
  }
  if (GTAB === 'bron') {
    const types = roomTypes(), list = arr(p.bronlar).slice().reverse();
    return `<section class="g-card-l"><h2>${t('bron_new')}</h2><form id="br-form" class="gform" novalidate>
        <label for="br-kel">${t('bron_kel')}<input id="br-kel" type="date" min="${td}" value="${esc(GBR.kel || addDays(td, 7))}"></label>
        <label for="br-ket">${t('bron_ket')}<input id="br-ket" type="date" min="${addDays(td, 1)}" value="${esc(GBR.ket || addDays(td, 10))}"></label>
        <label for="br-katta">${t('bron_katta')}<input id="br-katta" type="number" min="1" max="10" value="${GBR.katta || 2}"></label>
        <label for="br-bola">${t('bron_bola')}<input id="br-bola" type="number" min="0" max="10" value="${GBR.bola ?? 0}"></label>
        <fieldset class="br-types"><legend>${t('bron_tur')}</legend>${types.map((r, i) => `<label class="br-type"><input type="radio" name="br-tur" value="${i}" ${(GBR.tur || 0) === i ? 'checked' : ''}><span><b>${esc(r.nom)}</b><small>${esc(r.matn)}</small><small>${t('bron_k', { s: som(Math.round(soz().narx * r.k)) })}</small></span></label>`).join('')}</fieldset>
        <label for="br-izoh" class="full">${t('bron_izoh')}<input id="br-izoh" maxlength="140" value="${esc(GBR.izoh || '')}" placeholder="${esc(t('bron_izoh_ph'))}"></label>
        <div class="br-est full" id="br-est"></div>
        <button type="submit" class="btn primary big-btn">${t('bron_send')}</button><span class="formmsg" id="br-msg" role="status"></span>
      </form><p class="hint">${t('bron_how')}</p></section>
      <section class="g-body"><h2>${t('bron_mine')}</h2>${list.length ? `<div class="g-list">${list.map(b => `<div class="g-row"><span><b>${esc(b.kel)} → ${esc(b.ket)}</b> ${stPill(b.holat)}<br><small>${esc(b.tur)} · ${t('bron_ppl', { a: b.katta, c: b.bola })} · ≈ ${som(b.taxmin)}${b.xona ? ' · ' + t('g_room', { x: esc(b.xona) }) : ''}</small></span>${b.holat === 'kutilmoqda' ? `<button type="button" class="btn sm" data-br-cancel="${b.id}">${t('w_pend_cancel')}</button>` : ''}</div>`).join('')}</div>` : `<p class="empty">${t('e_bron')}</p>`}</section>`;
  }
  if (GTAB === 'taomnoma') {
    const items = KAT.menyu || [], lines = cartLines(), jami = lines.reduce((a, i) => a + dp(+i.narx || 0) * i.soni, 0);
    const orders = arr(p.buyurtmalar).slice().reverse();
    const menu = !items.length ? `<p class="empty">${t('e_menu')}</p>` : (ch ? `<p class="hint">${t('menu_disc', { c: ch, t: esc(w.tier.nom) })}</p>` : '') + MENU_TUR.filter(k => items.some(i => i.tur === k)).map(k => `<h3 class="menu-h">${t('mt_' + k)}</h3><div class="g-list">${items.map((i, idx) => [i, idx]).filter(([i]) => i.tur === k).map(([i, idx]) =>
      `<div class="g-row"><span><b>${esc(i.nom)}</b>${i.tavsif ? `<br><small>${esc(i.tavsif)}</small>` : ''}<br><span class="price">${ch ? `<s>${som(i.narx)}</s> ` : ''}<b>${som(dp(+i.narx || 0))}</b></span></span>
       <span class="qty">${GCART[idx] ? `<button type="button" class="btn sm" data-dec="${idx}" aria-label="−1">−</button><b>${GCART[idx]}</b>` : ''}<button type="button" class="btn sm ${GCART[idx] ? '' : 'primary'}" data-inc="${idx}" aria-label="+1">${GCART[idx] ? '+' : t('cart_add')}</button></span></div>`).join('')}</div>`).join('');
    const cart = lines.length ? `<section class="cart" id="cart"><h2>${t('cart_h')}</h2><div class="g-list">${lines.map(i => `<div class="g-row"><span>${esc(i.nom)} × ${i.soni}</span><b>${som(dp(+i.narx || 0) * i.soni)}</b></div>`).join('')}<div class="g-row tot"><span>${t('cart_total')}</span><b>${som(jami)}</b></div></div>
      <form id="ord-form" class="gform" novalidate><label for="ord-joy">${t('cart_place')}<input id="ord-joy" maxlength="40" value="${esc(GPLACE)}" placeholder="${esc(t('cart_place_ph'))}"></label>
      <span class="hint cart-w">${jami > w.balans ? t('cart_low', { s: som(w.balans) }) : t('cart_ok', { s: som(w.balans - jami) })}</span>
      <button type="submit" class="btn primary big-btn" ${jami > w.balans ? 'disabled' : ''}>${t('cart_send')}</button><button type="button" class="btn" id="cart-clear">${t('cart_clear')}</button><span class="formmsg" id="ord-msg" role="status"></span></form></section>` : '';
    const cbar = lines.length ? `<a class="cart-bar" href="#cart" id="cart-jump"><span>${t('cart_bar', { n: cartCount() })}</span><b>${som(jami)}</b></a>` : '';
    return `<section class="g-body">${menu}</section>${cart}${cbar}
      <section class="g-body"><h2>${t('ord_mine')}</h2>${orders.length ? `<div class="g-list">${orders.map(o => `<div class="g-row"><span>${esc(String(o.at || '').slice(0, 16).replace('T', ' '))} ${stPill(o.holat)}<br><small>${esc(o.items.map(i => `${i.nom} × ${i.soni}`).join(', '))}${o.joy ? ' · ' + esc(o.joy) : ''}</small></span><b>${som(o.jami)}</b></div>`).join('')}</div>` : `<p class="empty">${t('e_ord')}</p>`}</section>`;
  }
  if (GTAB === 'aksiyalar') {
    const act = (KAT.aksiyalar || []).filter(a => !a.gacha || a.gacha >= td);
    return act.length ? `<div class="g-cards">${act.map(a => `<article class="g-card promo">${+a.chegirma ? `<span class="promo-b">−${+a.chegirma}%</span>` : ''}<h3>${esc(a.nom)}</h3><p>${esc(a.matn || '')}</p>${a.gacha ? `<small>${t('promo_until', { d: a.gacha })}</small>` : ''}<button type="button" class="btn sm" data-go-g="bron">${t('promo_book')}</button></article>`).join('')}</div><p class="hint">${t('promo_how')}</p>` : `<p class="empty">${t('e_promo')}</p>`;
  }
  if (GTAB === 'chegirmalar') {
    const v = +((GWAL || {}).tashriflar) || 0, nx = w.tier.next;
    const pctv = nx ? Math.min(100, Math.round(100 * (v - w.tier.min) / Math.max(1, nx.min - w.tier.min))) : 100;
    return `<div class="loy"><p>${t('loy_now', { t: esc(w.tier.nom), c: w.tier.ch, v })}</p>
      <div class="bar" role="progressbar" aria-valuenow="${pctv}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pctv}%"></i></div>
      <p class="hint">${nx ? t('loy_next', { n: nx.min - v, t: esc(nx.nom), c: nx.ch }) : t('loy_top')}</p></div>
      <div class="tiers">${w.tier.all.map((d, i) => `<div class="tier-c t${i} ${i === w.tier.idx ? 'cur' : ''}"><b>${esc(d.nom)}</b><span class="big">${d.ch}%</span><small>${t('loy_from', { n: d.min })}</small></div>`).join('')}</div>
      <p class="hint">${t('loy_how')}</p>`;
  }
  if (GTAB === 'qulayliklar') {
    const q = KAT.qulayliklar || [];
    return q.length ? `<div class="g-cards">${q.map(a => `<article class="g-card"><h3>${esc(a.nom)}</h3><p>${esc(a.matn || '')}</p><small>${a.vaqt ? esc(a.vaqt) + ' · ' : ''}<span class="pill ${a.pullik ? 'st-bron' : 'st-oromgohda'}">${t(a.pullik ? 'q_paid' : 'q_free')}</span></small>${a.pullik ? `<button type="button" class="btn sm" data-ask="${esc(a.nom)}">${t('q_ask')}</button>` : ''}</article>`).join('')}</div>` : `<p class="empty">${t('e_amen')}</p>`;
  }
  if (GTAB === 'haqida') {
    const U = MAPS.uz;
    return `<div class="about-g"><section class="g-card-l"><p>${t('ab_text')}</p>
        <dl class="facts"><div><dt>${t('ab_addr_l')}</dt><dd>${t('ab_addr')}</dd></div><div><dt>${t('ab_in_l')}</dt><dd>14:00</dd></div><div><dt>${t('ab_out_l')}</dt><dd>12:00</dd></div><div><dt>${t('ab_rooms_l')}</dt><dd>${t('ab_rooms')}</dd></div><div><dt>${t('ab_rec_l')}</dt><dd>${t('ab_rec')}</dd></div></dl></section>
      <section class="g-card-l"><svg class="map gmap" viewBox="0 0 ${U.w} ${U.h}" role="img" aria-label="${esc(t('ab_map'))}">${U.nb.map(d => `<path class="nb" d="${d}"></path>`).join('')}${U.r.map(r => `<path class="c" d="${r.p}"></path>`).join('')}<g class="resort"><circle r="8" cx="${U.resort.x}" cy="${U.resort.y}"></circle><text x="${U.resort.x + 11}" y="${U.resort.y - 11}">Oromgoh.uz</text></g></svg><p class="hint">${t('ab_map')}</p></section></div>
      <section class="g-body"><h2>${t('ab_rules_h')}</h2><ul class="rules">${[1, 2, 3, 4, 5].map(i => `<li>${t('ab_rule' + i)}</li>`).join('')}</ul></section>`;
  }
  if (GTAB === 'yordam') {
    const msgs = arr(p.xabarlar).slice().reverse();
    return `<section class="g-body"><h2>${t('faq_h')}</h2><div class="faq">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<details><summary>${t('faq_q' + i)}</summary><p>${t('faq_a' + i)}</p></details>`).join('')}</div></section>
      <section class="g-card-l"><h2>${t('msg_h')}</h2><form id="msg-form" class="gform one" novalidate><label for="msg-txt">${t('msg_l')}<textarea id="msg-txt" rows="3" maxlength="500" placeholder="${esc(t('msg_ph'))}">${esc(GMSG)}</textarea></label>
        <button type="submit" class="btn primary">${t('msg_send')}</button><span class="formmsg" id="msg-msg" role="status"></span></form><p class="hint">${t('ab_rec_l')}: ${t('ab_rec')}</p></section>
      <section class="g-body"><h2>${t('msg_mine')}</h2>${msgs.length ? `<div class="g-list">${msgs.map(m => `<div class="g-row col"><span><small>${esc(String(m.at || '').slice(0, 16).replace('T', ' '))}</small><br>${esc(m.matn)}</span>${m.javob ? `<span class="reply"><b>${t('msg_reply')}</b> ${esc(m.javob)}</span>` : `<small class="hint">${t('msg_wait')}</small>`}</div>`).join('')}</div>` : `<p class="empty">${t('e_msg')}</p>`}</section>`;
  }
  return `<form id="pf-form" class="gform" novalidate>
      ${gin('pf-ism', 'g_ism', 'text', 'name', `maxlength="60" value="${esc(p.ism || '')}"`)}${gin('pf-tel', 'g_tel', 'tel', 'tel', `maxlength="20" value="${esc(p.tel || '')}"`)}
      <button type="submit" class="btn primary">${t('k_save')}</button><span class="formmsg" id="pf-msg" role="status"></span></form>
    <dl class="facts"><div><dt>${t('gt_login')}</dt><dd>${esc((GCRED && GCRED.login) || '')}</dd></div><div><dt>${t('pf_tier')}</dt><dd>${esc(w.tier.nom)} · ${w.tier.ch}%</dd></div><div><dt>${t('pf_visits')}</dt><dd>${+((GWAL || {}).tashriflar) || 0}</dd></div><div><dt>${t('pf_since')}</dt><dd>${esc(String(p.createdAt || '').slice(0, 10))}</dd></div></dl>
    <div class="pf-acts"><button type="button" class="btn" id="pf-pass">${t('pf_pass')}</button><button type="button" class="btn danger" id="pf-out">${t('lock')}</button></div>`;
}
let GBR = {}, GMSG = '';
function brEstimate(w) {
  const r = roomTypes()[GBR.tur || 0] || roomTypes()[0], kel = GBR.kel, ket = GBR.ket, a = Math.max(1, +GBR.katta || 1), c = Math.max(0, +GBR.bola || 0);
  const n = kel && ket ? daysBetween(kel, ket) : 0;
  const sum = n > 0 ? Math.round(soz().narx * r.k * (a + c * 0.5) * n * (100 - w.tier.ch) / 100) : 0;
  return { r, n, a, c, sum };
}
function wireSection(w) {
  const M = $('g-main'), say = (id, cls, key, v) => { const m = $(id); if (m) { m.className = 'formmsg ' + cls; m.textContent = t(key, v); } };
  const wrErr = e => e && e.code === 'invalid_argument' ? 'g_no_write' : 'a_fail';
  M.querySelectorAll('[data-topup-go]').forEach(b => b.onclick = () => { goTab('hamyon'); GTOPUP = true; });
  if ($('tu-open')) $('tu-open').onclick = () => { GTOPUP = !GTOPUP; renderG(); };
  if ($('tu-cancel')) $('tu-cancel').onclick = async () => { try { await profPatch({ sorov: null }); } catch (e) {} };
  M.querySelectorAll('[data-sum]').forEach(b => b.onclick = () => { GSUM = +b.dataset.sum; renderG(); });
  if ($('tu-sum')) $('tu-sum').oninput = () => { GSUM = Math.round(+$('tu-sum').value || 0); };
  if ($('tu-form')) $('tu-form').addEventListener('submit', async e => {
    e.preventDefault(); const s = Math.round(+$('tu-sum').value || 0);
    if (!(s >= 50000) || s > 100000000) return say('tu-msg', 'err', 'w_sum_bad');
    try { await profPatch({ sorov: { summa: s, usul: $('tu-usul').value, at: nowIso() } }); GTOPUP = false; renderG(); } catch (err) { say('tu-msg', 'err', wrErr(err)); }
  });
  /* qidiruv */
  if ($('g-sq')) $('g-sq').addEventListener('input', () => {
    const r = gSearch($('g-sq').value), box = $('g-sres');
    box.innerHTML = $('g-sq').value.trim().length < 2 ? '' : r.length ? r.map(([a, b, k]) => `<button type="button" data-go-g="${k}"><b>${esc(a)}</b><small>${esc(b)}</small></button>`).join('') : `<p class="empty">${t('g_search_none')}</p>`;
    box.querySelectorAll('[data-go-g]').forEach(b => b.onclick = () => goTab(b.dataset.goG));
  });
  /* bron */
  if ($('br-form')) {
    const read = () => { GBR = { kel: $('br-kel').value, ket: $('br-ket').value, katta: +$('br-katta').value, bola: +$('br-bola').value, tur: +((M.querySelector('[name=br-tur]:checked') || {}).value || 0), izoh: $('br-izoh').value }; };
    const est = () => { read(); const e = brEstimate(w); $('br-est').innerHTML = e.n > 0 ? `<span>${t('bron_est', { n: e.n, t: esc(e.r.nom), a: e.a, c: e.c })}${w.tier.ch ? ' · ' + t('w_rate_d', { c: w.tier.ch }) : ''}</span><b>≈ ${som(e.sum)}</b><small>${e.sum <= w.balans ? t('bron_cov') : t('bron_nocov', { s: som(e.sum - w.balans) })}</small>` : `<span>${t('bron_dates')}</span>`; };
    $('br-form').addEventListener('input', est); est();
    $('br-form').addEventListener('submit', async e => {
      e.preventDefault(); read(); const x = brEstimate(w), td = today();
      if (!GBR.kel || GBR.kel < td) return say('br-msg', 'err', 'bron_bad_kel');
      if (!(x.n > 0) || x.n > 60) return say('br-msg', 'err', 'bron_bad_ket');
      if (!(x.a >= 1 && x.a <= 10) || x.c > 10) return say('br-msg', 'err', 'bron_bad_ppl');
      const b = { id: uidN(), kel: GBR.kel, ket: GBR.ket, katta: x.a, bola: x.c, tur: x.r.nom, izoh: String(GBR.izoh || '').slice(0, 140), taxmin: x.sum, holat: 'kutilmoqda', at: nowIso() };
      try { await profPatch({ bronlar: arr((GPROF || {}).bronlar).concat([b]).slice(-20) }); GBR = {}; say('br-msg', 'ok', 'bron_sent'); renderG(); } catch (err) { say('br-msg', 'err', wrErr(err)); }
    });
  }
  M.querySelectorAll('[data-br-cancel]').forEach(b => b.onclick = async () => { try { await profPatch({ bronlar: arr(GPROF.bronlar).filter(x => x.id !== b.dataset.brCancel) }); } catch (e) {} });
  /* taomnoma */
  M.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { const k = +b.dataset.inc; GCART[k] = Math.min(20, (GCART[k] || 0) + 1); renderG(); });
  M.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const k = +b.dataset.dec; GCART[k] = Math.max(0, (GCART[k] || 0) - 1); if (!GCART[k]) delete GCART[k]; renderG(); });
  if ($('cart-clear')) $('cart-clear').onclick = () => { GCART = {}; renderG(); };
  if ($('cart-jump')) $('cart-jump').onclick = e => { e.preventDefault(); $('cart').scrollIntoView({ behavior: 'smooth' }); };
  if ($('ord-joy')) $('ord-joy').oninput = () => { GPLACE = $('ord-joy').value; };
  if ($('ord-form')) $('ord-form').addEventListener('submit', async e => {
    e.preventDefault(); const ch = w.tier.ch, lines = cartLines(); if (!lines.length) return;
    const items = lines.map(i => ({ nom: i.nom, soni: i.soni, narx: Math.round((+i.narx || 0) * (100 - ch) / 100) })), jami = items.reduce((a, i) => a + i.narx * i.soni, 0);
    if (jami > w.balans) return say('ord-msg', 'err', 'cart_low', { s: som(w.balans) });
    const joy = String(GPLACE || '').trim().slice(0, 40); if (!joy) return say('ord-msg', 'err', 'cart_need_place');
    try { await profPatch({ buyurtmalar: arr((GPROF || {}).buyurtmalar).concat([{ id: uidN(), items, jami, joy, holat: 'kutilmoqda', at: nowIso() }]).slice(-20) }); GCART = {}; renderG(); say('ord-msg', 'ok', 'cart_sent'); }
    catch (err) { say('ord-msg', 'err', wrErr(err)); }
  });
  /* qulayliklar -> yordamga savol */
  M.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { GMSG = t('q_ask_txt', { x: b.dataset.ask }); goTab('yordam'); });
  /* yordam */
  if ($('msg-txt')) $('msg-txt').oninput = () => { GMSG = $('msg-txt').value; };
  if ($('msg-form')) $('msg-form').addEventListener('submit', async e => {
    e.preventDefault(); const m = $('msg-txt').value.trim().slice(0, 500); if (m.length < 3) return say('msg-msg', 'err', 'msg_short');
    try { await profPatch({ xabarlar: arr((GPROF || {}).xabarlar).concat([{ id: uidN(), matn: m, at: nowIso() }]).slice(-20) }); GMSG = ''; renderG(); say('msg-msg', 'ok', 'msg_sent'); }
    catch (err) { say('msg-msg', 'err', wrErr(err)); }
  });
  /* profil */
  if ($('pf-form')) $('pf-form').addEventListener('submit', async e => {
    e.preventDefault(); const ism = $('pf-ism').value.trim().slice(0, 60), tel = $('pf-tel').value.trim().slice(0, 20);
    if (!ism) return say('pf-msg', 'err', 'a_err_name'); if (!/^\+?[\d\s()-]{7,20}$/.test(tel)) return say('pf-msg', 'err', 'g_tel_bad');
    try { await profPatch({ ism, tel }); say('pf-msg', 'ok', 'k_saved'); } catch (err) { say('pf-msg', 'err', 'a_fail'); }
  });
  if ($('pf-pass')) $('pf-pass').onclick = () => { GSTAGE = 'reset'; renderG(); window.scrollTo(0, 0); };
  if ($('pf-out')) $('pf-out').onclick = () => $('g-out').click();
}

/* ---- demo: namuna mijozlar ---- */
function demoGuests(rnd, pick, NM_) {
  const mijozlar = {}, hamyon = {}, td = today();
  const P = [['Aziz Karimov', 'aziz', 11, 2400000], ['Dilnoza Rahimova', 'dilnoza', 7, 1250000], ['Jasur Yusupov', 'jasur', 4, 600000], ['Malika Saidova', 'malika', 1, 0],
    ['Sardor Aliyev', 'sardor_a', 3, 950000], ['Nigora Ergasheva', 'nigora', 0, 300000], ['Wei Wang', 'weiwang', 2, 1800000], ['Anna Ivanova', 'anna', 6, 420000], ['Bobur Nazarov', 'bobur', 9, 3100000]];
  P.forEach(([ism, login, v, bal], i) => {
    const id = 'dm' + i, tel = `+998 9${Math.floor(rnd() * 10)} ${100 + Math.floor(rnd() * 900)} ${10 + Math.floor(rnd() * 90)} ${10 + Math.floor(rnd() * 90)}`;
    const b0 = i === 1 ? [{ id: 'db1', kel: addDays(td, 12), ket: addDays(td, 16), katta: 2, bola: 2, tur: 'Oilaviy', izoh: 'Bolalar uchun qo\'shimcha karavot', taxmin: 3159000, holat: 'kutilmoqda', at: `${td}T07:55:00.000Z` }] : i === 8 ? [{ id: 'db2', kel: addDays(td, 3), ket: addDays(td, 5), katta: 2, bola: 0, tur: 'Lyuks', izoh: '', taxmin: 1377000, holat: 'kutilmoqda', at: `${td}T09:20:00.000Z` }] : [];
    const o0 = i === 0 ? [{ id: 'do1', items: [{ nom: 'Choyxona palovi', soni: 2, narx: 72250 }, { nom: "Ko'k choy (choynak)", soni: 1, narx: 12750 }], jami: 157250, joy: 'B214 xona', holat: 'kutilmoqda', at: `${td}T12:10:00.000Z` }] : [];
    const x0 = i === 6 ? [{ id: 'dx1', matn: 'Is there an airport transfer tomorrow at 9 am?', at: `${td}T10:02:00.000Z` }] : [];
    mijozlar[id] = { bronlar: b0, buyurtmalar: o0, xabarlar: x0, ism, login, tel, createdAt: `${addDays(td, -400 + i * 30)}T10:00:00.000Z`, sorov: i === 2 ? { summa: 1000000, usul: 'karta', at: `${td}T08:40:00.000Z` } : i === 5 ? { summa: 500000, usul: 'naqd', at: `${td}T11:05:00.000Z` } : null };
    const muddat = i === 7 ? addDays(td, 12) : i === 3 ? addDays(td, -20) : addMonths(addDays(td, -Math.floor(rnd() * 200)), 12);
    hamyon[id] = { balans: bal, tashriflar: v, muddat, tarix: bal ? [{ at: `${addDays(td, -40)}T12:00:00.000Z`, summa: bal + 450000, izoh: 'Hisob to\'ldirildi' }, { at: `${addDays(td, -2)}T13:10:00.000Z`, summa: -450000, izoh: 'Turar joy, 1 kun' }] : [] };
  });
  return { mijozlar, hamyon };
}

/* ---- ishga tushirish ---- */
if (GMODE) showGuestShell(true);
initApp();
