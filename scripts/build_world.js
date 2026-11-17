// Dunyo davlatlari ro'yxati (nom, qit'a, mintaqa, mehmon soni) va har bir davlat hududlari (Natural Earth admin-1) xaritasi.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const d3 = require('d3-geo');
const I = require('i18n-iso-countries');
['uz', 'ru', 'en'].forEach(l => I.registerLocale(require(`i18n-iso-countries/langs/${l}.json`)));
const WC = require('world-countries');
const OUT = path.join(__dirname, 'out');
const ap = s => String(s || '').replace(/[‘’ʻʼ`]/g, "'");

// mavjud davlatlar (ma'lumotlarda shu nomlar bilan)
const OLD = { US: 'AQSh', UZ: "O'zbekiston", KZ: "Qozog'iston", CN: 'Xitoy', TR: 'Turkiya', TJ: 'Tojikiston', KG: "Qirg'iziston", RU: 'Rossiya',
  KR: 'Janubiy Koreya', IN: 'Hindiston', JP: 'Yaponiya', AE: 'BAA', AZ: 'Ozarbayjon', TM: 'Turkmaniston', IR: 'Eron', MY: 'Malayziya', ID: 'Indoneziya',
  SA: 'Saudiya Arabistoni', DE: 'Germaniya', PK: 'Pokiston', GE: 'Gruziya', MN: "Mo'g'uliston", FR: 'Fransiya', EG: 'Misr', AF: "Afg'oniston" };
const UZFIX = { CD: 'Kongo DR', CG: 'Kongo Respublikasi', MM: 'Myanma', SZ: 'Esvatini', CI: "Kot-d'Ivuar", VC: 'Sent-Vinsent va Grenadin', KN: 'Sent-Kits va Nevis',
  ST: 'San-Tome va Prinsipi', BA: 'Bosniya va Gertsegovina', TT: 'Trinidad va Tobago', AG: 'Antigua va Barbuda', PS: 'Falastin', VA: 'Vatikan', KP: 'Shimoliy Koreya',
  GB: 'Buyuk Britaniya', CZ: 'Chexiya', MK: 'Shimoliy Makedoniya', TL: 'Sharqiy Timor', FM: 'Mikroneziya', MH: 'Marshall orollari', SB: 'Solomon orollari' };
const ENFIX = { US: 'USA', AE: 'UAE', KR: 'South Korea', KP: 'North Korea', CD: 'DR Congo', CG: 'Republic of the Congo', GB: 'United Kingdom', CZ: 'Czechia', RU: 'Russia', TR: 'Turkey' };

// qit'a va mintaqa
function place(c) {
  const s = c.subregion, cc = c.cca2;
  const fixed = { RU: ['Yevropa', 'Sharqiy Yevropa'], TR: ['Osiyo', 'Yaqin Sharq'], IR: ['Osiyo', 'Yaqin Sharq'], AF: ['Osiyo', 'Janubiy Osiyo'], GE: ['Osiyo', 'Kavkaz'],
    AZ: ['Osiyo', 'Kavkaz'], AM: ['Osiyo', 'Kavkaz'], EG: ['Afrika', 'Shimoliy Afrika'], US: ['Shimoliy Amerika', 'Shimoliy Amerika'], CY: ['Yevropa', 'Janubiy Yevropa'],
    DE: ['Yevropa', "G'arbiy Yevropa"], FR: ['Yevropa', "G'arbiy Yevropa"], MN: ['Osiyo', 'Sharqiy Osiyo'] };
  if (fixed[cc]) return fixed[cc];
  const M = { 'Central Asia': ['Osiyo', 'Markaziy Osiyo'], 'Eastern Asia': ['Osiyo', 'Sharqiy Osiyo'], 'Southern Asia': ['Osiyo', 'Janubiy Osiyo'],
    'South-Eastern Asia': ['Osiyo', 'Janubi-Sharqiy Osiyo'], 'Western Asia': ['Osiyo', 'Yaqin Sharq'],
    'Eastern Europe': ['Yevropa', 'Sharqiy Yevropa'], 'Western Europe': ['Yevropa', "G'arbiy Yevropa"], 'Northern Europe': ['Yevropa', 'Shimoliy Yevropa'],
    'Southern Europe': ['Yevropa', 'Janubiy Yevropa'], 'Central Europe': ['Yevropa', 'Markaziy Yevropa'], 'Southeast Europe': ['Yevropa', 'Bolqon'],
    'Northern Africa': ['Afrika', 'Shimoliy Afrika'], 'Western Africa': ['Afrika', "G'arbiy Afrika"], 'Eastern Africa': ['Afrika', 'Sharqiy Afrika'],
    'Middle Africa': ['Afrika', 'Markaziy Afrika'], 'Southern Africa': ['Afrika', 'Janubiy Afrika'],
    'North America': ['Shimoliy Amerika', 'Shimoliy Amerika'], 'Central America': ['Shimoliy Amerika', 'Markaziy Amerika'], 'Caribbean': ['Shimoliy Amerika', 'Karib havzasi'],
    'South America': ['Janubiy Amerika', 'Janubiy Amerika'], 'Australia and New Zealand': ['Okeaniya', 'Avstraliya va Yangi Zelandiya'],
    'Melanesia': ['Okeaniya', 'Tinch okeani orollari'], 'Micronesia': ['Okeaniya', 'Tinch okeani orollari'], 'Polynesia': ['Okeaniya', 'Tinch okeani orollari'] };
  return M[s];
}
// taxminiy mehmon soni (yangi davlatlar uchun): mintaqa bazasi x hajm, ayrimlari qo'lda
const BASEW = { 'Sharqiy Yevropa': 900, 'Markaziy Yevropa': 420, "G'arbiy Yevropa": 420, 'Shimoliy Yevropa': 300, 'Janubiy Yevropa': 380, Bolqon: 200, 'Yaqin Sharq': 450,
  'Janubiy Osiyo': 450, 'Janubi-Sharqiy Osiyo': 380, 'Sharqiy Osiyo': 300, Kavkaz: 1200, 'Shimoliy Amerika': 900, 'Markaziy Amerika': 70, 'Karib havzasi': 35,
  'Janubiy Amerika': 140, 'Shimoliy Afrika': 300, "G'arbiy Afrika": 70, 'Sharqiy Afrika': 80, 'Markaziy Afrika': 45, 'Janubiy Afrika': 90,
  'Avstraliya va Yangi Zelandiya': 600, 'Tinch okeani orollari': 25, 'Markaziy Osiyo': 1000 };
const HAND = { UA: 3600, BY: 2300, AM: 1900, MD: 1000, LT: 650, LV: 620, EE: 520, GB: 2700, IT: 1900, ES: 1450, PL: 1300, CA: 1500, IL: 1600, KW: 950, QA: 850,
  OM: 650, BH: 400, JO: 500, IQ: 700, BD: 950, TH: 950, VN: 900, SG: 750, PH: 650, NL: 950, CH: 750, AT: 650, BE: 550, SE: 550, CZ: 650, AU: 950, NZ: 320, BR: 650,
  AR: 380, MX: 420, ZA: 520, NG: 380, KE: 260, ET: 220, MA: 450, DZ: 380, TN: 300, LB: 350, SY: 300, YE: 160, NP: 520, LK: 320, MV: 110, BT: 50, KP: 25, GR: 600,
  PT: 480, IE: 380, DK: 380, NO: 400, FI: 420, HU: 450, RO: 520, BG: 420, RS: 400, HR: 300, SK: 330, SI: 200, CY: 260, MT: 120, LU: 110, IS: 70, AD: 30, MC: 30,
  SM: 20, VA: 12, LI: 18, KH: 180, LA: 140, MM: 160, BN: 90, TL: 25, CL: 260, CO: 260, PE: 170, VE: 130, EC: 90, CU: 60, LY: 180, SD: 160 };

let seed = 20261117; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

// --- admin-1 ---
const A = JSON.parse(fs.readFileSync(path.join(__dirname, 'dl/adm1.geojson')));
const byC = {};
A.features.forEach((f, i) => { const p = f.properties; const k = p.adm0_a3; (byC[k] = byC[k] || []).push(i); });
const AQ = { SDS: 'SSD', KOS: 'XKX', PSX: 'PSE', SAH: 'ESH' };
Object.entries(AQ).forEach(([a, b]) => { if (byC[a]) byC[b] = (byC[b] || []).concat(byC[a]); });

// har bir hudud aholisi (taxminan): Natural Earth shaharlari pop_max yig'indisi
const PL = JSON.parse(fs.readFileSync(path.join(__dirname, 'dl/places.geojson'))).features;
const placesBy = {}; PL.forEach(f => { (placesBy[f.properties.adm0_a3] = placesBy[f.properties.adm0_a3] || []).push(f); });
function popOf(i, a3) { const f = A.features[i]; let s = 0; for (const pl of (placesBy[a3] || [])) if (d3.geoContains(f, pl.geometry.coordinates)) s += pl.properties.pop_max || 0; return s; }
const nm = (p, l) => ap(l === 'ru' ? (p.name_ru || p.name_en || p.name) : (p.name_en || p.name));
const COUNTRIES = [];
const countries = WC.filter(c => c.unMember || OLD[c.cca2]).filter(c => c.cca2 !== 'AQ');
const regionTable = [];   // [davlat uz, stat kaliti, ru, en] — xarita poligoni bo'yicha
const featProps = new Map();
// mavjud hududlar uchun ru/en nomlari (nomlar.json)
const NOM = JSON.parse(fs.readFileSync('/home/claude/sayt/nomlar.json'));
const data3 = JSON.parse(fs.readFileSync('/home/claude/sayt/data3.json'));
const oldHud = {}; data3.rows.forEach(r => { (oldHud[r[2]] = oldHud[r[2]] || new Set()).add(r[3]); });
const norm = s => ap(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(city|region|province|oblast|shahri|viloyati|state|governorate|prefecture|metropolitan|special|capital|territory|of|the)\b/g, '').replace(/[^a-zа-яё0-9]/g, '');
const lev = (a, b) => { const m = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; };
const tashA = A.features.filter(f => f.properties.adm0_a3 === 'UZB' && f.properties.name === 'Tashkent').map(f => f.properties.area_sqkm).sort((a, b) => a - b);
const XW = { "O'zbekiston|Toshkent shahri": p => p.name === 'Tashkent' && p.area_sqkm === tashA[0], "O'zbekiston|Toshkent viloyati": p => p.name === 'Tashkent' && p.area_sqkm === tashA[1],
  "O'zbekiston|Qoraqalpog'iston Respublikasi": p => p.name === 'Karakalpakstan', "Qozog'iston|Shymkent shahri": null, "Qozog'iston|Astana shahri": p => p.name === 'Astana',
  "Qozog'iston|Almati shahri": p => p.name === 'Almaty City', 'AQSh|Jorjiya': p => p.name === 'Georgia', 'Tojikiston|Respublika tobeligidagi tumanlar': p => p.name === 'Tadzhikistan Territories',
  "Tojikiston|Sug'd viloyati": p => p.name === 'Leninabad', 'Rossiya|Moskva': p => p.name === 'Moskva', 'Rossiya|Moskva viloyati': p => p.name === 'Moskovskaya',
  'Turkmaniston|Ashxobod shahri': null, 'Fransiya|Il-de-Frans': p => p.region === 'Île-de-France', 'Fransiya|Overn-Ron-Alp': p => p.region === 'Auvergne-Rhône-Alpes',
  "Fransiya|Provans-Alp-Kot-d'Azur": p => p.region === "Provence-Alpes-Côte-d'Azur" };
const audit = [];

for (const c of countries) {
  const uz = OLD[c.cca2] || UZFIX[c.cca2] || ap(I.getName(c.cca2, 'uz')) || c.name.common;
  const ru = (NOM[uz] && NOM[uz][0]) || I.getName(c.cca2, 'ru') || c.name.common;
  const en = (NOM[uz] && NOM[uz][1]) || ENFIX[c.cca2] || c.name.common;
  const [qita, mintaqa] = place(c);
  const feats = (byC[c.cca3] || []);
  const regs = feats.map(i => ({ i, p: A.features[i].properties }));
  let stat = [];
  if (OLD[c.cca2]) {
    // mavjud hududlarni xarita poligonlariga bog'lash
    for (const h of (oldHud[uz] || [])) {
      const nr = NOM[h] || [h, h], key = uz + '|' + h;
      if (key in XW) { if (XW[key]) { const hits = regs.filter(r => XW[key](r.p)); hits.forEach(r => featProps.set(r.i, [uz, h])); audit.push([uz, h, hits.map(r => r.p.name).join(','), hits.length ? 'qo\'lda' : '!!']); } else audit.push([uz, h, '-', 'yo\'q']); continue; }
      let best = null, bs = 1e9;
      for (const r of regs) {
        const p = r.p;
        const cands = [p.name, p.name_en, p.name_alt, p.gn_name, p.woe_name].filter(Boolean).flatMap(x => ap(x).split('|')).map(norm);
        const ru2 = norm(p.name_ru || '');
        const s = Math.min(...cands.map(x => lev(x, norm(nr[1])) / Math.max(4, x.length)), ru2 && norm(nr[0]) === ru2 ? 0 : 99, lev(ru2, norm(nr[0])) / Math.max(4, ru2.length || 4) + 0.05);
        if (s < bs) { bs = s; best = r; }
      }
      audit.push([uz, h, best ? best.p.name : '-', bs.toFixed(2)]);
      if (best && bs < 0.34 && !featProps.has(best.i)) featProps.set(best.i, [uz, h]);
    }
  } else {
    // yangi davlat: statistikaga kiradigan hududlar (poytaxt hududi ustun)
    const cap = c.capitalInfo && c.capitalInfo.latlng ? [c.capitalInfo.latlng[1], c.capitalInfo.latlng[0]] : null;
    const scored = regs.map(r => { const f = A.features[r.i]; const pop = popOf(r.i, c.cca3); let w = Math.sqrt(pop + 20000) * (0.8 + rnd() * 0.4); if (cap && d3.geoContains(f, cap)) w *= 1.6; return { ...r, w }; }).sort((a, b) => b.w - a.w);
    const target = Math.round((HAND[c.cca2] || BASEW[mintaqa] * Math.min(1.6, Math.max(0.5, Math.pow((c.area || 1e4) / 3e5, 0.25)))) * (0.85 + rnd() * 0.3));
    const K = Math.max(1, Math.min(6, Math.round(Math.log2(target / 40)), scored.length || 1));
    const used = new Set();
    stat = scored.slice(0, K).map(r => { let h = nm(r.p, 'en'); if (used.has(h) || regs.some(o => o.i !== r.i && nm(o.p, 'en') === h)) { const twin = regs.filter(o => nm(o.p, 'en') === h).map(o => d3.geoArea(A.features[o.i])); const isCity = twin.length > 1 ? d3.geoArea(A.features[r.i]) === Math.min(...twin) : /city|municip|capital|federal|metropol/i.test(r.p.type_en || ''); h = `${h} ${isCity ? 'shahri' : 'viloyati'}`; } let k = 2; const h0 = h; while (used.has(h)) h = `${h0} ${k++}`; used.add(h); featProps.set(r.i, [uz, h]); return { uz: h, ru: nm(r.p, 'ru'), en: h, w: +r.w.toFixed(1) }; });
    if (!stat.length) stat = [{ uz: en, ru, en, w: 1 }];
    COUNTRIES.push({ cca2: c.cca2, uz, ru, en, qita, mintaqa, n: target, regions: stat, til: c.languages ? Object.keys(c.languages)[0] : 'eng' });
  }
  c._uz = uz; c._ru = ru; c._en = en;
}
fs.writeFileSync(path.join(OUT, 'yangi_davlatlar.json'), JSON.stringify(COUNTRIES, null, 1));
fs.writeFileSync(path.join(OUT, 'audit.txt'), audit.map(a => a.join('\t')).join('\n'));

// --- admin-1 xaritasi: kerakli maydonlar, soddalashtirish ---
const keep = new Set(countries.map(c => c.cca3).concat(Object.keys(AQ)));
const uzOf = Object.fromEntries(countries.map(c => [c.cca3, c._uz])); Object.entries(AQ).forEach(([a, b]) => uzOf[a] = uzOf[b]);
const slim = { type: 'FeatureCollection', features: [] };
A.features.forEach((f, i) => { const p = f.properties; if (!keep.has(p.adm0_a3)) return; const st = featProps.get(i);
  slim.features.push({ type: 'Feature', geometry: f.geometry, properties: { d: uzOf[p.adm0_a3], h: st ? st[1] : '', e: nm(p, 'en'), r: nm(p, 'ru') } }); });
fs.writeFileSync(path.join(OUT, 'adm1_slim.geojson'), JSON.stringify(slim));
execSync(`npx mapshaper ${OUT}/adm1_slim.geojson -simplify 4% weighting=0.7 keep-shapes -o ${OUT}/adm1.topo.json format=topojson quantization=8000 force`, { stdio: 'pipe' });
// --- dunyo (110m) + kichik davlatlar nuqtalari ---
const world = JSON.parse(fs.readFileSync('/home/claude/geo/node_modules/world-atlas/countries-110m.json'));
const byNum = Object.fromEntries(countries.map(c => [c.ccn3, c]));
world.objects.countries.geometries.forEach(g => { const c = byNum[g.id]; g.properties = { d: c ? c._uz : '' }; });
world.objects.countries.geometries = world.objects.countries.geometries.filter(g => g.id !== '010');
const inW = new Set(world.objects.countries.geometries.map(g => g.id));
const dots = countries.filter(c => !inW.has(c.ccn3)).map(c => ({ d: c._uz, x: c.latlng[1], y: c.latlng[0] }));
delete world.bbox;
fs.writeFileSync(path.join(OUT, 'world.topo.json'), JSON.stringify(world));
fs.writeFileSync(path.join(OUT, 'dots.json'), JSON.stringify(dots));
// barcha davlat nomlari (nomlar.json uchun)
fs.writeFileSync(path.join(OUT, 'davlat_nomlari.json'), JSON.stringify(Object.fromEntries(countries.map(c => [c._uz, [c._ru, c._en]]))));
const sz = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB';
console.log('davlatlar:', countries.length, 'yangi:', COUNTRIES.length, 'mehmon:', COUNTRIES.reduce((a, c) => a + c.n, 0), '| adm1:', sz('adm1.topo.json'), 'world:', sz('world.topo.json'), 'nuqtalar:', dots.length);
