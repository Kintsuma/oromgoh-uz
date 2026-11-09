"""Sayt uchun (qit'a, mintaqa, davlat, hudud) darajasidagi statistik kub va jadval namunasini hisoblaydi."""
import json, sys
import numpy as np
import pandas as pd

SRC, OUT = sys.argv[1], sys.argv[2]
b = pd.read_csv(SRC, dtype=str, keep_default_na=False, low_memory=False)
b["yil"] = b.royxatdan_otgan_sana.str[:4]
age = pd.to_numeric(b.yoshi, errors="coerce")
isasl = b.manba.str.startswith("asl")
okage = (isasl & age.between(16, 90)) | (~isasl & age.between(0, 90))
G = ["0–15", "16–24", "25–34", "35–44", "45–54", "55–64", "65+"]
b["yg"] = pd.cut(age.where(okage), bins=[0, 16, 25, 35, 45, 55, 65, 91], labels=G, right=False).astype(str)
TF = ["erkak", "ayol", "yigit", "qiz", "o'g'il bola", "qiz bola", "aniqlanmagan"]
b["age_ok"] = okage.astype(int)
b["age_v"] = age.where(okage, 0)

K = b.qayerdan_bildi.value_counts().index.tolist()
T = [t for t in b.tavsiya_qilgan.value_counts().index if t]
Y = sorted(b.yil.unique())
keys = ["qita", "mintaqa", "davlat", "viloyat"]


def counts(col, labels):
    p = pd.crosstab([b[k] for k in keys], b[col]).reindex(columns=labels, fill_value=0)
    return p


ck, ct, cy, cg = counts("qayerdan_bildi", K), counts("tavsiya_qilgan", T), counts("yil", Y), counts("yg", G)
cj = counts("jinsi", ["erkak", "ayol"])
ctf = counts("toifa", TF)
b["yt"] = b.yil + "|" + b.toifa
YT = [f"{y}|{t}" for y in Y for t in TF]
cyt = counts("yt", YT)
PS = ["kelgan", "cheklovlar bilan kelgan", "majburan qolgan (karantin)", "kela olmagan (karantin)", "kela olmagan (chegara yopiq)"]
cps = counts("tashrif_holati", PS)
PMON = [str(p) for p in pd.period_range("2019-10", "2021-12", freq="M")]
b["mon"] = b.birinchi_bron_sanasi.str[:7]
b["mps"] = b.mon + "|" + b.tashrif_holati
cpm = counts("mps", [f"{m}|{s}" for m in PMON for s in PS])
b["qtf"] = np.where(b.tashrif_holati == "majburan qolgan (karantin)", b.toifa, "-")
cqtf = counts("qtf", TF)
# oylar (ro'yxatdan o'tgan oy), qurilma, brauzer, klaster
b["oy"] = b.royxatdan_otgan_sana.str[5:7]
MO = [f"{i:02d}" for i in range(1, 13)]
cmo = counts("oy", MO)
DEV = ["Mac Desktop", "Windows Desktop", "iPhone", "iPad", "Android Phone", "Android Tablet", "Desktop (Other)", "Other/Unknown"]
b["dev"] = np.where(b.birinchi_qurilma.isin(DEV), b.birinchi_qurilma, "Other/Unknown")
cdev = counts("dev", DEV)
BRW = ["Chrome", "Safari", "Firefox", "Mobile Safari", "IE", "Chrome Mobile", "Android Browser", "-unknown-", "boshqa"]
b["brw"] = np.where(b.birinchi_brauzer.isin(BRW[:-1]), b.birinchi_brauzer, "boshqa")
cbrw = counts("brw", BRW)
KL = sorted(b.klaster.unique(), key=int)
ckl = counts("klaster", KL)
base = b.groupby(keys).agg(n=("tartib_raqami", "size"), s=("age_v", "sum"), c=("age_ok", "sum"), asl=("manba", lambda x: int(x.str.startswith("asl").sum())))
rows = []
for idx, r in base.iterrows():
    rows.append([*idx, int(r.n), *map(int, cj.loc[idx]), round(float(r.s)), int(r.c), int(r.asl),
                 list(map(int, ck.loc[idx])), list(map(int, ct.loc[idx])), list(map(int, cy.loc[idx])), list(map(int, cg.loc[idx])),
                 list(map(int, ctf.loc[idx])), list(map(int, cyt.loc[idx])),
                 list(map(int, cps.loc[idx])), list(map(int, cpm.loc[idx])), list(map(int, cqtf.loc[idx])),
                 list(map(int, cmo.loc[idx])), list(map(int, cdev.loc[idx])), list(map(int, cbrw.loc[idx])), list(map(int, ckl.loc[idx]))])

parts = []
for _, x in b.groupby(["davlat", "viloyat"]):
    k = max(2, round(2000 * len(x) / len(b)))
    parts.append(x.sample(min(k, len(x)), random_state=7))
s = pd.concat(parts).sort_values("tartib_raqami", key=lambda c: c.astype(int))
sample = [[int(r.tartib_raqami), r.ism, r.qita, r.mintaqa, r.davlat, r.viloyat, r.toifa,
           int(float(r.yoshi)) if r.yoshi and okage[r.Index] else None,
           r.royxatdan_otgan_sana, r.qayerdan_bildi, r.tavsiya_qilgan, "asl" if r.manba.startswith("asl") else "qo'shilgan", r.tashrif_holati, int(r.klaster)]
          for r in s.itertuples()]

json.dump({"K": K, "T": T, "Y": Y, "G": G, "TF": TF, "PS": PS, "PMON": PMON, "DEV": DEV, "BRW": BRW, "KL": [int(k) for k in KL], "rows": rows, "sample": sample, "jami": len(b)},
          open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print("hudud qatorlari:", len(rows), "namuna:", len(sample), "kanallar:", K)
# tekshiruv: kubdagi jami = asl jami
assert sum(r[4] for r in rows) == len(b)
assert sum(sum(r[14]) for r in rows) == len(b) == sum(sum(r[15]) for r in rows)
assert sum(sum(r[16]) for r in rows) == len(b)
for j in (19, 20, 21, 22):
    assert sum(sum(r[j]) for r in rows) == len(b), j
print("pandemiya:", dict(zip(PS, [sum(r[16][i] for r in rows) for i in range(len(PS))])), "majburan toifa:", [sum(r[18][i] for r in rows) for i in range(len(TF))])
print("toifalar:", dict(zip(TF, [sum(r[14][i] for r in rows) for i in range(len(TF))])))
