"""Dunyoning barcha davlatlaridan mehmonlar qo'shadi (mavjud qatorlar o'zgarmaydi, faqat yangilari qo'shiladi).

Kirish:  oromgoh_mehmonlari.csv, yangi_davlatlar.json (geo/build_world.js natijasi)
Chiqish: oromgoh_mehmonlari.csv (yangi qatorlar oxiriga qo'shilgan)

Har bir yangi qator mavjud sintetik chet ellik mehmon qatoridan nusxa olinadi (yil, yosh, jins, kanal, qurilma,
pandemiya holati kabi taqsimotlar saqlanadi), so'ng davlat, hudud, ism, til va identifikator almashtiriladi.
"""
import json, sys
import numpy as np
import pandas as pd

CSV, NEW = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(20261117)
b = pd.read_csv(CSV, dtype=str, keep_default_na=False, low_memory=False)
C = json.load(open(NEW, encoding="utf-8"))
have = set(b.davlat.unique())
C = [c for c in C if c["uz"] not in have]
if not C:
    sys.exit("Yangi davlat yo'q: hammasi allaqachon qo'shilgan.")
tpl = b[(b.fuqarolik_turi == "chet ellik") & b.manba.str.startswith("sint")].reset_index(drop=True)

P = {  # ism to'plamlari: [erkak, ayol, familiya]
 "slav": [["Oleksandr", "Dmytro", "Andriy", "Serhiy", "Maksym", "Ivan", "Artem", "Pavlo", "Mykola", "Yuriy", "Aleksey", "Viktor"],
          ["Olena", "Iryna", "Natalia", "Kateryna", "Yulia", "Anastasia", "Oksana", "Svetlana", "Tetiana", "Daria", "Maria", "Alina"],
          ["Kovalenko", "Shevchenko", "Bondarenko", "Tkachenko", "Kravchenko", "Ivanov", "Novak", "Melnyk", "Moroz", "Lysenko", "Petrenko", "Sokolov"]],
 "arm": [["Aram", "Armen", "Davit", "Gor", "Hayk", "Tigran", "Narek", "Vahe"], ["Anahit", "Ani", "Lilit", "Mariam", "Nare", "Gayane", "Siranush", "Tatevik"],
         ["Hakobyan", "Grigoryan", "Harutyunyan", "Sargsyan", "Petrosyan", "Avetisyan", "Karapetyan", "Mkrtchyan"]],
 "eng": [["James", "Oliver", "William", "Jack", "Thomas", "Harry", "Daniel", "Michael", "Liam", "Noah", "Samuel", "Ethan"],
         ["Emma", "Olivia", "Sophie", "Charlotte", "Emily", "Grace", "Amelia", "Chloe", "Hannah", "Lucy", "Jessica", "Ella"],
         ["Smith", "Brown", "Wilson", "Taylor", "Johnson", "Walker", "Clarke", "Murphy", "Campbell", "Evans", "Roberts", "Hughes"]],
 "esp": [["Carlos", "Juan", "Luis", "Diego", "Javier", "Miguel", "Alejandro", "Andrés", "Pablo", "Mateo", "Santiago", "Jorge"],
         ["María", "Lucía", "Sofía", "Valentina", "Camila", "Isabella", "Daniela", "Paula", "Elena", "Carmen", "Gabriela", "Ana"],
         ["García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Díaz", "Romero"]],
 "por": [["João", "Pedro", "Lucas", "Gabriel", "Rafael", "Tiago", "Miguel", "Bruno"], ["Ana", "Beatriz", "Mariana", "Juliana", "Inês", "Larissa", "Camila", "Fernanda"],
         ["Silva", "Santos", "Oliveira", "Souza", "Costa", "Pereira", "Ferreira", "Almeida"]],
 "fra": [["Louis", "Hugo", "Lucas", "Théo", "Mamadou", "Moussa", "Jean", "Pierre", "Ibrahima", "Antoine"], ["Léa", "Chloé", "Manon", "Camille", "Aïcha", "Fatou", "Marie", "Julie", "Awa", "Inès"],
         ["Martin", "Bernard", "Dubois", "Diallo", "Traoré", "Koné", "Diop", "Leroy", "Moreau", "Camara"]],
 "ger": [["Lukas", "Jonas", "Finn", "Lars", "Erik", "Jan", "Sven", "Matthias", "Niklas", "Daan"], ["Anna", "Lena", "Sofia", "Emma", "Ingrid", "Sanne", "Freja", "Laura", "Julia", "Elin"],
         ["Müller", "Schmidt", "Jansen", "de Vries", "Andersson", "Hansen", "Nielsen", "Johansson", "Virtanen", "Huber"]],
 "ita": [["Marco", "Luca", "Giuseppe", "Alessandro", "Matteo", "Francesco", "Lorenzo", "Andrea"], ["Giulia", "Chiara", "Sofia", "Francesca", "Martina", "Sara", "Alessia", "Elisa"],
         ["Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci"]],
 "ceu": [["Piotr", "Tomasz", "Jakub", "Marek", "Andrei", "Mihai", "Nikola", "Luka", "Dragan", "László", "Jonas", "Mantas"],
         ["Anna", "Katarzyna", "Zuzana", "Elena", "Ioana", "Milica", "Ana", "Jelena", "Eszter", "Rūta", "Ieva", "Petra"],
         ["Kowalski", "Nowak", "Novák", "Popescu", "Ionescu", "Horvat", "Petrović", "Jovanović", "Nagy", "Kazlauskas", "Bērziņš", "Dimitrov"]],
 "gre": [["Georgios", "Dimitrios", "Konstantinos", "Nikolaos", "Andreas", "Christos"], ["Maria", "Eleni", "Katerina", "Sofia", "Despina", "Ioanna"],
         ["Papadopoulos", "Georgiou", "Nikolaou", "Konstantinou", "Ioannou", "Christodoulou"]],
 "arb": [["Mohammed", "Ahmed", "Omar", "Khalid", "Youssef", "Hassan", "Ali", "Ibrahim", "Abdullah", "Karim", "Faisal", "Tariq"],
         ["Fatima", "Aisha", "Mariam", "Nour", "Layla", "Sara", "Huda", "Rania", "Amina", "Salma", "Yasmin", "Zainab"],
         ["Al-Sabah", "Al-Thani", "Haddad", "Mansour", "Khalil", "Nasser", "Saleh", "Hamdan", "Aziz", "Rahman", "Bakr", "Farouk"]],
 "heb": [["David", "Yosef", "Moshe", "Daniel", "Ariel", "Eitan", "Avraham", "Yonatan"], ["Sarah", "Rivka", "Noa", "Tamar", "Yael", "Miriam", "Shira", "Leah"],
         ["Cohen", "Levi", "Mizrahi", "Peretz", "Biton", "Friedman", "Kalontarov", "Aminov"]],
 "sas": [["Rahim", "Karim", "Arif", "Sanjay", "Rajesh", "Bikash", "Suresh", "Nimal", "Tenzin", "Hasan"], ["Fatema", "Nusrat", "Priya", "Sunita", "Anjali", "Kumari", "Dilini", "Pema", "Rupa", "Sabina"],
         ["Hossain", "Rahman", "Chowdhury", "Sharma", "Thapa", "Shrestha", "Perera", "Fernando", "Dorji", "Islam"]],
 "sea": [["Somchai", "Anan", "Nguyen", "Minh", "Jose", "Mark", "Wei Ming", "Sokha", "Aung", "Rizal"], ["Siriporn", "Nok", "Linh", "Thu", "Maria", "Angel", "Mei Ling", "Sreymom", "Thandar", "Nur"],
         ["Saetang", "Wong", "Tran", "Le", "Santos", "Reyes", "Tan", "Lim", "Chea", "Win"]],
 "kor": [["Chol", "Myong", "Song", "Kwang"], ["Kum", "Ok", "Hyang", "Son"], ["Kim", "Ri", "Pak", "Choe"]],
 "afr": [["Kwame", "Chinedu", "Emeka", "Juma", "Baraka", "Tendai", "Sipho", "Abebe", "Kofi", "Musa", "Tunde", "Thabo"],
         ["Amara", "Ngozi", "Zawadi", "Aisha", "Thandiwe", "Nomsa", "Wanjiru", "Chiamaka", "Esi", "Halima", "Achieng", "Lerato"],
         ["Okafor", "Mensah", "Mwangi", "Otieno", "Nkosi", "Dlamini", "Tesfaye", "Banda", "Adeyemi", "Kamau", "Moyo", "Abdi"]],
 "oce": [["Jack", "Liam", "Noah", "Tane", "Sione", "Josaia"], ["Charlotte", "Isla", "Mia", "Aroha", "Mele", "Litia"], ["Smith", "Wilson", "Ngata", "Tupou", "Fonua", "Kumar"]],
}
GRP = {}
for k, cs in {"slav": "UA BY MD", "arm": "AM", "eng": "GB IE CA JM TT BS BB AG DM GD KN LC VC GY BZ MT", "por": "PT BR AO MZ CV GW ST",
              "fra": "FR BE LU MC CH CI SN ML BF NE GN CM CD CG GA TD CF BJ TG MG DJ KM HT RW BI SC MU",
              "ger": "AT NL DK SE NO FI IS LI", "ita": "IT SM VA", "ceu": "PL CZ SK HU RO BG RS HR SI BA ME MK AL LT LV EE",
              "gre": "GR CY", "heb": "IL", "sas": "BD NP LK MV BT", "sea": "TH VN PH SG KH LA MM BN TL", "kor": "KP",
              "arb": "KW QA OM BH JO LB SY IQ YE MA DZ TN LY SD MR SO PS",
              "oce": "AU NZ FJ PG SB VU WS TO KI TV NR PW FM MH"}.items():
    for c in cs.split():
        GRP[c] = k
