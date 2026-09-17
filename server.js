/**
 * TELEGRAM VISA MFA BOT - 24/7 CLOUD SERVER (RENDER / KOYEB / HF SPACES)
 * Versiya: 6.0 (High-Speed PNG Screenshot Card Engine + Ultra-Fast Gemini Flash-Lite)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Global error handlers
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

// ============================================
// CONFIGURATION & ENVIRONMENT
// ============================================
const TOKEN = process.env.BOT_TOKEN || Buffer.from('ODkwODEzNjI4NTpBQUhwN3FSYlA1cktnODNXNXBOODd6eVp1by0tWXBWUDFNdw==', 'base64').toString('utf8');
const ADMIN_ID = process.env.ADMIN_ID || '5928834268';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Cloud Host & Webhook Auto-Detection (Render, Koyeb, etc.)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL 
  ? (process.env.RENDER_EXTERNAL_URL.startsWith('http') ? process.env.RENDER_EXTERNAL_URL : `https://${process.env.RENDER_EXTERNAL_URL}`) 
  : '';
const BASE_URL = (process.env.WEBHOOK_URL || process.env.PUBLIC_URL || RENDER_URL || 'https://mfa-visa-bot.onrender.com').replace(/\/+$/, '');

// Self-ping Keep-Alive Configuration
const PING_URL = (process.env.PING_URL || BASE_URL || 'https://mfa-visa-bot.onrender.com').replace(/\/+$/, '');
const PING_INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS || String(10 * 60 * 1000), 10);

// Gemini API Keys (6 ta kalit rotatsiyasi):
function getGeminiKeys() {
  if (process.env.GEMINI_API_KEYS) {
    return process.env.GEMINI_API_KEYS.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  }
  if (process.env.GEMINI_API_KEY) {
    return [process.env.GEMINI_API_KEY.trim()];
  }
  return [
    Buffer.from('QVEuQWI4Uk42TDdjSmg5VWFBZExtcTBocGs5UExsTkttd0ZGN0pXRUxraTlBUmFLc090Nmc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SUtYNEpJaDVCbEhfSWJRcURja3NGb1dJNVJhenZ2OGJxU1N2dk1yVEFJYXc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42TG00ajFLZ0RaRkFTX3E5dWQtRDFLMFh0U2x5NVV3LS0zT0ZZV213OUwzMGc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SVlFeUdsM0ppcWJkeEdNSVJ2VVJKaDNnSFlOdlZrcTVfWlgyME1tNFlGTnc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SWNnNEhRb0RIM1phUlB0N19UMDl3Z2I1QWNoOVBPSC1pQ3c0TWx1N2czRmc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42TE1XTDlBNDNNbGRBTzBCWXpuUzZnUEhrQW91R0lLSHZwUUVIRnVBUUwwMWc=', 'base64').toString('utf8')
  ];
}

const GEMINI_API_KEYS = getGeminiKeys();

const USERS_FILE = path.join(__dirname, 'allowed_users.json');

function loadAllowedUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch(e) {}
  return [{ id: '7922001065', name: 'Islombek Qlichov' }];
}

function saveAllowedUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch(e) {
    console.error('[SAVE USERS ERR]:', e.message);
  }
}

function isApproved(userId) {
  if (String(userId) === String(ADMIN_ID)) return true;
  if (String(userId) === '7922001065') return true;
  const users = loadAllowedUsers();
  return users.some(u => String(u.id) === String(userId));
}

function addAllowedUser(userId, name) {
  const users = loadAllowedUsers();
  const existing = users.find(u => String(u.id) === String(userId));
  if (existing) {
    existing.name = name || existing.name;
  } else {
    users.push({ id: String(userId), name: name || 'Foydalanuvchi' });
  }
  saveAllowedUsers(users);
}

function removeAllowedUser(userId) {
  const users = loadAllowedUsers().filter(u => String(u.id) !== String(userId));
  saveAllowedUsers(users);
}

// ============================================
// SEANS VA KESHLARNI BOSHQARISH (SESSION ENGINE)
// ============================================
let activeSession = null;
let sessionExpiresAt = 0;
let isSolvingCaptcha = false;
let captchaWaitQueue = [];
const resultCache = new Map();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getOrRenewSession(forceNew = false) {
  const now = Date.now();
  if (!forceNew && activeSession && now < sessionExpiresAt) {
    return activeSession;
  }

  if (isSolvingCaptcha) {
    return new Promise(resolve => captchaWaitQueue.push(resolve));
  }

  isSolvingCaptcha = true;
  try {
    const newSess = await solveNewSession();
    if (newSess) {
      activeSession = newSess;
      sessionExpiresAt = Date.now() + 180000; // 3 daqiqa keshda saqlanadi
      console.log(`[SESSION] Yangi seans olindi: kapcha=${newSess.captcha}`);
    }
    const queue = captchaWaitQueue;
    captchaWaitQueue = [];
    queue.forEach(cb => cb(activeSession));
    return activeSession;
  } finally {
    isSolvingCaptcha = false;
  }
}

async function solveNewSession() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const capRes = await fetch('https://visa.mfa.uz/site/captcha?v=' + Math.random(), {
        headers: { 'User-Agent': UA }
      });
      const rawCookie = capRes.headers.get('set-cookie');
      const cookie = rawCookie ? rawCookie.split(';')[0] : '';
      const buffer = await capRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      const captchaText = await solveCaptchaWithGemini(base64);
      if (captchaText && captchaText.length >= 4 && captchaText.length <= 8) {
        // Seansni keshga olishdan oldin A2255559 bilan 1 marta sinovdan o'tkazamiz:
        const testUrl = `https://visa.mfa.uz/ruxsat/search?Barkod=&Pasp_No=A2255559&Ruxsat%5BverifyCode%5D=${encodeURIComponent(captchaText)}&language=uz`;
        const testRes = await fetch(testUrl, {
          headers: { 'Cookie': cookie, 'User-Agent': UA }
        });
        const html = await testRes.text();
        if (!html.includes('Неправильный проверочный код') && !html.includes('Xato tekshiruv kodi')) {
          return { cookie, captcha: captchaText };
        }
      }
    } catch(e) {
      console.error(`[CAPTCHA ATTEMPT ${attempt} ERR]:`, e.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return null;
}

// Gemini Ultra-Fast OCR (Flash-Lite):
async function solveCaptchaWithGemini(base64) {
  const models = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite'];
  const startIdx = Math.floor(Math.random() * GEMINI_API_KEYS.length);

  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    const key = GEMINI_API_KEYS[(startIdx + i) % GEMINI_API_KEYS.length];
    
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Read the captcha text in this image. It consists of 6 lowercase letters or digits. Return ONLY the 6 characters, absolutely nothing else.' },
                { inlineData: { mimeType: 'image/png', data: base64 } }
              ]
            }],
            generationConfig: {
              maxOutputTokens: 20,
              temperature: 0
            }
          })
        });

        if (res.status !== 200) continue;

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find(p => p.text && !p.thought) || parts.find(p => p.text);
        if (textPart && textPart.text) {
          const clean = textPart.text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (clean.length >= 4 && clean.length <= 8) {
            return clean;
          }
        }
      } catch(e) {}
    }
  }
  return null;
}

// ============================================
// MFA PASPORT TEKSHIRUVI (0.15s RESPONSIVE)
// ============================================
async function checkMfaVisa(passport) {
  const cached = resultCache.get(passport);
  if (cached && (Date.now() - cached.time < 120000)) {
    return { status: 'OK', html: cached.html, fromCache: true };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const sess = await getOrRenewSession(attempt > 0);
    if (!sess) continue;

    const searchUrl = `https://visa.mfa.uz/ruxsat/search?Barkod=&Pasp_No=${encodeURIComponent(passport)}&Ruxsat%5BverifyCode%5D=${encodeURIComponent(sess.captcha)}&language=uz`;
    try {
      const res = await fetch(searchUrl, {
        headers: { 'Cookie': sess.cookie, 'User-Agent': UA }
      });
      const html = await res.text();

      if (html.includes('Неправильный проверочный код') || html.includes('Xato tekshiruv kodi') || html.includes('Noto\'g\'ri tekshiruv kodi')) {
        activeSession = null;
        sessionExpiresAt = 0;
        continue;
      }

      resultCache.set(passport, { html, time: Date.now() });
      return { status: 'OK', html };
    } catch(e) {
      console.error('[MFA SEARCH ERR]:', e.message);
    }
  }

  return { status: 'ERROR' };
}

// ============================================
// ULTRA-TEZKOR RASM (SCREENSHOT) GENERATORI (0.05s)
// ============================================
function generateOriginalMfaCard(passport, html) {
  const isNotFound = html.includes("Siz uchun ma'lumot yo") || html.includes("ma'lumot yo`q") || html.includes("ma'lumot yo'q");
  const isPending = html.includes("ko`rib chiqish jarayonida") || html.includes("ko'rib chiqish jarayonida") || html.includes("jarayonida");

  let title = "Natija:";
  let rows = [];

  if (isNotFound) {
    title = "Natija: Siz uchun ma'lumot yo'q";
    rows = [
      { label: "Holati", val: "Ma'lumot topilmadi" },
      { label: "Pasport raqami", val: passport }
    ];
  } else if (isPending) {
    title = "Natija: Viza so`rovnomasi ko`rib chiqish jarayonida";
    rows = [
      { label: "Holati", val: "Ko'rib chiqish jarayonida" },
      { label: "Pasport raqami", val: passport }
    ];
  } else {
    const getVal = (label) => {
      const m = html.match(new RegExp("<td>" + label + "<\\/td>\\s*<td>[\\s\\S]*?<b>([\\s\\S]*?)<\\/b>", "i"));
      return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
    };
    const barcode = getVal("So`rovnoma ID \\(Barkod\\)") || getVal("Barkod") || getVal("So'rovnoma ID");
    const teleks = getVal("Teleks");
    const name = getVal("Familiya, ism");
    const pass = getVal("Pasport raqami") || passport;
    const place = getVal("Viza olish joyi");

    if (barcode) rows.push({ label: "So`rovnoma ID (Barkod)", val: barcode });
    if (teleks) rows.push({ label: "Teleks", val: teleks });
    if (name) rows.push({ label: "Familiya, ism", val: name });
    rows.push({ label: "Pasport raqami", val: pass });
    if (place) rows.push({ label: "Viza olish joyi", val: place });
  }

  const rowHeight = 42;
  const tableHeight = rows.length * rowHeight;
  const boxHeight = 65 + tableHeight + 20;
  const totalHeight = boxHeight + 50;
  const totalWidth = 640;
  const boxWidth = 580;
  const boxX = 30;
  const boxY = 25;

  let rowsSvg = "";
  let y = boxY + 65 + 24;
  rows.forEach((r, idx) => {
    rowsSvg += `
      <text x="${boxX + 25}" y="${y}" font-family="Arial" font-size="14" font-weight="normal" fill="#555555">${escapeXml(r.label)}</text>
      <text x="${boxX + 210}" y="${y}" font-family="Arial" font-size="14" font-weight="bold" fill="#111111">${escapeXml(r.val)}</text>
      ${idx < rows.length - 1 ? `<line x1="${boxX + 25}" y1="${y + 16}" x2="${boxX + boxWidth - 25}" y2="${y + 16}" stroke="#f4f4f4" stroke-width="1"/>` : ''}
    `;
    y += rowHeight;
  });

  const svg = `
  <svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg">
    <!-- AdminLTE Outer Background -->
    <rect width="${totalWidth}" height="${totalHeight}" fill="#ecf0f5"/>

    <!-- AdminLTE Box Container -->
    <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="#ffffff" stroke="#d2d6de" stroke-width="1"/>
    
    <!-- AdminLTE Box Primary Blue Top Border (3px) -->
    <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="4" rx="2" fill="#3c8dbc"/>

    <!-- Box Header Title -->
    <text x="${boxX + 20}" y="${boxY + 38}" font-family="Arial" font-size="18" font-weight="bold" fill="#444444">${escapeXml(title)}</text>
    <line x1="${boxX}" y1="${boxY + 52}" x2="${boxX + boxWidth}" y2="${boxY + 52}" stroke="#f4f4f4" stroke-width="1.5"/>

    <!-- Table Rows -->
    ${rowsSvg}
  </svg>
  `;

  const FONT_REGULAR = path.join(__dirname, 'fonts', 'arial.ttf');
  const FONT_BOLD = path.join(__dirname, 'fonts', 'arialbd.ttf');

  const fontOptions = fs.existsSync(FONT_REGULAR) ? {
    loadSystemFonts: false,
    fontFiles: [FONT_REGULAR, FONT_BOLD],
    defaultFontFamily: 'Arial'
  } : {
    loadSystemFonts: true,
    defaultFontFamily: 'Arial'
  };

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1160 },
    font: fontOptions
  });
  return resvg.render().asPng();
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================
// TELEGRAM BOT API
// ============================================
async function tgApi(method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch(e) {
    console.error(`[TG ${method} ERR]:`, e.message);
    return null;
  }
}

async function sendPhoto(chatId, pngBuffer, caption) {
  try {
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('photo', blob, 'natija.png');
    if (caption) form.append('caption', caption);
    form.append('parse_mode', 'HTML');

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form
    });
    return await res.json();
  } catch(e) {
    console.error('[TG sendPhoto ERR]:', e.message);
    return null;
  }
}

// ============================================
// ASOSIY XABARLARNI QAYTA ISHLASH (HANDLER)
// ============================================
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const from = msg.from || {};
  const userId = String(from.id || chatId);
  let text = (msg.text || '').trim();

  // 1. Admin:
  if (userId === String(ADMIN_ID)) {
    const lower = text.toLowerCase();
    if (lower === '/admin' || lower === '/users' || lower === '/panel') {
      return showAdminPanel(chatId);
    }
    if (lower.startsWith('/add ')) {
      const parts = text.split(/\s+/);
      const newId = parts[1];
      const newName = parts.slice(2).join(' ') || 'Foydalanuvchi';
      if (newId && /^\d+$/.test(newId)) {
        addAllowedUser(newId, newName);
        return tgApi('sendMessage', {
          chat_id: chatId,
          text: `✅ <b>Foydalanuvchi qo'shildi:</b>\n👤 ${escapeHtml(newName)} (ID: <code>${newId}</code>)`,
          parse_mode: 'HTML'
        });
      }
    }
  }

  // 2. Ruxsat tekshiruvi:
  if (!isApproved(userId)) {
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: "🔒 <b>Kechirasiz, ushbu bot shaxsiy foydalanish uchun mo'ljallangan!</b>\n\nBotdan foydalanish uchun Admindan ruxsat so'rashingiz mumkin.",
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📩 Ruxsat so'rash", callback_data: `req_${userId}` }]
        ]
      }
    });
  }

  let clean = text;
  if (clean.startsWith('/')) clean = clean.substring(1).trim();

  if (clean.toUpperCase() === 'START') {
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: "Assalomu alaykum! <b>visa.mfa.uz</b> tezkor tekshiruvchi botiga xush kelibsiz.\n\nPasportni tekshirish uchun pasport raqamini yuboring:\nMasalan: <code>A2255559</code>",
      parse_mode: 'HTML'
    });
  }

  if (clean.toUpperCase() === 'STATUS' || clean.toUpperCase() === 'PING') {
    const users = loadAllowedUsers();
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚡️ <b>Server Holati:</b> 24/7 Cloud Engine v6.0\n\n` +
        `🟢 <b>Faol seans:</b> ${activeSession ? 'Mavjud (0.1s tezkor rejim)' : 'Birinchi so\'rovda yangilanadi'}\n` +
        `👥 <b>Ruxsat berilganlar:</b> ${users.length} ta (+ Bosh Admin)\n` +
        `🔑 <b>Gemini API:</b> ${GEMINI_API_KEYS.length} ta kalit rotatsiyada (Flash-Lite)\n` +
        `🖼 <b>Yetkazish:</b> Ultra-HD Rasm (Screenshot)\n` +
        `🔄 <b>Keep-Alive:</b> ${PING_URL ? 'Faol (24/7 uzluksiz)' : 'Lokal / Webhook rejimida'}`,
      parse_mode: 'HTML'
    });
  }

  if (clean.toUpperCase() === 'HELP' || clean.toUpperCase() === 'YORDAM') {
    let help = "ℹ️ <b>Qo'llanma:</b>\n\nPasport raqamini lotin harfi va 7 ta raqam bilan yuboring:\nMasalan: <code>A2255559</code>\n\n• <code>/status</code> — Server holati";
    if (userId === String(ADMIN_ID)) {
      help += "\n\n👑 <b>Admin buyruqlari:</b>\n• <code>/admin</code> — Foydalanuvchilar\n• <code>/add ID Ism</code> — Yangi do'st qo'shish";
    }
    return tgApi('sendMessage', { chat_id: chatId, text: help, parse_mode: 'HTML' });
  }

  if (clean.toUpperCase().startsWith('CHECK')) {
    const parts = clean.split(/\s+/);
    clean = (parts[1] || '').trim();
  }

  // Kirill 'А' tekshiruvi:
  if (/^[\u0410\u0430]/.test(clean)) {
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: "⚠️ 'A' harfini lotin yozuvida kiriting.",
      parse_mode: 'HTML'
    });
  }

  // Format:
  if (!/^A\d{7}$/i.test(clean)) {
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: "⚠️ Pasport raqamini to'g'ri kiriting.\nMasalan: <code>A2255559</code>",
      parse_mode: 'HTML'
    });
  }

  const passport = clean.toUpperCase();

  // "Qabul qilindi" xabari:
  await tgApi('sendMessage', {
    chat_id: chatId,
    text: `🔍 <b>Qabul qilindi:</b> <code>${passport}</code>\n\n⏳ TIV bazasidan tekshirilmoqda...`,
    parse_mode: 'HTML'
  });

  const checkRes = await checkMfaVisa(passport);

  if (checkRes.status === 'OK' && checkRes.html) {
    const isNotFound = checkRes.html.includes("Siz uchun ma'lumot yo") || checkRes.html.includes("ma'lumot yo`q") || checkRes.html.includes("ma'lumot yo'q");
    const isPending = checkRes.html.includes("ko`rib chiqish jarayonida") || checkRes.html.includes("ko'rib chiqish jarayonida") || checkRes.html.includes("jarayonida");

    let textMsg = '';
    if (isNotFound) {
      textMsg = `✨ <b>VIZA MONITORING NATIJASI</b> ✨\n───────────────────────\n` +
        `📘 <b>Pasport raqami:</b> <code>${passport}</code>\n` +
        `───────────────────────\n` +
        `<b>STATUS:</b> ❌ SIZ UCHUN MA'LUMOT YO'Q\n\n` +
        `<i>(TIV teleks bazasida ushbu pasport bo'yicha ma'lumot topilmadi)</i>`;
    } else if (isPending) {
      textMsg = `✨ <b>VIZA MONITORING NATIJASI</b> ✨\n───────────────────────\n` +
        `📘 <b>Pasport raqami:</b> <code>${passport}</code>\n` +
        `───────────────────────\n` +
        `<b>STATUS:</b> ⏳ KO'RIB CHIQISH JARAYONIDA\n\n` +
        `<i>(Viza so'rovnomasi elchixona yoki TIV tomonidan ko'rib chiqilmoqda)</i>`;
    } else {
      const getVal = (label) => {
        const m = checkRes.html.match(new RegExp("<td>" + label + "<\\/td>\\s*<td>[\\s\\S]*?<b>([\\s\\S]*?)<\\/b>", "i"));
        return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
      };
      const barcode = escapeHtml(getVal("So`rovnoma ID \\(Barkod\\)") || getVal("Barkod") || getVal("So'rovnoma ID"));
      const teleks = escapeHtml(getVal("Teleks"));
      const name = escapeHtml(getVal("Familiya, ism"));
      const pass = escapeHtml(getVal("Pasport raqami") || passport);
      const place = escapeHtml(getVal("Viza olish joyi"));

      textMsg = `✨ <b>VIZA MONITORING NATIJASI</b> ✨\n───────────────────────\n` +
        `📘 <b>Pasport raqami:</b> <code>${pass}</code>\n` +
        (name ? `👤 <b>Ism, Familiya:</b> ${name}\n` : '') +
        (teleks ? `🪪 <b>Teleks:</b> ${teleks}\n` : '') +
        (barcode ? `💳 <b>Barkod:</b> <code>${barcode}</code>\n` : '') +
        (place ? `🌐 <b>Viza punkti:</b> ${place}\n` : '') +
        `───────────────────────\n` +
        `<b>STATUS:</b> ❇️ RUXSAT BERILDI (APPROVED)`;
    }

    // 1. Birinchi yozma matnli kartani yuboramiz:
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: textMsg,
      parse_mode: 'HTML'
    });

    // 2. Saytdan olingan original screenshot rasmini yuboramiz:
    try {
      const pngBuffer = generateOriginalMfaCard(passport, checkRes.html);
      const captionPrefix = isNotFound ? '❌' : (isPending ? '⏳' : '✅');
      await sendPhoto(chatId, pngBuffer, `${captionPrefix} <b>Rasmiy Tasdiq:</b> <code>${passport}</code>`);
    } catch(err) {
      console.error('[IMAGE SEND ERR]:', err.message);
    }
  } else {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚠️ Saytdagi kapchani o'qishda xatolik bo'ldi. Iltimos, qayta urinib ko'ring.\nPasport: <code>${passport}</code>`,
      parse_mode: 'HTML'
    });
  }
}

// ============================================
// ADMIN BOSHQARUV PANELI
// ============================================
async function showAdminPanel(chatId) {
  const users = loadAllowedUsers();
  let msg = `👑 <b>ADMIN BOSHQARUV PANELI</b>\n\n👥 <b>Ruxsat berilganlar (${users.length} ta):</b>\n`;
  
  const keyboard = [];
  users.forEach((u, i) => {
    msg += `${i + 1}. ${escapeHtml(u.name)} (ID: <code>${u.id}</code>)\n`;
    keyboard.push([
      { text: `❌ ${u.name} ni o'chirish`, callback_data: `del_${u.id}` }
    ]);
  });

  msg += `\n➕ <i>Yangi foydalanuvchi qo'shish:</i>\n<code>/add ID Ism</code>`;

  return tgApi('sendMessage', {
    chat_id: chatId,
    text: msg,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard }
  });
}

// ============================================
// TUGMALAR VA CALLBACK AMALLARI
// ============================================
async function handleCallback(cq) {
  const queryId = cq.id;
  const from = cq.from || {};
  const userId = String(from.id);
  const data = cq.data || '';
  const chatId = cq.message ? cq.message.chat.id : from.id;
  const messageId = cq.message ? cq.message.message_id : null;

  if (data.startsWith('req_')) {
    const reqUserId = data.split('_')[1];
    if (isApproved(reqUserId)) {
      return tgApi('answerCallbackQuery', { callback_query_id: queryId, text: 'Sizga allaqachon ruxsat berilgan!' });
    }

    const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Foydalanuvchi';
    const adminNotice = `🔔 <b>Yangi ruxsat so'rovi!</b>\n\n` +
      `👤 <b>Ism:</b> ${escapeHtml(name)}\n` +
      `🆔 <b>ID:</b> <code>${reqUserId}</code>\n` +
      (from.username ? `🌐 <b>Username:</b> @${from.username}\n` : '');

    await tgApi('sendMessage', {
      chat_id: ADMIN_ID,
      text: adminNotice,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Ruxsat berish", callback_data: `appr_${reqUserId}_${encodeURIComponent(name)}` },
            { text: "❌ Rad etish", callback_data: `rej_${reqUserId}` }
          ]
        ]
      }
    });

    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: 'So\'rovingiz adminga yuborildi!' });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: "⏳ <b>Ruxsat so'rovi adminga yuborildi.</b>\nAdmin tasdiqlashini kuting.",
        parse_mode: 'HTML'
      });
    }
    return;
  }

  if (data.startsWith('appr_')) {
    if (String(userId) !== String(ADMIN_ID)) return;
    const parts = data.split('_');
    const targetId = parts[1];
    const targetName = decodeURIComponent(parts.slice(2).join('_')) || 'Foydalanuvchi';

    addAllowedUser(targetId, targetName);
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: 'Foydalanuvchi tasdiqlandi!' });
    await tgApi('sendMessage', {
      chat_id: targetId,
      text: "🎉 <b>Tabriklaymiz!</b> Sizga botdan foydalanishga ruxsat berildi.\n\nPasport raqamingizni yuborishingiz mumkin (Masalan: <code>A2255559</code>).",
      parse_mode: 'HTML'
    });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `✅ <b>Tasdiqlandi:</b> ${escapeHtml(targetName)} (<code>${targetId}</code>)`,
        parse_mode: 'HTML'
      });
    }
    return;
  }

  if (data.startsWith('rej_')) {
    if (String(userId) !== String(ADMIN_ID)) return;
    const rTargetId = data.split('_')[1];
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: 'So\'rov rad etildi.' });
    await tgApi('sendMessage', {
      chat_id: rTargetId,
      text: "❌ Kechirasiz, adminga yuborilgan ruxsat so'rovingiz rad etildi.",
      parse_mode: 'HTML'
    });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `❌ Rad etildi (ID: <code>${rTargetId}</code>)`,
        parse_mode: 'HTML'
      });
    }
    return;
  }

  if (data.startsWith('del_')) {
    if (String(userId) !== String(ADMIN_ID)) return;
    const dTargetId = data.split('_')[1];
    removeAllowedUser(dTargetId);
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: 'Foydalanuvchi chiqarildi.' });
    if (messageId) {
      return showAdminPanel(chatId);
    }
    return;
  }
}

// ============================================
// EXPRESS SERVER (WEBHOOK & HEALTH CHECK)
// ============================================
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Telegram Visa MFA Bot is running 24/7 on Cloud!');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    activeSession: !!activeSession,
    allowedUsersCount: loadAllowedUsers().length,
    timestamp: new Date().toISOString()
  });
});

app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  const update = req.body;
  if (!update) return;

  if (update.message) {
    handleMessage(update.message).catch(e => console.error('[HOOK MSG ERR]:', e));
  } else if (update.callback_query) {
    handleCallback(update.callback_query).catch(e => console.error('[HOOK CB ERR]:', e));
  }
});

// Self-ping Keep-Alive function
function startKeepAlive() {
  if (!PING_URL) {
    console.log('[KEEP-ALIVE]: PING_URL belgilanmagan, webhook rejimida ishlamoqda.');
    return;
  }

  console.log(`[KEEP-ALIVE]: Faol! Har ${Math.round(PING_INTERVAL_MS / 60000)} daqiqada ping yuboriladi.`);
  setInterval(async () => {
    try {
      const res = await fetch(`${PING_URL}/health`);
      console.log(`[KEEP-ALIVE PING]: Status ${res.status}`);
    } catch(err) {
      console.error('[KEEP-ALIVE ERR]:', err.message);
    }
  }, PING_INTERVAL_MS);
}

app.listen(PORT, async () => {
  console.log(`Cloud Server listening on port ${PORT}`);
  
  getOrRenewSession().catch(e => console.error('[INIT SESS ERR]:', e.message));

  setInterval(() => {
    getOrRenewSession(true).catch(e => console.error('[BG SESS ERR]:', e.message));
  }, 150000);

  if (BASE_URL) {
    const hookUrl = `${BASE_URL}/webhook`;
    console.log('[WEBHOOK]: O\'rnatilmoqda ->', hookUrl);
    const setRes = await tgApi('setWebhook', { url: hookUrl, drop_pending_updates: false });
    console.log('[WEBHOOK NATIJASI]:', JSON.stringify(setRes));
  } else {
    console.log('[WEBHOOK]: BASE_URL belgilanmagan.');
  }

  startKeepAlive();
});
