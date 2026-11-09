"""Mehmonlar bazasiga hudud (shtat/viloyat), qayerdan_bildi va tavsiya_qilgan ustunlarini qo'shadi.

- Asl (Airbnb) qatorlarning mavjud qiymatlari o'zgarmaydi.
  * viloyat: asl qatorlarda bo'sh edi -> AQSh shtati sintetik tarzda (aholi ulushiga qarab) beriladi.
  * qayerdan_bildi: asl qatorlarda reklama_manbasi ustunidan to'g'ridan-to'g'ri olinadi (o'ylab topilmaydi).
- Sintetik qatorlarda: chet elliklarga hudud, kanal va tavsiya beriladi; reklama_kanali/reklama_manbasi
  yangi kanalga mos qilib qayta yoziladi (oldin asl taqsimotdan tasodifiy olingan edi).
"""
import sys
import numpy as np
import pandas as pd

SRC, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(77)
b = pd.read_csv(SRC, dtype=str, keep_default_na=False)

HUDUD = {
    "AQSh": {"Kaliforniya": 39, "Texas": 30, "Florida": 22, "Nyu-York": 20, "Pensilvaniya": 13, "Illinoys": 12.5,
             "Ogayo": 11.8, "Jorjiya": 11, "Shimoliy Karolina": 10.7, "Michigan": 10, "Nyu-Jersi": 9.3, "Virjiniya": 8.7,
             "Vashington": 7.8, "Arizona": 7.4, "Massachusets": 7, "Tennessi": 7, "Indiana": 6.8, "Merilend": 6.2,
             "Missuri": 6.2, "Kolorado": 5.9},
    "Qozog'iston": {"Almati shahri": 2.2, "Astana shahri": 1.4, "Shymkent shahri": 1.2, "Turkiston viloyati": 2.1,
                    "Almati viloyati": 1.5, "Qarag'anda viloyati": 1.1, "Jambil viloyati": 1.2},
    "Qirg'iziston": {"Bishkek shahri": 1.1, "O'sh viloyati": 1.4, "Jalolobod viloyati": 1.3, "Chuy viloyati": 1.0,
                     "Botken viloyati": 0.55, "O'sh shahri": 0.36},
    "Tojikiston": {"Dushanbe shahri": 1.2, "Sug'd viloyati": 2.8, "Xatlon viloyati": 3.4, "Respublika tobeligidagi tumanlar": 2.1},
    "Turkmaniston": {"Ashxobod shahri": 1.0, "Lebap viloyati": 1.2, "Mari viloyati": 1.5, "Dashoguz viloyati": 1.4, "Ahal viloyati": 0.9},
    "Xitoy": {"Pekin": 2.2, "Shanxay": 2.5, "Guandun": 12.6, "Shinjon-Uyg'ur": 2.6, "Chjetszyan": 6.5, "Sichuan": 8.4},
    "Janubiy Koreya": {"Seul": 9.5, "Pusan": 3.3, "Inchxon": 3.0, "Kyonggi": 13.5, "Tegu": 2.4},
    "Yaponiya": {"Tokio": 14, "Osaka": 8.8, "Kanagava": 9.2, "Aychi": 7.5, "Saytama": 7.3, "Xokkaydo": 5.1},
    "Mo'g'uliston": {"Ulan-Bator": 1.6, "Orxon": 0.1, "Darxan-Uul": 0.1},
    "Hindiston": {"Dehli": 3.2, "Maharashtra": 12.4, "Karnataka": 6.7, "Uttar-Pradesh": 23, "Tamilnadu": 7.7, "G'arbiy Bengaliya": 9.9},
    "Pokiston": {"Panjob": 12.7, "Sind": 5.5, "Xayber-Paxtunxva": 4.0, "Islomobod": 0.24},
    "Afg'oniston": {"Kobul": 5.5, "Balx": 1.5, "Hirot": 2.1, "Qandahor": 1.4},
    "Malayziya": {"Kuala-Lumpur": 2.0, "Selangor": 7.0, "Johor": 4.0, "Penang": 1.8},
    "Indoneziya": {"Jakarta": 10.6, "G'arbiy Yava": 49, "Sharqiy Yava": 41, "Bali": 4.3},
    "Turkiya": {"Istanbul": 15.9, "Anqara": 5.8, "Izmir": 4.5, "Bursa": 3.2, "Antaliya": 2.7},
    "BAA": {"Dubay": 3.6, "Abu-Dabi": 3.8, "Sharja": 1.8, "Ajmon": 0.5},
    "Saudiya Arabistoni": {"Ar-Riyod": 8.6, "Makka": 9.0, "Sharqiy viloyat": 5.1, "Madina": 2.4},
    "Eron": {"Tehron": 13.3, "Xuroson-Razaviy": 6.4, "Isfahon": 5.1, "Fors": 4.9, "Sharqiy Ozarbayjon": 3.9},
    "Ozarbayjon": {"Boku": 2.3, "Ganja": 0.34, "Sumqayit": 0.35, "Lankaron": 0.23},
    "Gruziya": {"Tbilisi": 1.2, "Imereti": 0.48, "Ajariya": 0.35, "Kvemo Kartli": 0.42},
    "Rossiya": {"Moskva": 13, "Sankt-Peterburg": 5.6, "Moskva viloyati": 8.5, "Tatariston": 4.0, "Novosibirsk viloyati": 2.8, "Sverdlovsk viloyati": 4.3},
    "Germaniya": {"Berlin": 3.7, "Bavariya": 13.4, "Shimoliy Reyn-Vestfaliya": 18, "Gamburg": 1.9},
    "Fransiya": {"Il-de-Frans": 12.3, "Provans-Alp-Kot-d'Azur": 5.1, "Overn-Ron-Alp": 8.0},
    "Misr": {"Qohira": 10, "Iskandariya": 5.4, "Giza": 9.0},
}