def pool(cc, mintaqa):
    if cc in GRP: return P[GRP[cc]]
    if mintaqa in ("Janubiy Amerika", "Markaziy Amerika", "Karib havzasi") or cc in ("MX", "CU", "DO", "GQ"): return P["esp"]
    return P["afr"]
TIL = {"eng": "en", "spa": "es", "fra": "fr", "por": "pt", "deu": "de", "ita": "it", "ara": "ar", "rus": "ru", "ukr": "uk", "bel": "be", "pol": "pl", "nld": "nl",
       "swe": "sv", "nor": "no", "nob": "no", "dan": "da", "fin": "fi", "ces": "cs", "slk": "sk", "hun": "hu", "ron": "ro", "bul": "bg", "srp": "sr", "hrv": "hr",
       "slv": "sl", "ell": "el", "heb": "he", "hye": "hy", "ben": "bn", "nep": "ne", "sin": "si", "tha": "th", "vie": "vi", "fil": "tl", "msa": "ms", "khm": "km",
       "lao": "lo", "mya": "my", "kor": "ko", "swa": "sw", "amh": "am", "lit": "lt", "lav": "lv", "est": "et", "isl": "is", "mlt": "mt", "sqi": "sq", "mkd": "mk",
       "bos": "bs", "cnr": "sr", "ltz": "lb", "cat": "ca", "zho": "zh", "kin": "rw", "som": "so", "afr": "af", "zul": "zu", "mlg": "mg", "dzo": "dz", "div": "dv"}

