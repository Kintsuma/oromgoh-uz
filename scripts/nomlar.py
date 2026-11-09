"""Joy va toifa nomlarining rus va ingliz tarjimalari (sayt uchun). Chiqish: nomlar.json  {uz: [ru, en]}"""
import json, sys

N = {
    # qit'alar
    "Shimoliy Amerika": ["Северная Америка", "North America"], "Osiyo": ["Азия", "Asia"],
    "Yevropa": ["Европа", "Europe"], "Afrika": ["Африка", "Africa"],
    # mintaqalar
    "Markaziy Osiyo": ["Центральная Азия", "Central Asia"], "Sharqiy Osiyo": ["Восточная Азия", "East Asia"],
    "Janubiy Osiyo": ["Южная Азия", "South Asia"], "Janubi-Sharqiy Osiyo": ["Юго-Восточная Азия", "Southeast Asia"],
    "Yaqin Sharq": ["Ближний Восток", "Middle East"], "Kavkaz": ["Кавказ", "Caucasus"],
    "Sharqiy Yevropa": ["Восточная Европа", "Eastern Europe"], "G'arbiy Yevropa": ["Западная Европа", "Western Europe"],
    "Shimoliy Afrika": ["Северная Африка", "North Africa"],
    # davlatlar
    "AQSh": ["США", "USA"], "O'zbekiston": ["Узбекистан", "Uzbekistan"], "Qozog'iston": ["Казахстан", "Kazakhstan"],
    "Qirg'iziston": ["Кыргызстан", "Kyrgyzstan"], "Tojikiston": ["Таджикистан", "Tajikistan"],
    "Turkmaniston": ["Туркменистан", "Turkmenistan"], "Xitoy": ["Китай", "China"],
    "Janubiy Koreya": ["Южная Корея", "South Korea"], "Yaponiya": ["Япония", "Japan"],
    "Mo'g'uliston": ["Монголия", "Mongolia"], "Hindiston": ["Индия", "India"], "Pokiston": ["Пакистан", "Pakistan"],
    "Afg'oniston": ["Афганистан", "Afghanistan"], "Malayziya": ["Малайзия", "Malaysia"],
    "Indoneziya": ["Индонезия", "Indonesia"], "Turkiya": ["Турция", "Turkey"], "BAA": ["ОАЭ", "UAE"],
    "Saudiya Arabistoni": ["Саудовская Аравия", "Saudi Arabia"], "Eron": ["Иран", "Iran"],
    "Ozarbayjon": ["Азербайджан", "Azerbaijan"], "Gruziya": ["Грузия", "Georgia"], "Rossiya": ["Россия", "Russia"],
    "Germaniya": ["Германия", "Germany"], "Fransiya": ["Франция", "France"], "Misr": ["Египет", "Egypt"],
    # O'zbekiston
    "Toshkent shahri": ["г. Ташкент", "Tashkent city"], "Toshkent viloyati": ["Ташкентская область", "Tashkent region"],
    "Samarqand viloyati": ["Самаркандская область", "Samarkand region"], "Farg'ona viloyati": ["Ферганская область", "Fergana region"],
    "Andijon viloyati": ["Андижанская область", "Andijan region"], "Namangan viloyati": ["Наманганская область", "Namangan region"],
    "Qashqadaryo viloyati": ["Кашкадарьинская область", "Kashkadarya region"], "Surxondaryo viloyati": ["Сурхандарьинская область", "Surkhandarya region"],
    "Buxoro viloyati": ["Бухарская область", "Bukhara region"], "Xorazm viloyati": ["Хорезмская область", "Khorezm region"],
    "Navoiy viloyati": ["Навоийская область", "Navoi region"], "Jizzax viloyati": ["Джизакская область", "Jizzakh region"],
    "Sirdaryo viloyati": ["Сырдарьинская область", "Syrdarya region"], "Qoraqalpog'iston Respublikasi": ["Республика Каракалпакстан", "Republic of Karakalpakstan"],
    # AQSh shtatlari
    "Kaliforniya": ["Калифорния", "California"], "Texas": ["Техас", "Texas"], "Florida": ["Флорида", "Florida"],
    "Nyu-York": ["Нью-Йорк", "New York"], "Pensilvaniya": ["Пенсильвания", "Pennsylvania"], "Illinoys": ["Иллинойс", "Illinois"],
    "Ogayo": ["Огайо", "Ohio"], "Jorjiya": ["Джорджия", "Georgia (US)"], "Shimoliy Karolina": ["Северная Каролина", "North Carolina"],
    "Michigan": ["Мичиган", "Michigan"], "Nyu-Jersi": ["Нью-Джерси", "New Jersey"], "Virjiniya": ["Вирджиния", "Virginia"],
    "Vashington": ["Вашингтон", "Washington"], "Arizona": ["Аризона", "Arizona"], "Massachusets": ["Массачусетс", "Massachusetts"],
    "Tennessi": ["Теннесси", "Tennessee"], "Indiana": ["Индиана", "Indiana"], "Merilend": ["Мэриленд", "Maryland"],
    "Missuri": ["Миссури", "Missouri"], "Kolorado": ["Колорадо", "Colorado"],
    # Qozog'iston
    "Almati shahri": ["г. Алматы", "Almaty city"], "Astana shahri": ["г. Астана", "Astana city"], "Shymkent shahri": ["г. Шымкент", "Shymkent city"],
    "Turkiston viloyati": ["Туркестанская область", "Turkistan region"], "Almati viloyati": ["Алматинская область", "Almaty region"],
    "Qarag'anda viloyati": ["Карагандинская область", "Karaganda region"], "Jambil viloyati": ["Жамбылская область", "Jambyl region"],
    # Qirg'iziston
    "Bishkek shahri": ["г. Бишкек", "Bishkek city"], "O'sh viloyati": ["Ошская область", "Osh region"],
    "Jalolobod viloyati": ["Джалал-Абадская область", "Jalal-Abad region"], "Chuy viloyati": ["Чуйская область", "Chuy region"],
    "Botken viloyati": ["Баткенская область", "Batken region"], "O'sh shahri": ["г. Ош", "Osh city"],
    # Tojikiston
    "Dushanbe shahri": ["г. Душанбе", "Dushanbe city"], "Sug'd viloyati": ["Согдийская область", "Sughd region"],
    "Xatlon viloyati": ["Хатлонская область", "Khatlon region"], "Respublika tobeligidagi tumanlar": ["Районы республиканского подчинения", "Districts of Republican Subordination"],
    # Turkmaniston
    "Ashxobod shahri": ["г. Ашхабад", "Ashgabat city"], "Lebap viloyati": ["Лебапский велаят", "Lebap region"],
    "Mari viloyati": ["Марыйский велаят", "Mary region"], "Dashoguz viloyati": ["Дашогузский велаят", "Dashoguz region"],
    "Ahal viloyati": ["Ахалский велаят", "Ahal region"],
    # Xitoy
    "Pekin": ["Пекин", "Beijing"], "Shanxay": ["Шанхай", "Shanghai"], "Guandun": ["Гуандун", "Guangdong"],
    "Shinjon-Uyg'ur": ["Синьцзян-Уйгурский АР", "Xinjiang"], "Chjetszyan": ["Чжэцзян", "Zhejiang"], "Sichuan": ["Сычуань", "Sichuan"],
    # Koreya
    "Seul": ["Сеул", "Seoul"], "Pusan": ["Пусан", "Busan"], "Inchxon": ["Инчхон", "Incheon"], "Kyonggi": ["Кёнгидо", "Gyeonggi"], "Tegu": ["Тэгу", "Daegu"],
    # Yaponiya
    "Tokio": ["Токио", "Tokyo"], "Osaka": ["Осака", "Osaka"], "Kanagava": ["Канагава", "Kanagawa"], "Aychi": ["Айти", "Aichi"],
    "Saytama": ["Сайтама", "Saitama"], "Xokkaydo": ["Хоккайдо", "Hokkaido"],
    # Mo'g'uliston
    "Ulan-Bator": ["Улан-Батор", "Ulaanbaatar"], "Orxon": ["Орхон", "Orkhon"], "Darxan-Uul": ["Дархан-Уул", "Darkhan-Uul"],
    # Hindiston
    "Dehli": ["Дели", "Delhi"], "Maharashtra": ["Махараштра", "Maharashtra"], "Karnataka": ["Карнатака", "Karnataka"],
    "Uttar-Pradesh": ["Уттар-Прадеш", "Uttar Pradesh"], "Tamilnadu": ["Тамилнад", "Tamil Nadu"], "G'arbiy Bengaliya": ["Западная Бенгалия", "West Bengal"],
    # Pokiston
    "Panjob": ["Пенджаб", "Punjab"], "Sind": ["Синд", "Sindh"], "Xayber-Paxtunxva": ["Хайбер-Пахтунхва", "Khyber Pakhtunkhwa"], "Islomobod": ["Исламабад", "Islamabad"],
    # Afg'oniston
    "Kobul": ["Кабул", "Kabul"], "Balx": ["Балх", "Balkh"], "Hirot": ["Герат", "Herat"], "Qandahor": ["Кандагар", "Kandahar"],
    # Malayziya
    "Kuala-Lumpur": ["Куала-Лумпур", "Kuala Lumpur"], "Selangor": ["Селангор", "Selangor"], "Johor": ["Джохор", "Johor"], "Penang": ["Пинанг", "Penang"],
    # Indoneziya
    "Jakarta": ["Джакарта", "Jakarta"], "G'arbiy Yava": ["Западная Ява", "West Java"], "Sharqiy Yava": ["Восточная Ява", "East Java"], "Bali": ["Бали", "Bali"],
    # Turkiya
    "Istanbul": ["Стамбул", "Istanbul"], "Anqara": ["Анкара", "Ankara"], "Izmir": ["Измир", "Izmir"], "Bursa": ["Бурса", "Bursa"], "Antaliya": ["Анталья", "Antalya"],
    # BAA
    "Dubay": ["Дубай", "Dubai"], "Abu-Dabi": ["Абу-Даби", "Abu Dhabi"], "Sharja": ["Шарджа", "Sharjah"], "Ajmon": ["Аджман", "Ajman"],
    # Saudiya
    "Ar-Riyod": ["Эр-Рияд", "Riyadh"], "Makka": ["Мекка", "Makkah"], "Sharqiy viloyat": ["Восточная провинция", "Eastern Province"], "Madina": ["Медина", "Madinah"],
    # Eron
    "Tehron": ["Тегеран", "Tehran"], "Xuroson-Razaviy": ["Хорасан-Резави", "Razavi Khorasan"], "Isfahon": ["Исфахан", "Isfahan"],
    "Fors": ["Фарс", "Fars"], "Sharqiy Ozarbayjon": ["Восточный Азербайджан", "East Azerbaijan"],
    # Ozarbayjon
    "Boku": ["Баку", "Baku"], "Ganja": ["Гянджа", "Ganja"], "Sumqayit": ["Сумгаит", "Sumgait"], "Lankaron": ["Ленкорань", "Lankaran"],
    # Gruziya
    "Tbilisi": ["Тбилиси", "Tbilisi"], "Imereti": ["Имеретия", "Imereti"], "Ajariya": ["Аджария", "Adjara"], "Kvemo Kartli": ["Квемо-Картли", "Kvemo Kartli"],
    # Rossiya
    "Moskva": ["Москва", "Moscow"], "Sankt-Peterburg": ["Санкт-Петербург", "Saint Petersburg"], "Moskva viloyati": ["Московская область", "Moscow region"],
    "Tatariston": ["Татарстан", "Tatarstan"], "Novosibirsk viloyati": ["Новосибирская область", "Novosibirsk region"], "Sverdlovsk viloyati": ["Свердловская область", "Sverdlovsk region"],
    # Germaniya
    "Berlin": ["Берлин", "Berlin"], "Bavariya": ["Бавария", "Bavaria"], "Shimoliy Reyn-Vestfaliya": ["Северный Рейн-Вестфалия", "North Rhine-Westphalia"], "Gamburg": ["Гамбург", "Hamburg"],
    # Fransiya
    "Il-de-Frans": ["Иль-де-Франс", "Île-de-France"], "Provans-Alp-Kot-d'Azur": ["Прованс — Альпы — Лазурный Берег", "Provence-Alpes-Côte d'Azur"],
    "Overn-Ron-Alp": ["Овернь — Рона — Альпы", "Auvergne-Rhône-Alpes"],
    # Misr
    "Qohira": ["Каир", "Cairo"], "Iskandariya": ["Александрия", "Alexandria"], "Giza": ["Гиза", "Giza"],
}
data = json.load(open(sys.argv[1]))
need = set()
for r in data["rows"]:
    need.update(r[:4])
miss = sorted(need - set(N))
print("tarjimasi yo'q:", miss)
assert not miss
json.dump(N, open(sys.argv[2], "w"), ensure_ascii=False, separators=(",", ":"))
print(len(N), "ta nom")