# --- 1) hudud: viloyati bo'sh bo'lgan barcha chet elliklar ---
need = (b.viloyat == "") & (b.davlat != "O'zbekiston")
for d, h in HUDUD.items():
    m = need & (b.davlat == d)
    if m.any():
        w = np.array(list(h.values()), float)
        b.loc[m, "viloyat"] = rng.choice(list(h), m.sum(), p=w / w.sum())
assert not ((b.viloyat == "")).any(), "hududsiz qator qoldi"

# --- 2) qayerdan_bildi: asl qatorlar reklama_manbasi'dan ---
ASL_MAP = {
    "facebook": "Facebook reklamasi", "facebook-open-graph": "Facebook reklamasi",
    "google": "Google va boshqa qidiruv", "bing": "Google va boshqa qidiruv", "yahoo": "Google va boshqa qidiruv",
    "naver": "Google va boshqa qidiruv", "baidu": "Google va boshqa qidiruv", "yandex": "Google va boshqa qidiruv",
    "daum": "Google va boshqa qidiruv", "gsp": "Google va boshqa qidiruv",
    "direct": "O'zi topgan (to'g'ridan-to'g'ri)",
    "craigslist": "E'lon saytlari", "padmapper": "E'lon saytlari", "vast": "Boshqa reklama", "other": "Boshqa reklama",
    "meetup": "Boshqa ijtimoiy tarmoqlar", "wayn": "Boshqa ijtimoiy tarmoqlar", "email-marketing": "Email xabarnoma",
}
asl = b.manba.str.startswith("asl")
b["qayerdan_bildi"] = ""
b.loc[asl, "qayerdan_bildi"] = b.loc[asl, "reklama_manbasi"].map(ASL_MAP).fillna("Boshqa reklama")

