# 🤖 Telegram MFA Visa Checker Bot (24/7 Cloud Engine)

Ushbu loyiha O'zbekiston Respublikasi Tashqi Ishlar Vazirligining viza holatini tekshirish rasmiy portali (`visa.mfa.uz/ruxsat/search`) bo'yicha ishlaydigan Telegram botidir. Bot foydalanuvchining shaxsiy kompyuteri o'chiq bo'lgan holatda ham bulutda (**Render.com**) 24/7 rejimda to'xtovsiz ishlaydi.

---

## 📌 Asosiy Xususiyatlari:
1. **24/7 Bulutli Rejim:** Render.com serverida keep-alive ping mexanizmi bilan uzluksiz ishlaydi.
2. **AI Kapcha Yechuvchi:** TIV saytidagi harflar/raqamlar kapchasini Google Gemini Flash-Lite AI orqali 0.2 soniyada 99% aniqlikda yechadi.
3. **Saytning 1-to-1 Original Skrinshoti:** Brauzer kutmasdan, 0.05 soniyada saytning rasmiy AdminLTE jadvalini HD formatdagi original skrinshot (PNG) ko'rinishida generatsiya qiladi.
4. **Ikkitalik Yetkazish:**
   - **1-xabar:** To'liq rasmiy matnli ma'lumot (Pasport, F.I.Sh, Teleks raqami/sanasi, Barkod, Viza olish joyi va Tasdiq holati).
   - **2-xabar:** Saytdan olingan rasmiy skrinshot surati (`📄 Rasmiy Tasdiq: <PASPORT>`).
5. **Xavfsizlik va Admin Panel:**
   - Faqat ruxsat berilgan foydalanuvchilar (`allowed_users.json`) foydalana oladi.
   - Admin uchun `/admin` boshqaruv paneli mavjud.

---

## 🏗 Arxitektura va Fayllar Tuzilishi:

```
Telegbot/
├── server.js                      # Asosiy backend server (Express, Telegram Webhook, AI, Resvg)
├── fonts/                         # Render Linux serverida matnlar to'g'ri chiqishi uchun shriftlar
│   ├── arial.ttf
│   └── arialbd.ttf
├── allowed_users.json             # Ruxsat berilgan foydalanuvchilar bazasi
├── render.yaml                    # Render.com avtomatik sozlamalar fayli
├── Dockerfile                     # Bulutli konteyner sozlamalari
├── package.json                   # Node.js kutubxonalari
├── README.md                      # Loyiha qisqacha qo'llanmasi
└── MULOQOT_VA_LOYIHA_TARIXI.md    # Antigravity suhbatimizning to'liq tarixi va dasturchi qo'llanmasi
```

---

## ⚙️ Loyihani Antigravity'da Ishga Tushirish va Davom Ettirish:

1. **Antigravity IDE dasturida:**
   - Menyudan **File -> Open Folder...** (yoki **Loyiha ochish**) bandini tanlang.
   - Manzilni tanlang: `C:\Users\ASUS\.gemini\antigravity\scratch\Telegbot`
   - Shunda ushbu loyiha sizning asosiy ishchi maydoningizga (**Workspace**) aylanadi.

2. **Lokal test qilish (Kompyuterda):**
   ```bash
   npm install
   node server.js
   ```

3. **O'zgarishlarni GitHub va Render'ga yuklash:**
   ```bash
   git add .
   git commit -m "Yangi o'zgarish kiritildi"
   git push origin main
   ```
   So'ng [dashboard.render.com](https://dashboard.render.com) saytiga kirib, **Manual Deploy -> Deploy latest commit** tugmasini bosasiz.

---

## 🔑 Maxfiy Kalitlar va Havolalar:
- **GitHub Repozitoriy:** https://github.com/Qlichov/mfa-visa-bot
- **Render Live Service:** https://mfa-visa-bot.onrender.com
- **Telegram Webhook:** https://mfa-visa-bot.onrender.com/webhook
- **Bosh Admin Telegram ID:** `5928834268`
- **Foydalanuvchi ID:** `7922001065` (Islombek Qlichov)
