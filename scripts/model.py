"""Logistik regressiya va SVM: mehmon bron qiladimi (ha / yo'q)?

Faqat asl (Airbnb) qatorlar ishlatiladi, chunki sintetik qatorlarda bron natijasi haqiqiy emas.
Maqsad (y): sayohat_davlati "bron_qilmagan" bo'lmasa -> 1 (bron qilgan), aks holda 0.
Belgilar (X): yosh guruhi, jinsi, ro'yxat usuli, ro'yxat qurilmasi, qayerdan bilgani, sayt tili.
birinchi_bron_sanasi ishlatilmaydi: u faqat bron qilganlarda to'ldirilgan, ya'ni javobni oldindan aytib qo'yadi.

Ishga tushirish:  python model.py oromgoh_mehmonlari.csv model.json
"""
import json, sys
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split

SRC, OUT = sys.argv[1], sys.argv[2]
df = pd.read_csv(SRC, dtype=str, keep_default_na=False, low_memory=False)
df = df[df.manba.str.startswith("asl")].copy()

# --- 1. Maqsad ---
y = (df.sayohat_davlati != "bron_qilmagan").astype(int).values

# --- 2. Belgilarni tayyorlash ---
age = pd.to_numeric(df.yoshi, errors="coerce")
G = ["15–24", "25–34", "35–44", "45–54", "55–64", "65+"]
df["yosh_guruhi"] = pd.cut(age.where(age.between(15, 90)), [15, 25, 35, 45, 55, 65, 91], labels=G, right=False).astype(str).replace("nan", "ko'rsatilmagan")
df["royxat_usuli"] = df.royxat_usuli.map({"basic": "email", "facebook": "Facebook", "google": "Google"}).fillna("email")
df["sayt_tili"] = np.where(df.til == "en", "ingliz", "boshqa til")
FEATS = {
    "yosh_guruhi": "Yosh guruhi",
    "jinsi": "Jinsi",
    "royxat_usuli": "Ro'yxatdan o'tish usuli",
    "royxat_qurilmasi": "Ro'yxatdan o'tgan qurilma",
    "qayerdan_bildi": "Qayerdan bilgan",
    "sayt_tili": "Sayt tili",
}
# Har bir belgining eng ko'p uchraydigan qiymati "asosiy" (bazaviy) bo'ladi, qolganlari unga nisbatan baholanadi
levels = {f: df[f].value_counts().index.tolist() for f in FEATS}
X = pd.get_dummies(df[list(FEATS)], prefix_sep="=")
base_cols = [f"{f}={levels[f][0]}" for f in FEATS]
X = X.drop(columns=base_cols).astype(float)

# --- 3. O'qitish va test qilish (80% / 20%) ---
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
m = LogisticRegression(max_iter=2000, C=1.0)
m.fit(Xtr, ytr)
p = m.predict_proba(Xte)[:, 1]
acc = accuracy_score(yte, p >= 0.5)
auc = roc_auc_score(yte, p)
baseline = max(yte.mean(), 1 - yte.mean())  # hammaga "bron qilmaydi" desak

# --- 4. Saytga eksport ---
coef = dict(zip(X.columns, m.coef_[0]))
out = {"intercept": float(m.intercept_[0]), "features": [], "metrics": {
    "accuracy": round(float(acc), 4), "auc": round(float(auc), 4), "baseline": round(float(baseline), 4),
    "n_train": int(len(ytr)), "n_test": int(len(yte)), "booked_rate": round(float(y.mean()), 4)}}
for f, label in FEATS.items():
    vals = []
    for v in levels[f]:
        if (df[f] == v).sum() < 50:  # juda kam uchraydigan qiymatlar ko'rsatilmaydi
            continue
        vals.append({"v": v, "w": round(float(coef.get(f"{f}={v}", 0.0)), 5), "n": int((df[f] == v).sum()),
                     "rate": round(float(y[(df[f] == v).values].mean()), 4)})
    out["features"].append({"key": f, "label": label, "base": levels[f][0], "values": vals})

