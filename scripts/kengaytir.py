"""Airbnb foydalanuvchilar datasetini dam olish oromgohi mehmonlari bazasiga aylantiradi.

Asl 213 451 qator to'liq saqlanadi (ular AQSh fuqarolari, Airbnb ma'lumotlari shunday).
Yangi qatorlar sintetik: o'zbek mehmonlar (viloyat bo'yicha) va Sharq davlatlari mehmonlari.
"""
import sys
import numpy as np
import pandas as pd

SRC, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(2026)

u = pd.read_csv(SRC, dtype={"foydalanuvchi_id": str, "birinchi_faollik_vaqti": str})
n0 = len(u)

# --- asl qatorlar uchun yangi ustunlar ---
u["qita"] = "Shimoliy Amerika"
u["mintaqa"] = "Shimoliy Amerika"
u["davlat"] = "AQSh"
u["viloyat"] = ""
u["fuqarolik_turi"] = "chet ellik"
u["manba"] = "asl (Airbnb)"

# --- o'zbek viloyatlari (taxminiy aholi ulushi bo'yicha og'irlik) ---
viloyatlar = {
    "Toshkent shahri": 3.0, "Toshkent viloyati": 3.0, "Samarqand viloyati": 4.2,
    "Farg'ona viloyati": 4.0, "Andijon viloyati": 3.3, "Namangan viloyati": 3.0,
    "Qashqadaryo viloyati": 3.4, "Surxondaryo viloyati": 2.8, "Buxoro viloyati": 2.0,
    "Xorazm viloyati": 1.9, "Navoiy viloyati": 1.0, "Jizzax viloyati": 1.5,
    "Sirdaryo viloyati": 0.9, "Qoraqalpog'iston Respublikasi": 2.0,
}

# --- Sharq va boshqa davlatlar: (davlat, qita, mintaqa, til, og'irlik) ---
davlatlar = [
    ("Qozog'iston", "Osiyo", "Markaziy Osiyo", "kk", 9), ("Qirg'iziston", "Osiyo", "Markaziy Osiyo", "ky", 6),
    ("Tojikiston", "Osiyo", "Markaziy Osiyo", "tg", 6), ("Turkmaniston", "Osiyo", "Markaziy Osiyo", "tk", 3),
    ("Xitoy", "Osiyo", "Sharqiy Osiyo", "zh", 7), ("Janubiy Koreya", "Osiyo", "Sharqiy Osiyo", "ko", 6),
    ("Yaponiya", "Osiyo", "Sharqiy Osiyo", "ja", 4), ("Mo'g'uliston", "Osiyo", "Sharqiy Osiyo", "mn", 1),
    ("Hindiston", "Osiyo", "Janubiy Osiyo", "hi", 5), ("Pokiston", "Osiyo", "Janubiy Osiyo", "ur", 2),
    ("Afg'oniston", "Osiyo", "Janubiy Osiyo", "ps", 1),
    ("Malayziya", "Osiyo", "Janubi-Sharqiy Osiyo", "ms", 2), ("Indoneziya", "Osiyo", "Janubi-Sharqiy Osiyo", "id", 2),
    ("Turkiya", "Osiyo", "Yaqin Sharq", "tr", 7), ("BAA", "Osiyo", "Yaqin Sharq", "ar", 3),
    ("Saudiya Arabistoni", "Osiyo", "Yaqin Sharq", "ar", 2), ("Eron", "Osiyo", "Yaqin Sharq", "fa", 2),
    ("Ozarbayjon", "Osiyo", "Kavkaz", "az", 3), ("Gruziya", "Osiyo", "Kavkaz", "ka", 1),
    ("Rossiya", "Yevropa", "Sharqiy Yevropa", "ru", 6), ("Germaniya", "Yevropa", "G'arbiy Yevropa", "de", 2),
    ("Fransiya", "Yevropa", "G'arbiy Yevropa", "fr", 1), ("Misr", "Afrika", "Shimoliy Afrika", "ar", 1),
]

