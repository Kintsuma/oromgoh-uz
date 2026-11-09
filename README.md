# Oromgoh.uz

Chorvoq bo'yidagi shartli dam olish oromgohi uchun o'quv loyihasi. Unda ikkita sayt bor:

- **Mehmonlar sayti.** Bu ochilganda birinchi chiqadigan sahifa. Mehmon ro'yxatdan o'tadi va keyin login hamda parol bilan kiradi. Saytda quyidagilar bor:
  - elektron hamyon: balans, qancha kunga yetishi, amal qilish muddati;
  - bron qilish va narxni hisoblash;
  - taomnoma va xonaga ovqat buyurtma qilish;
  - aksiyalar;
  - doimiy mijozlar uchun chegirmalar;
  - qulayliklar;
  - savol-javoblar va qabulxonaga xabar yuborish.
- **Xodimlar paneli** (yashirin kirish). Unda uchta daraja bor: Menejer, Xodim va Tozalovchi. Panelda:
  - qabulxona va 1000 ta xona xaritasi (yashil, sariq va qizil holatlar);
  - xodimlarni tasdiqlash;
  - mijozlar hamyoni, bron, buyurtma va xabarlar;
  - xizmatlar va narxlarni sozlash;
  - 2010–2026 yillar statistikasi, xaritalar, logistik regressiya, SVM, qaror daraxti, K-means va bashorat.

> Ma'lumotlar sintetik. Ular Airbnb ochiq datasetini kengaytirish orqali yaratilgan va haqiqiy shaxslarga tegishli emas.

## Ishga tushirish

**Jonli sayt:** https://kintsuma.github.io/oromgoh-uz/

`index.html` yagona fayl. Uni ikki xil joyda ochish mumkin:
- **claude.ai'da** (Artifact sifatida): ma'lumotlar umumiy bazada saqlanadi, mehmonlar va xodimlar bir-birining o'zgarishlarini ko'radi.
- **Oddiy brauzerda yoki GitHub Pages'da** sayt "namuna rejim"da ishlaydi: barcha funksiyalar ishlaydi, lekin ma'lumotlar faqat shu brauzerda saqlanadi. Saytda "Hammasini tozalash" tugmasi bor.

Xodimlar paneliga kirishning ikki yo'li bor:
- sahifa manzili oxiriga `#xodim` qo'shish;
- mehmonlar saytidagi "Oromgoh.uz" logotipini 2 soniya ichida 5 marta bosish.

## Ulashish huquqlari (claude.ai)

| Kim | Huquq | Nimani ko'radi |
|---|---|---|
| Menejer | sahifa egasi | hammasini |
| Xodim / Tozalovchi | Editor | menejer tasdiqlagandan keyin o'z darajasidagi panelni |
| Mehmon | Contributor | faqat mehmonlar saytini va o'z ma'lumotlarini |

Ma'lumotlar bazasi qoidalari sahifa e'lon qilinganda beriladi. To'liq ro'yxat `docs/` papkasidagi jadvalda.

## Tuzilish

```
index.html          tayyor sayt (build.py natijasi)
build.py            src/ dagi qismlardan index.html yig'adi
src/template.html   HTML va CSS shablon
src/*.js            i18n (uz/ru/en), statistika (app), ish jarayoni (ops), mehmonlar sayti (guest)
src/data/           statistika kubi, model koeffitsientlari, klasterlar, xaritalar
scripts/            datasetni kengaytirish, boyitish, modellar (Python), xarita yo'llari (Node)
data/               oromgoh_dataset.zip — kengaytirilgan dataset
docs/               rollar va kirish huquqlari jadvali
```

O'zgartirishdan keyin saytni qayta yig'ish:

```bash
python build.py
```