# --- 5. SVM (tayanch vektorlar mashinasi) ---
# Xuddi shu belgilar va xuddi shu 80/20 bo'linish ishlatiladi, shunda ikki model adolatli taqqoslanadi.
# Chiziqli SVM: guruhlar orasidan imkon qadar keng "yo'l" (chegara) o'tkazadi.
# Natija ehtimol emas, chegaradan masofa: f = b + w1 + w2 + ...  (f > 0 -> bron qiladi).
from sklearn.svm import LinearSVC, SVC
import time

svm = LinearSVC(C=0.05, max_iter=20000)
svm.fit(Xtr, ytr)
f = svm.decision_function(Xte)
s_acc = accuracy_score(yte, f > 0)
s_auc = roc_auc_score(yte, f)
ns = int((np.abs(ytr * 2 - 1) * svm.decision_function(Xtr) <= 1).sum())  # chegara ichidagi yoki unga tegib turgan misollar

# Kernel (RBF) SVM: egri chegara chiza oladi, lekin juda sekin, shuning uchun 20 000 misolda o'qitiladi
rs = np.random.default_rng(0)
i_tr = rs.choice(len(ytr), 20000, replace=False)
i_te = rs.choice(len(yte), 10000, replace=False)
t0 = time.time()
rbf = SVC(kernel="rbf", C=1.0, gamma="scale").fit(Xtr.iloc[i_tr], ytr[i_tr])
rf = rbf.decision_function(Xte.iloc[i_te])
rbf_res = {"accuracy": round(float(accuracy_score(yte[i_te], rf > 0)), 4), "auc": round(float(roc_auc_score(yte[i_te], rf)), 4),
           "n_train": 20000, "n_test": 10000, "n_sv": int(rbf.n_support_.sum()), "sec": round(time.time() - t0, 1),
           # adolatli taqqoslash: chiziqli SVM va logistik regressiya aynan shu 10 000 misolda
           "lin_acc_same": round(float(accuracy_score(yte[i_te], f[i_te] > 0)), 4),
           "lin_auc_same": round(float(roc_auc_score(yte[i_te], f[i_te])), 4),
           "lr_acc_same": round(float(accuracy_score(yte[i_te], p[i_te] >= 0.5)), 4),
           "base_same": round(float(max(yte[i_te].mean(), 1 - yte[i_te].mean())), 4)}

scoef = dict(zip(X.columns, svm.coef_[0]))
out["svm"] = {"intercept": float(svm.intercept_[0]),
              "w": {f"{f_}={v['v']}": round(float(scoef.get(f"{f_}={v['v']}", 0.0)), 5) for f_ in FEATS for v in
                    next(x for x in out["features"] if x["key"] == f_)["values"]},
              "metrics": {"accuracy": round(float(s_acc), 4), "auc": round(float(s_auc), 4), "n_margin": ns,
                          "n_train": int(len(ytr)), "n_test": int(len(yte))},
              "rbf": rbf_res}

# --- 6. Qaror daraxti ---
# "Ha/yo'q" savollar zanjiri. Chuqurligi 3: eng ko'pi 3 ta savol, 8 ta yakuniy guruh (barg). Rasmda chizish uchun qulay.
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(max_depth=3, min_samples_leaf=500, random_state=0).fit(Xtr, ytr)
tp = tree.predict_proba(Xte)[:, 1]
deep = DecisionTreeClassifier(max_depth=8, min_samples_leaf=200, random_state=0).fit(Xtr, ytr)
dp = deep.predict_proba(Xte)[:, 1]
T_ = tree.tree_
cols = list(X.columns)