ismlar = {
    "uz": (["Aziz", "Jasur", "Sardor", "Bekzod", "Otabek", "Sherzod", "Doston", "Javohir", "Ulug'bek", "Rustam", "Akmal", "Farrux", "Shoxrux", "Jamshid", "Bobur", "Islom", "Abdulloh", "Muhammadali", "Sanjar", "Temur"],
           ["Madina", "Dilnoza", "Gulnora", "Malika", "Shahzoda", "Nilufar", "Sevara", "Zarina", "Mohira", "Feruza", "Kamola", "Dildora", "Nodira", "Laylo", "Munisa", "Sabina", "Barno", "Zilola", "Mohinur", "Oysha"],
           ["Karimov", "Rahimov", "Tursunov", "Yusupov", "Abdullayev", "Nazarov", "Ergashev", "Xolmatov", "Sobirov", "Qodirov", "Mirzayev", "Rasulov", "Aliyev", "Jo'rayev", "Hasanov", "Ismoilov", "Umarov", "Safarov", "Normatov", "To'xtayev"], "uz"),
    "Markaziy Osiyo": (["Nurlan", "Aibek", "Daniyar", "Askar", "Bakyt", "Firdavs", "Rustam", "Serdar", "Arman", "Timur"],
                       ["Aigerim", "Dana", "Aizada", "Gulnara", "Madina", "Zarina", "Aruzhan", "Saule", "Ayjan", "Nigora"],
                       ["Nurlanov", "Abenov", "Toktogulov", "Rahmonov", "Saparov", "Bekov", "Kasymov", "Ismoilov", "Annayev", "Serikov"]),
    "Sharqiy Osiyo": (["Wei", "Jun", "Min-ho", "Ji-hoon", "Haruto", "Takumi", "Bat-Erdene", "Hao", "Seung-woo", "Kenji"],
                      ["Li Na", "Mei", "Ji-woo", "Seo-yeon", "Yuki", "Sakura", "Oyun", "Xiu", "Hana", "Aiko"],
                      ["Wang", "Zhang", "Kim", "Park", "Lee", "Tanaka", "Sato", "Chen", "Choi", "Suzuki"]),
    "Xitoy": (["Wei", "Jun", "Hao", "Lei", "Ming", "Jian"], ["Li Na", "Mei", "Xiu", "Ying", "Fang", "Jing"], ["Wang", "Zhang", "Chen", "Liu", "Zhao", "Huang"]),
    "Janubiy Koreya": (["Min-ho", "Ji-hoon", "Seung-woo", "Hyun-woo", "Dong-hyun", "Jae-won"], ["Ji-woo", "Seo-yeon", "Min-ji", "Ha-eun", "Soo-ah", "Yu-na"], ["Kim", "Park", "Lee", "Choi", "Jung", "Kang"]),
    "Yaponiya": (["Haruto", "Takumi", "Kenji", "Ren", "Sota", "Yuto"], ["Yuki", "Sakura", "Aiko", "Hina", "Yui", "Mio"], ["Tanaka", "Sato", "Suzuki", "Takahashi", "Watanabe", "Ito"]),
    "Mo'g'uliston": (["Bat-Erdene", "Temuujin", "Ganbold", "Bold"], ["Oyun", "Saruul", "Enkhjin", "Altantsetseg"], ["Batbayar", "Dorj", "Ganzorig", "Erdenebat"]),
    "Turkiya": (["Mehmet", "Ahmet", "Mustafa", "Emre", "Burak", "Can"], ["Elif", "Zeynep", "Ayse", "Merve", "Esra", "Defne"], ["Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Ozturk"]),
    "BAA": (["Omar", "Khalid", "Saeed", "Rashid", "Hamdan"], ["Aisha", "Fatima", "Mariam", "Noor", "Shamma"], ["Al Mansouri", "Al Nuaimi", "Al Hashimi", "Al Ketbi", "Al Suwaidi"]),
    "Saudiya Arabistoni": (["Abdullah", "Faisal", "Khalid", "Turki", "Saud"], ["Nora", "Lama", "Sara", "Reem", "Hessa"], ["Al Qahtani", "Al Otaibi", "Al Ghamdi", "Al Harbi", "Al Zahrani"]),
    "Eron": (["Reza", "Ali", "Mohammad", "Hossein", "Amir"], ["Zahra", "Maryam", "Fatemeh", "Leyla", "Narges"], ["Hosseini", "Rahimi", "Ahmadi", "Mohammadi", "Karimi"]),
    "Hindiston": (["Arjun", "Rahul", "Amit", "Vikram", "Rohan", "Karan"], ["Priya", "Ananya", "Pooja", "Neha", "Riya", "Kavya"], ["Sharma", "Patel", "Singh", "Gupta", "Verma", "Reddy"]),
    "Janubiy Osiyo": (["Ali", "Imran", "Ahmad", "Bilal", "Hamid", "Usman"],
                      ["Ayesha", "Fatima", "Sana", "Zainab", "Mariam", "Hira"],
                      ["Khan", "Ahmadi", "Hussain", "Karimi", "Malik", "Qureshi"]),
    "Janubi-Sharqiy Osiyo": (["Ahmad", "Budi", "Hafiz", "Rizal", "Arif", "Danial"],
                             ["Siti", "Nurul", "Dewi", "Aisyah", "Putri", "Intan"],
                             ["Rahman", "Santoso", "Ismail", "Wijaya", "Hassan", "Abdullah"]),
    "Yaqin Sharq": (["Mehmet", "Ahmet", "Mustafa", "Omar", "Khalid", "Reza", "Yusuf", "Emre", "Abdullah", "Ali"],
                    ["Elif", "Zeynep", "Aisha", "Fatima", "Leyla", "Maryam", "Noor", "Sara", "Ayse", "Zahra"],
                    ["Yilmaz", "Kaya", "Demir", "Al Mansouri", "Al Saud", "Hosseini", "Celik", "Al Nahyan", "Rahimi", "Sahin"]),
    "Kavkaz": (["Elvin", "Rashad", "Giorgi", "Orkhan", "Levan", "Tural"],
               ["Aysel", "Nino", "Gunel", "Mariam", "Leyla", "Tamar"],
               ["Mammadov", "Aliyev", "Beridze", "Huseynov", "Kapanadze", "Guliyev"]),
    "Sharqiy Yevropa": (["Aleksandr", "Dmitriy", "Sergey", "Ivan", "Andrey", "Maksim"],
                        ["Anna", "Mariya", "Yelena", "Olga", "Natalya", "Anastasiya"],
                        ["Ivanov", "Petrov", "Smirnov", "Kuznetsov", "Popov", "Sokolov"]),
    "G'arbiy Yevropa": (["Lukas", "Jonas", "Pierre", "Louis", "Felix", "Hugo"],
                        ["Lena", "Marie", "Camille", "Sophie", "Emma", "Chloe"],
                        ["Muller", "Schmidt", "Martin", "Bernard", "Weber", "Dubois"]),
    "Shimoliy Afrika": (["Ahmed", "Mohamed", "Youssef", "Karim"], ["Nour", "Salma", "Yasmin", "Hana"], ["Hassan", "Mahmoud", "Ibrahim", "Saleh"]),
}

