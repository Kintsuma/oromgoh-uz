"""K-means klasterlash: mehmonlarni o'xshashligiga qarab guruhlarga ajratadi (javobni oldindan bilish shart emas).

Belgilar: yosh, ayolmi, bolami, turmush qurganmi, o'zbekmi, oromgoh haqida qayerdan bilgani (6 guruh).
Jinsi yoki yoshi noma'lum mehmonlar ("aniqlanmagan") klasterga kirmaydi: klaster = -1.
Ishga tushirish: python klaster.py oromgoh_mehmonlari.csv chiqish.csv klaster_info.json
"""
import json, sys
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

SRC, OUT, INFO = sys.argv[1], sys.argv[2], sys.argv[3]
b = pd.read_csv(SRC, dtype=str, keep_default_na=False, low_memory=False)
ok = (b.toifa != "aniqlanmagan").values
d = b[ok]
KG = {"Instagram reklamasi": "ijtimoiy", "Telegram kanali": "ijtimoiy", "Facebook reklamasi": "ijtimoiy",
      "Boshqa ijtimoiy tarmoqlar": "ijtimoiy", "Do'st yoki tanish tavsiyasi": "tavsiya", "Google va boshqa qidiruv": "qidiruv",
      "O'zi topgan (to'g'ridan-to'g'ri)": "togri", "Turagentlik": "agent", "Bron saytlari": "agent"}
kg = d.qayerdan_bildi.map(KG).fillna("reklama")
F = pd.DataFrame({
    "yosh": pd.to_numeric(d.yoshi).values,
    "ayol": (d.jinsi == "ayol").astype(int).values,
    "bola": d.toifa.isin(["o'g'il bola", "qiz bola"]).astype(int).values,
    "oilali": (d.oilaviy_holati == "turmush qurgan").astype(int).values,
    "ozbek": (d.davlat == "O'zbekiston").astype(int).values,
})
for g in ["ijtimoiy", "tavsiya", "qidiruv", "togri", "agent", "reklama"]:
    F["k_" + g] = (kg == g).astype(int).values
# Klasterlash uchun faqat odamning o'zi haqidagi belgilar olinadi (kanal belgilari ko'p bo'lgani uchun
# guruhlarni o'ziga tortib oladi); kanal ulushlari keyin har bir guruh tavsifida ko'rsatiladi.
USE = ["yosh", "ayol", "bola", "oilali", "ozbek"]
sc = StandardScaler().fit(F[USE])
Z = sc.transform(F[USE])

rs = np.random.default_rng(1)
samp = rs.choice(len(Z), 20000, replace=False)
sil = {}
for k in range(3, 8):
    km = KMeans(n_clusters=k, n_init=5, random_state=0).fit(Z[samp])
    sil[k] = round(float(silhouette_score(Z[samp], km.labels_)), 4)
print("silhouette:", sil)
K = max(sil, key=sil.get) if len(sys.argv) < 5 else int(sys.argv[4])
km = KMeans(n_clusters=K, n_init=10, random_state=0).fit(Z)
lab = km.labels_

prof = []
for c in range(K):
    m = lab == c
    x = F[m]
    prof.append({"id": c, "n": int(m.sum()), "yosh": round(float(x.yosh.mean()), 1), "ayol": round(float(x.ayol.mean()), 3),
                 "bola": round(float(x.bola.mean()), 3), "oilali": round(float(x.oilali.mean()), 3), "ozbek": round(float(x.ozbek.mean()), 3),
                 "kanal": {g: round(float(x["k_" + g].mean()), 3) for g in ["ijtimoiy", "tavsiya", "qidiruv", "togri", "agent", "reklama"]}})
# kattaligi bo'yicha tartiblab qayta raqamlash (0 = eng katta)
order = sorted(range(K), key=lambda c: -prof[c]["n"])
remap = {old: new for new, old in enumerate(order)}
prof = [dict(prof[old], id=remap[old]) for old in order]
col = np.full(len(b), -1)
col[ok] = [remap[c] for c in lab]
b["klaster"] = col
b.to_csv(OUT, index=False)
json.dump({"k": K, "silhouette": sil, "profiles": prof, "excluded": int((~ok).sum()), "use": USE,
           "mean": [round(float(x), 6) for x in sc.mean_], "scale": [round(float(x), 6) for x in sc.scale_],
           "centers": [[round(float(x), 6) for x in km.cluster_centers_[old]] for old in order]}, open(INFO, "w"), ensure_ascii=False, indent=1)
for p in prof:
    print(p)