rows = []
start = int(b.tartib_raqami.astype(int).max()) + 1
alnum = np.array(list("abcdefghijklmnopqrstuvwxyz0123456789"))
for c in C:
    n = int(c["n"])
    t = tpl.sample(n, replace=True, random_state=int(rng.integers(1e9))).copy()
    w = np.array([r["w"] for r in c["regions"]], float); w = w / w.sum()
    t["viloyat"] = rng.choice([r["uz"] for r in c["regions"]], size=n, p=w)
    t["qita"], t["mintaqa"], t["davlat"] = c["qita"], c["mintaqa"], c["uz"]
    pl = pool(c["cca2"], c["mintaqa"])
    male = (t.jinsi == "erkak").to_numpy()
    first = np.where(male, rng.choice(pl[0], n), rng.choice(pl[1], n)); last = rng.choice(pl[2], n)
    t["ism"] = [f"{a} {z}" for a, z in zip(first, last)]
    native = TIL.get(c.get("til", "eng"), "en")
    t["til"] = np.where(rng.random(n) < 0.7, native, "en")
    t["foydalanuvchi_id"] = ["".join(rng.choice(alnum, 10)) for _ in range(n)]
    rows.append(t)
new = pd.concat(rows, ignore_index=True)
# yangi qatorlarni sana bo'yicha tartiblab, raqam berish
new = new.sort_values(["royxatdan_otgan_sana", "birinchi_faollik_vaqti"], kind="stable").reset_index(drop=True)
new["tartib_raqami"] = [str(start + i) for i in range(len(new))]
out = pd.concat([b, new[b.columns]], ignore_index=True)
assert out.tartib_raqami.is_unique and len(out) == len(b) + len(new)
out.to_csv(CSV, index=False)
print(f"qo'shildi: {len(new)} mehmon, {len(C)} davlat; jami: {len(out)} qator, {out.davlat.nunique()} davlat")