# Asl ma'lumotdagi taqsimotlardan namuna olinadigan ustunlar (realistik ko'rinish uchun)
namuna_ustunlar = ["royxat_usuli", "royxat_bosqichi", "reklama_kanali", "reklama_manbasi",
                   "birinchi_kuzatilgan_reklama", "royxat_qurilmasi", "birinchi_qurilma", "birinchi_brauzer"]


def yangi_qatorlar(n, kind):
    df = pd.DataFrame({c: u[c].sample(n, replace=True, random_state=int(rng.integers(1e9))).values for c in namuna_ustunlar})
    jins = rng.choice(["erkak", "ayol"], n, p=[0.52, 0.48])
    df["jinsi"] = jins
    # 14% bolalar (0-15 yosh, oilasi bilan kelgan), qolganlari 16 yoshdan katta
    child = rng.random(n) < 0.14
    df["yoshi"] = np.where(child, rng.integers(0, 16, n), np.clip(rng.normal(36, 13, n).round(), 16, 85)).astype(int)
    if kind == "uz":
        names = list(viloyatlar)
        w = np.array(list(viloyatlar.values())); w = w / w.sum()
        df["viloyat"] = rng.choice(names, n, p=w)
        df["qita"], df["mintaqa"], df["davlat"] = "Osiyo", "Markaziy Osiyo", "O'zbekiston"
        df["fuqarolik_turi"] = "o'zbek"
        df["til"] = rng.choice(["uz", "ru"], n, p=[0.8, 0.2])
        m, f, l, _ = ismlar["uz"]
        fam = rng.choice(l, n)
        fam = np.where(jins == "ayol", pd.Series(fam).str.replace(r"(ov|ev|yev)$", r"\1a", regex=True), fam)
        df["ism"] = np.where(jins == "erkak", rng.choice(m, n), rng.choice(f, n)) + " " + fam
    else:
        w = np.array([d[4] for d in davlatlar], float); w = w / w.sum()
        idx = rng.choice(len(davlatlar), n, p=w)
        df["davlat"] = [davlatlar[i][0] for i in idx]
        df["qita"] = [davlatlar[i][1] for i in idx]
        df["mintaqa"] = [davlatlar[i][2] for i in idx]
        df["til"] = [davlatlar[i][3] if rng.random() < 0.7 else "en" for i in idx]
        df["viloyat"] = ""
        df["fuqarolik_turi"] = "chet ellik"
        first, last = [], []
        for i, g in zip(idx, jins):
            m, f, l = ismlar.get(davlatlar[i][0], ismlar[davlatlar[i][2]])[:3]
            fam = str(rng.choice(l))
            if g == "ayol" and fam.endswith(("ov", "ev", "yev", "in")) and davlatlar[i][2] in ("Markaziy Osiyo", "Sharqiy Yevropa", "Kavkaz"):
                fam += "a"
            first.append(rng.choice(m if g == "erkak" else f)); last.append(fam)
        df["ism"] = [a + " " + b for a, b in zip(first, last)]
    # sanalar: 2010-01-01 ... 2026-11-06. Yillar og'irligi: mehmonlar soni yildan-yilga o'sadi,
    # 2020-yilda (pandemiya) keskin tushadi, 2026-yil faqat 6-noyabrgacha.
    YW = {2010: 1.0, 2011: 1.1, 2012: 1.2, 2013: 1.4, 2014: 1.6, 2015: 1.8, 2016: 2.0, 2017: 2.4, 2018: 3.0,
          2019: 3.6, 2020: 1.2, 2021: 2.6, 2022: 3.8, 2023: 4.5, 2024: 5.2, 2025: 6.0, 2026: 6.3 * 310 / 365}
    yrs = rng.choice(list(YW), n, p=np.array(list(YW.values())) / sum(YW.values()))
    ystart = np.array([np.datetime64(f"{y}-01-01") for y in yrs])
    ylen = np.array([(np.datetime64("2026-11-06") if y == 2026 else np.datetime64(f"{y + 1}-01-01")) - np.datetime64(f"{y}-01-01") for y in yrs]).astype(int)
    reg = ystart + (rng.random(n) * ylen).astype(int).astype("timedelta64[D]")
    df["royxatdan_otgan_sana"] = pd.to_datetime(reg).strftime("%Y-%m-%d")
    secs = rng.integers(0, 86400, n)
    df["birinchi_faollik_vaqti"] = [pd.Timestamp(r).strftime("%Y%m%d") + "%02d%02d%02d" % (s // 3600, s % 3600 // 60, s % 60) for r, s in zip(reg, secs)]
    stay = np.minimum(reg + rng.integers(1, 120, n).astype("timedelta64[D]"), np.datetime64("2026-11-06"))
    df["birinchi_bron_sanasi"] = pd.to_datetime(stay).strftime("%Y-%m-%d")
    df["sayohat_davlati"] = "UZ"
    df["foydalanuvchi_id"] = ["".join(rng.choice(list("abcdefghijklmnopqrstuvwxyz0123456789"), 10)) for _ in range(n)]
    df["manba"] = "sintetik (qo'shilgan)"
    return df


uz = yangi_qatorlar(160_000, "uz")
sh = yangi_qatorlar(110_000, "sharq")
new = pd.concat([uz, sh], ignore_index=True)
# id takrorlanmasin
new = new[~new.foydalanuvchi_id.isin(u.foydalanuvchi_id)].drop_duplicates("foydalanuvchi_id")

allc = [c for c in u.columns if c != "tartib_raqami"]
out = pd.concat([u[allc], new[allc]], ignore_index=True)
out = out.sort_values(["royxatdan_otgan_sana", "birinchi_faollik_vaqti"], kind="stable").reset_index(drop=True)
out.insert(0, "tartib_raqami", range(1, len(out) + 1))
order = ["tartib_raqami", "foydalanuvchi_id", "ism", "fuqarolik_turi", "qita", "mintaqa", "davlat", "viloyat",
         "royxatdan_otgan_sana", "birinchi_faollik_vaqti", "birinchi_bron_sanasi", "jinsi", "yoshi", "til",
         "royxat_usuli", "royxat_bosqichi", "reklama_kanali", "reklama_manbasi", "birinchi_kuzatilgan_reklama",
         "royxat_qurilmasi", "birinchi_qurilma", "birinchi_brauzer", "sayohat_davlati", "manba"]
out = out[order]
out.to_csv(OUT, index=False)
print("asl:", n0, "yangi:", len(new), "jami:", len(out))
