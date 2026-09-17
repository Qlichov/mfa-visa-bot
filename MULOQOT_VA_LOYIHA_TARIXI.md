# 📜 ANTIGRAVITY SUHBAT VA LOYIHA TARIXI (Telegbot Project)

Ushbu hujjat Antigravity AI va foydalanuvchi o'rtasida olib borilgan barcha suhbatlar, qabul qilingan texnik qarorlar, yuzaga kelgan muammolar va ularning yechimlari to'plamidir. Kelajakda loyihani takomillashtirishda ushbu ma'lumotlar qo'llanma bo'lib xizmat qiladi.

---

## 1. Loyihaning Boshlang'ich Maqsadi va Talablar:
- **Asosiy vazifa:** `visa.mfa.uz/ruxsat/search` portali orqali O'zbekiston vizasi (Teleks ruxsati) holatini tekshiruvchi Telegram bot yaratish.
- **24/7 Sharti:** Foydalanuvchining kompyuteri doim o'chiq bo'lgani sababli, bot to'liq onlayn bulutli serverda uzluksiz ishlab turishi shart.
- **Kapcha muammosi:** Sayt har bir so'rovda qiyshiq harflar/raqamlardan iborat kapcha talab qiladi.
- **Format talabi:** 
  1. Birinchi xabarda yozma to'liq ma'lumot (Pasport, Ism, Teleks, Barkod, Viza joyi, Holati).
  2. Ikkinchi xabarda saytdan olingan 1-to-1 original skrinshot (AdminLTE oq-kulrang jadvali).
  3. PDF formatdan butunlay voz kechish (tezlikni oshirish uchun).

---

## 2. Bosqichma-bosqich Qilingan Ishlar:

### A. Kapchani AI orqali Yechish:
- Google Gemini `gemini-flash-lite-latest` va `gemini-3.5-flash-lite` modellari ulandi.
- Kapcha rasmi yuklab olinib, base64 formatda Gemini'ga uzatiladi.
- Gemini uni 0.2 soniyada yechadi.
- 3 daqiqalik sessiya keshlandi (har safar yangi kapcha so'ramaslik uchun).

### B. Bulutli Hosting (Render.com) va Webhook:
- GitHub repozitoriyasi yaratildi: `https://github.com/Qlichov/mfa-visa-bot`
- Render.com bepul Web Service ulandi: `https://mfa-visa-bot.onrender.com`
- Telegram Webhook o'rnatildi: `https://mfa-visa-bot.onrender.com/webhook`
- Keep-Alive (o'z-o'ziga ping yuborish) mexanizmi ulandi, natijada Render serveri 24/7 uxlamaydi.

### C. 1-to-1 Original Skrinshot Generatori (@resvg/resvg-js):
- Saytning original HTML/CSS AdminLTE stili SVG formatida chizildi:
  - Fon: `#ecf0f5`
  - Asosiy oq blok: `#ffffff`, hoshiyasi `#d2d6de`
  - Yuqori ko'k chiziq: `#3c8dbc`
  - Sarlavha: `Natija:`
- Linux serverida harflar yo'qolib qolmasligi uchun loyihaga `fonts/arial.ttf` va `fonts/arialbd.ttf` shriftlari biriktirildi.
- Tezlik: 0.05 soniyada tayyor bo'ladi.

### D. Foydalanuvchilar Boshqaruvi:
- `allowed_users.json` orqali faqat ruxsat berilgan shaxslar botdan foydalanishi ta'minlandi.
- Notanish foydalanuvchilar uchun "Admindan ruxsat so'rash" tugmasi ishlaydi.
- Admin uchun `/admin` boshqaruv paneli mavjud.

---

## 3. TIV Viza Tizimi Haqida Maxsus O'rganishlar:
- Saytda ko'rsatiladigan ma'lumotlar:
  - So'rovnoma ID (Barkod)
  - Teleks (Raqam va sana)
  - Familiya, ism (baza ichiga nima kiritilgan bo'lsa o'sha)
  - Pasport raqami
  - Viza olish joyi (Elchixona)
- Viza muddati, toifasi (turizm, ishchi) va multiviza ma'lumotlari nima uchun ochiq saytda yo'q?
  - Teleks — bu vizaning o'zi emas, balki TIVning elchixonaga bergan ruxsatnomasi.
  - Viza muddati va toifalari TIVning ichki yopiq "E-Konsul" diplomatik tarmog'ida va elchixona tizimida bo'ladi. Ochiq saytda shaxsiy ma'lumotlar xavfsizligi sababli ko'rsatilmaydi.

---

## 4. Loyihani Kelajakda Qanday Rivojlantirish Mumkin:
1. **Avto-Monitoring (Kuzatuv):** Foydalanuvchi pasportini kiritib qo'ysa, har 1 soatda bot o'zi tekshirib, viza tasdiqlanishi bilan Telegram'ga xabar yuborishi mumkin.
2. **Excel fayl orqali tekshirish:** Bir vaqtning o'zida 50-100 ta pasport ro'yxatini yuklab, bir zumda jadval qilib berish.
3. **Multi-Bot:** Bitta Render servisining o'zida bir nechta boshqa botlarni parallel yurgizish.