# --- 3) sintetik qatorlar uchun kanal ---
KANAL_UZ = {"Telegram kanali": 24, "Instagram reklamasi": 22, "Do'st yoki tanish tavsiyasi": 25, "Facebook reklamasi": 5,
            "Google va boshqa qidiruv": 8, "Turagentlik": 7, "O'zi topgan (to'g'ridan-to'g'ri)": 9}
KANAL_MDH = {"Telegram kanali": 16, "Instagram reklamasi": 22, "Do'st yoki tanish tavsiyasi": 20, "Facebook reklamasi": 6,
             "Google va boshqa qidiruv": 12, "Turagentlik": 14, "Bron saytlari": 6, "O'zi topgan (to'g'ridan-to'g'ri)": 4}
KANAL_XORIJ = {"Instagram reklamasi": 19, "Facebook reklamasi": 13, "Do'st yoki tanish tavsiyasi": 17, "Google va boshqa qidiruv": 20,
               "Turagentlik": 15, "Bron saytlari": 11, "Telegram kanali": 2, "O'zi topgan (to'g'ridan-to'g'ri)": 3}
MDH = {"Qozog'iston", "Qirg'iziston", "Tojikiston", "Turkmaniston", "Rossiya", "Ozarbayjon", "Gruziya"}


def pick(mask, dist):
    if not mask.any():
        return
    w = np.array(list(dist.values()), float)
    b.loc[mask, "qayerdan_bildi"] = rng.choice(list(dist), mask.sum(), p=w / w.sum())


syn = ~asl
yil = b.royxatdan_otgan_sana.str[:4].astype(int)
# Telegram kanallari 2013-yildan, Instagram reklamasi 2015-yildan boshlab mavjud
for band, drop in [((yil < 2013), {"Telegram kanali", "Instagram reklamasi"}),
                   ((yil >= 2013) & (yil < 2015), {"Instagram reklamasi"}),
                   ((yil >= 2015), set())]:
    for grp, dist in [((b.davlat == "O'zbekiston"), KANAL_UZ), (b.davlat.isin(MDH), KANAL_MDH),
                      (~b.davlat.isin(MDH | {"O'zbekiston"}), KANAL_XORIJ)]:
        pick(syn & band & grp, {k: v for k, v in dist.items() if k not in drop})

# sintetik qatorlarda reklama ustunlarini kanalga moslash
KM = {"Telegram kanali": ("social", "telegram"), "Instagram reklamasi": ("social", "instagram"),
      "Facebook reklamasi": ("social", "facebook"), "Google va boshqa qidiruv": ("seo", "google"),
      "Do'st yoki tanish tavsiyasi": ("referral", "tavsiya"), "Turagentlik": ("partner", "turagentlik"),
      "Bron saytlari": ("partner", "bron_sayti"), "O'zi topgan (to'g'ridan-to'g'ri)": ("direct", "direct")}
b.loc[syn, "reklama_kanali"] = b.loc[syn, "qayerdan_bildi"].map(lambda k: KM[k][0])
b.loc[syn, "reklama_manbasi"] = b.loc[syn, "qayerdan_bildi"].map(lambda k: KM[k][1])

# --- 4) tavsiya_qilgan ---
TAV = {"Do'st": 40, "Qarindosh": 25, "Hamkasb": 15, "Avval kelgan mehmon": 12, "Bloger": 8}
b["tavsiya_qilgan"] = ""
m = b.qayerdan_bildi == "Do'st yoki tanish tavsiyasi"
w = np.array(list(TAV.values()), float)
b.loc[m, "tavsiya_qilgan"] = rng.choice(list(TAV), m.sum(), p=w / w.sum())

