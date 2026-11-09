import json, sys
import pandas as pd

SRC, OUT = sys.argv[1], sys.argv[2]
b = pd.read_csv(SRC, dtype={"foydalanuvchi_id": str}, keep_default_na=False, low_memory=False)
b["yil"] = b.royxatdan_otgan_sana.str[:4]
b["yoshi"] = pd.to_numeric(b.yoshi, errors="coerce")
b["one"] = 1

D = {"jami": len(b), "asl": int((b.manba == "asl (Airbnb)").sum())}
D["fuqarolik"] = b.fuqarolik_turi.value_counts().to_dict()
D["davlatlar_soni"] = int(b.davlat.nunique())
D["jinsi"] = b.jinsi.value_counts().to_dict()

dav = b.pivot_table(index=["qita", "mintaqa", "davlat"], columns="jinsi", values="one", aggfunc="sum", fill_value=0).reset_index()
D["davlat"] = [{"q": r["qita"], "m": r["mintaqa"], "d": r["davlat"],
                "n": int(sum(r.get(k, 0) for k in ("erkak", "ayol", "boshqa", "nomalum"))),
                "e": int(r.get("erkak", 0)), "a": int(r.get("ayol", 0))} for r in dav.to_dict("records")]

v = b[b.viloyat != ""]
vj = v.pivot_table(index="viloyat", columns="jinsi", values="one", aggfunc="sum", fill_value=0).reset_index()
D["viloyat"] = [{"v": r["viloyat"], "n": int(r.get("erkak", 0) + r.get("ayol", 0)),
                 "e": int(r.get("erkak", 0)), "a": int(r.get("ayol", 0))} for r in vj.to_dict("records")]

yil = b.pivot_table(index="yil", columns="fuqarolik_turi", values="one", aggfunc="sum", fill_value=0)
D["yil"] = [{"y": y, **{k: int(val) for k, val in row.items()}} for y, row in yil.iterrows()]

ok = b.yoshi.between(15, 90)
lab = ["15–24", "25–34", "35–44", "45–54", "55–64", "65+"]
b["yg"] = pd.cut(b.yoshi, bins=[15, 25, 35, 45, 55, 65, 91], labels=lab, right=False)
yp = b[ok].pivot_table(index="yg", columns="fuqarolik_turi", values="one", aggfunc="sum", fill_value=0, observed=False)
D["yosh"] = [{"g": str(g), **{k: int(val) for k, val in row.items()}} for g, row in yp.iterrows()]
D["yosh_nomalum"] = int((~ok).sum())

# proporsional namuna jadval uchun (~1600 qator), har bir guruhdan kamida 3 ta
parts = []
for _, x in b.groupby(["davlat", "viloyat"]):
    k = max(3, round(1600 * len(x) / len(b)))
    parts.append(x.sample(min(k, len(x)), random_state=7))
s = pd.concat(parts).sort_values("tartib_raqami")
D["namuna"] = [[int(r.tartib_raqami), r.ism, r.davlat, r.viloyat, r.mintaqa, r.qita, r.jinsi,
                int(r.yoshi) if pd.notna(r.yoshi) and 15 <= r.yoshi <= 90 else None,
                r.royxatdan_otgan_sana, "asl" if r.manba.startswith("asl") else "qo'shilgan"]
               for r in s.itertuples()]

json.dump(D, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(D["namuna"]), D["fuqarolik"], D["yosh_nomalum"], D["yil"][:2], len(D["davlat"]), len(D["viloyat"]))
