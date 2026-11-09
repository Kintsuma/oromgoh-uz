// Xarita yo'llarini (SVG path) tayyorlaydi: dunyo (Natural Earth 110m, world-atlas) va O'zbekiston viloyatlari (OSM asosida).
const fs = require('fs');
const { execSync } = require('child_process');
const d3 = require('d3-geo');
const topo = require('topojson-client');

// --- Dunyo ---
const world = JSON.parse(fs.readFileSync(__dirname + '/node_modules/world-atlas/countries-110m.json', 'utf8'));
const countries = topo.feature(world, world.objects.countries);
const ISO = { '840': 'AQSh', '860': "O'zbekiston", '398': "Qozog'iston", '417': "Qirg'iziston", '762': 'Tojikiston',
  '795': 'Turkmaniston', '156': 'Xitoy', '410': 'Janubiy Koreya', '392': 'Yaponiya', '496': "Mo'g'uliston", '356': 'Hindiston',
  '586': 'Pokiston', '004': "Afg'oniston", '458': 'Malayziya', '360': 'Indoneziya', '792': 'Turkiya', '784': 'BAA',
  '682': 'Saudiya Arabistoni', '364': 'Eron', '031': 'Ozarbayjon', '268': 'Gruziya', '643': 'Rossiya', '276': 'Germaniya',
  '250': 'Fransiya', '818': 'Misr' };
countries.features = countries.features.filter(f => f.properties.name !== 'Antarctica');
const WW = 960, WH = 470;
const wp = d3.geoNaturalEarth1().fitExtent([[4, 4], [WW - 4, WH - 4]], countries);
const wpath = d3.geoPath(wp).digits(1);
const W = countries.features.map(f => ({ d: ISO[f.id] || '', p: wpath(f) }));
const found = new Set(W.filter(x => x.d).map(x => x.d));
const missing = Object.values(ISO).filter(n => !found.has(n));
// 110m to'plamida bo'lmagan kichik davlatlar uchun nuqta (markaz koordinatasi)
const PTS = { 'BAA': [54.3, 24.4], 'Malayziya': [101.7, 3.1] };
const dots = missing.map(n => { const c = wp(PTS[n] || [0, 0]); return { d: n, x: +c[0].toFixed(1), y: +c[1].toFixed(1) }; });

// --- O'zbekiston ---
execSync(`npx mapshaper ${__dirname}/uzgeo/geojson/uzbekistan_regional.geojson -simplify 6% keep-shapes -o ${__dirname}/uz_simple.geojson format=geojson force`, { stdio: 'pipe' });
const uz = JSON.parse(fs.readFileSync(__dirname + '/uz_simple.geojson', 'utf8'));
// d3-geo halqalarni soat mili bo'yicha kutadi: teskari chizilgan poligonlarni to'g'rilash
uz.features.forEach(f => {
  const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  polys.forEach(poly => poly.forEach((ring, i) => { const area = d3.geoArea({ type: 'Polygon', coordinates: [ring] }); if (area > 2 * Math.PI) ring.reverse(); }));
});
const UW = 640, UH = 400;
const up = d3.geoMercator().fitExtent([[6, 6], [UW - 6, UH - 6]], uz);
const upath = d3.geoPath(up).digits(1);
const fixName = s => s.replace(/ʻ/g, "'").replace('Toshkent sh.', 'Toshkent shahri');
const U = uz.features.map(f => {
  const c = up(d3.geoCentroid(f));
  return { v: fixName(f.properties.ADM1_UZ), ru: f.properties.ADM1_RU.replace('Самаркандаская', 'Самаркандская'), en: f.properties.ADM1_EN.replace('province', 'region'),
           p: upath(f), x: +c[0].toFixed(1), y: +c[1].toFixed(1) };
});
// O'zbekiston xaritasida ko'rsatiladigan qo'shni davlatlar konturi (kontekst uchun)
const NB = ['398', '417', '762', '795', '004'];
const nb = countries.features.filter(f => NB.includes(f.id)).map(f => upath(f));

// Oromgoh joylashuvi (shartli): Chorvoq, Bo'stonliq tumani, Toshkent viloyati
const RES = [70.05, 41.64];
const rw = wp(RES), ru = up(RES);
const out = { world: { w: WW, h: WH, c: W, dots, resort: { x: +rw[0].toFixed(1), y: +rw[1].toFixed(1) } }, uz: { w: UW, h: UH, r: U, nb, resort: { x: +ru[0].toFixed(1), y: +ru[1].toFixed(1) } } };
fs.writeFileSync(__dirname + '/maps.json', JSON.stringify(out));
console.log('dunyo:', W.length, 'davlat; topilmadi:', missing, '| uz:', U.map(u => u.v).join(', '));
console.log('hajm KB:', (JSON.stringify(out).length / 1024).toFixed(0));