def node(i):
    n = {"n": int(T_.n_node_samples[i]), "rate": round(float(T_.value[i][0][1] / T_.value[i][0].sum()), 4)}
    if T_.children_left[i] == -1:
        return n
    f_, v = cols[T_.feature[i]].split("=", 1)
    # dummy ustun: qiymat <= 0.5 -> "yo'q" (chap), > 0.5 -> "ha" (o'ng)
    n.update({"f": f_, "v": v, "no": node(T_.children_left[i]), "yes": node(T_.children_right[i])})
    return n


out["tree"] = {"root": node(0), "metrics": {
    "accuracy": round(float(accuracy_score(yte, tp >= 0.5)), 4), "auc": round(float(roc_auc_score(yte, tp)), 4),
    "deep_accuracy": round(float(accuracy_score(yte, dp >= 0.5)), 4), "deep_auc": round(float(roc_auc_score(yte, dp)), 4),
    "deep_leaves": int(deep.get_n_leaves())}}

# --- 7. Qaysi davlatga sayohat qiladi? (ko'p sinfli logistik regressiya) ---
# Javob 12 xil: 10 ta davlat, "boshqa" yoki "bron qilmagan". Model har biriga ehtimol beradi.
# Baholash: aniqlik va NDCG@5 (Kaggle musobaqasining o'lchovi: to'g'ri javob ro'yxatda qanchalik yuqorida).
yd = np.asarray(df.sayohat_davlati.values, dtype=object)
Ytr_d, Yte_d = train_test_split(yd, test_size=0.2, random_state=42, stratify=y)
md = LogisticRegression(max_iter=3000, C=1.0).fit(Xtr, Ytr_d)
P = md.predict_proba(Xte)
cls = list(md.classes_)


def ndcg5(probs, truth):
    order = np.argsort(-probs, axis=1)[:, :5]
    hit = (np.array(cls, dtype=object)[order] == np.asarray(truth, dtype=object)[:, None])
    return float((hit / np.log2(np.arange(2, 7))).sum(axis=1).mean())


freq = pd.Series(Ytr_d).value_counts(normalize=True)
base_probs = np.tile([freq.get(c, 0) for c in cls], (len(Yte_d), 1))
out["dest"] = {"classes": cls, "intercept": [round(float(x), 5) for x in md.intercept_],
               "w": {c: [round(float(x), 5) for x in md.coef_[:, j]] for j, c in enumerate(cols)},
               "metrics": {"accuracy": round(float((np.array(cls, dtype=object)[P.argmax(1)] == np.asarray(Yte_d, dtype=object)).mean()), 4),
                           "ndcg5": round(ndcg5(P, Yte_d), 4), "base_ndcg5": round(ndcg5(base_probs, Yte_d), 4),
                           "base_accuracy": round(float(freq.max()), 4)},
               "share": {c: round(float(freq.get(c, 0)), 4) for c in cls}}

# tekshiruv uchun bitta misol
ex = Xte.iloc[[0]]
out["check"] = {"row": {c: 1 for c in ex.columns if ex.iloc[0][c] == 1}, "p": float(m.predict_proba(ex)[0, 1]),
                "svm_f": float(svm.decision_function(ex)[0]), "tree_p": float(tree.predict_proba(ex)[0, 1]),
                "dest_top": [[cls[k], float(md.predict_proba(ex)[0, k])] for k in np.argsort(-md.predict_proba(ex)[0])[:3]]}
print("DARAXT:", out["tree"]["metrics"])
print("DAVLAT:", out["dest"]["metrics"], out["dest"]["share"])
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print(f"LOGISTIK: aniqlik={acc:.3f}  AUC={auc:.3f}  bazaviy={baseline:.3f}  bron ulushi={y.mean():.3f}")
print(f"SVM (chiziqli): aniqlik={s_acc:.3f}  AUC={s_auc:.3f}  chegaradagi misollar={ns}")
print("SVM (RBF, 20k):", rbf_res)
print("bir xil javob berganlar:", round(float(((p >= 0.5) == (f > 0)).mean()), 4))
for f in out["features"]:
    print(f["label"], [(v["v"], v["w"]) for v in f["values"]][:6])
