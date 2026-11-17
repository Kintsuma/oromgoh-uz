"""index.html ni src/ dagi qismlardan yig'adi:  python build.py"""
import json, os
d = os.path.dirname(os.path.abspath(__file__))
S = lambda *p: os.path.join(d, 'src', *p)
r = lambda p: open(p, encoding='utf-8').read()
h = r(S('template.html'))
m = json.load(open(S('data', 'model.json'), encoding='utf-8')); m.pop('check', None)
parts = {'__CSS__': r(S('base.css')), '__DATA__': r(S('data', 'data3.json')), '__MODEL__': json.dumps(m, ensure_ascii=False, separators=(',', ':')),
         '__KL__': r(S('data', 'klaster.json')), '__MAPS__': r(S('data', 'maps.json')), '__NAMES__': r(S('data', 'nomlar.json')),
         '__WORLD__': r(S('data', 'world.topo.json')), '__ADM__': r(S('data', 'adm1.topo.json')), '__DOTS__': r(S('data', 'dots.json')),
         '__JS__': '\n'.join(r(S(f)) for f in ['i18n.js', 'i18n_ops.js', 'i18n_guest.js', 'globe.js', 'app.js', 'ops.js', 'guest.js'])}
for k, v in parts.items():
    if k not in ('__CSS__', '__JS__'): assert '</' not in v, k
    h = h.replace(k, v, 1)
HEAD = ('<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}'
        '[hidden]{display:none!important}</style></head><body>\n')
h = HEAD + h + '\n</body></html>\n'
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(h)
print('index.html:', len(h.encode()) // 1024, 'KB')