# --- 5) oilaviy holat va toifa ---
# Asl qatorlarda yosh 16-90 oralig'ida bo'lsa ishonchli (Airbnb 18+; kichik yoki juda katta qiymatlar xato kiritilgan).
age = pd.to_numeric(b.yoshi, errors="coerce")
valid = np.where(asl, age.between(16, 90), age.between(0, 90))
child = valid & (age < 16)
adult = valid & (age >= 16)
a = age.fillna(0).values
pm = np.select([a < 18, a < 22, a < 26, a < 30, a < 35, a < 50], [0.02, 0.12, 0.35, 0.60, 0.75, 0.82], 0.85)
uzb = (b.davlat == "O'zbekiston").values
pm = pm + np.where(uzb & (a >= 18) & (a < 30), 0.15, 0) + np.where((b.jinsi == "ayol").values & (a >= 18) & (a < 26), 0.05, 0)
married = adult & (rng.random(len(b)) < np.clip(pm, 0, 0.95))
b["oilaviy_holati"] = np.select([child, married, adult], ["voyaga yetmagan", "turmush qurgan", "turmush qurmagan"], "noma'lum")
g = b.jinsi.values
b["toifa"] = np.select(
    [child & (g == "erkak"), child & (g == "ayol"),
     married & (g == "erkak"), married & (g == "ayol"),
     adult & ~married & (g == "erkak"), adult & ~married & (g == "ayol")],
    ["o'g'il bola", "qiz bola", "erkak", "ayol", "yigit", "qiz"], "aniqlanmagan")

# --- 6) pandemiya (COVID-19) ---
# Vaqt chizig'i (oromgoh qarorlari shartli):
#   2019-12      : Xitoyda boshlangan
#   2020-03-15   : O'zbekistonda birinchi holat; 2020-03-16 dan karantin, oromgoh yangi mehmon qabul qilmaydi
#   2020-08-15   : oromgoh ichki turizm uchun qayta ochiladi (faqat O'zbekiston fuqarolari)
#   2021-07-01   : chet ellik mehmonlar qabul qilina boshlaydi
#   2023-05-05   : JSST pandemiya bo'yicha xalqaro favqulodda holatni tugatdi
# birinchi_bron_sanasi = oromgohga kelish sanasi deb olinadi. Faqat sintetik qatorlarga ta'sir qiladi
# (asl qatorlar 2010-2015 yillarga tegishli).
arr = pd.to_datetime(b.birinchi_bron_sanasi, errors="coerce")
in_ = lambda s, e: (arr >= s) & (arr <= e)
yopiq = syn & in_("2020-03-16", "2020-08-14")
chegara = syn & in_("2020-08-15", "2021-06-30") & (b.davlat != "O'zbekiston")
cheklov = syn & in_("2020-08-15", "2021-06-30") & (b.davlat == "O'zbekiston")
qolgan = syn & in_("2020-03-01", "2020-03-15")
b["tashrif_holati"] = np.select(
    [yopiq, chegara, qolgan, cheklov],
    ["kela olmagan (karantin)", "kela olmagan (chegara yopiq)", "majburan qolgan (karantin)", "cheklovlar bilan kelgan"],
    "kelgan")
b["xarajat_qoplash"] = np.where(qolgan, "50% davlat, 50% oromgoh chegirmasi", "")

cols = list(b.columns)
for c in ["qayerdan_bildi", "tavsiya_qilgan", "oilaviy_holati", "toifa"]:
    cols.remove(c)
i = cols.index("reklama_kanali")
cols[i:i] = ["qayerdan_bildi", "tavsiya_qilgan"]
j = cols.index("til")
cols[j:j] = ["oilaviy_holati", "toifa"]
for c in ["tashrif_holati", "xarajat_qoplash"]:
    cols.remove(c)
k = cols.index("manba")
cols[k:k] = ["tashrif_holati", "xarajat_qoplash"]
b[cols].to_csv(OUT, index=False)
print(b.qayerdan_bildi.value_counts().to_string())
print(b.toifa.value_counts().to_string())
print(b.tashrif_holati.value_counts().to_string())
print("hududlar:", b.groupby("davlat").viloyat.nunique().sum(), "| qatorlar:", len(b))
