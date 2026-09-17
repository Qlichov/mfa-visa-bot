/**
 * TELEGRAM VISA MFA BOT - 24/7 CLOUD SERVER (RENDER / KOYEB / HF SPACES)
 * Versiya: 5.2 (Production Cloud Webhook Engine with Auto Keep-Alive)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Global error handlers to guarantee 24/7 container uptime
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

// ============================================
// CONFIGURATION & ENVIRONMENT
// ============================================
const TOKEN = process.env.BOT_TOKEN || Buffer.from('ODkwODEzNjI4NTpBQUhwN3FSYlA1cktnODNXNXBOODd6eVZ1by0tWXBZUDEtTXc=', 'base64').toString('utf8');
const ADMIN_ID = process.env.ADMIN_ID || '5928834268';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Cloud Host & Webhook Auto-Detection (Render, Koyeb, HF Spaces, etc.)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL 
  ? (process.env.RENDER_EXTERNAL_URL.startsWith('http') ? process.env.RENDER_EXTERNAL_URL : `https://${process.env.RENDER_EXTERNAL_URL}`) 
  : '';
const BASE_URL = (process.env.WEBHOOK_URL || process.env.PUBLIC_URL || RENDER_URL || '').replace(/\/+$/, '');

// Self-ping Keep-Alive Configuration (pings /health every 10 min to never sleep on Render free tier)
const PING_URL = (process.env.PING_URL || BASE_URL).replace(/\/+$/, '');
const PING_INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS || String(10 * 60 * 1000), 10);

// Gemini API Keys:
const defaultEncodedKeys = [
  'QVEuQWI4Uk42TDdjSmg5VWFBZExtcTBocGs5UExsTkttd0ZGN0pXRUxraTlB苦aKsOt6g==',
  'QVEuQWI4Uk42SUtYNEpJaDVCbEhfSWJRcERja3NGb1dJNVIhenZ2OGJxU1N2dk1yVEFJYXc=',
  'QVEuQWI4Uk42TG00ajFLZ0RaRkFTX3E5dWQtRDFLMFh0U2x5NVV3LS0zT0ZZV213OUwzMGc=',
  'QVEuQWI4Uk42SVlFeUdsM0ppcWJkeEdNSVJ2VVJKaDNnSFlOdlZrcTVfWlgyME1tNFlGTnc=',
  'QVEuQWI4Uk42SWNnNEhRb0RIM1phUlB0N19UMDl3Z2I1QWNoOVBPSEgtaUN3NE1sdTdnM0Zn==',
  'QVEuQWI4Uk42TE1XTDlBNDNNbGRBTzBCWXpuUzZnUEhrQW91R0lLSGhwUUVIRnVBUUwwMWc='
];

function getGeminiKeys() {
  if (process.env.GEMINI_API_KEYS) {
    return process.env.GEMINI_API_KEYS.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  }
  if (process.env.GEMINI_API_KEY) {
    return [process.env.GEMINI_API_KEY.trim()];
  }
  return [
    Buffer.from('QVEuQWI4Uk42TDdjSmg5VWFBZExtcTBocGs5UExsTkttd0ZGN0pXRUxraTlBUmFLc090Nmc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SUtYNEpJaDVCbEhfSWJRcERja3NGb1dJNVIhenZ2OGJxU1N2dk1yVEFJYXc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42TG00ajFLZ0RaRkFTX3E5dWQtRDFLMFh0U2x5NVV3LS0zT0ZZV213OUwzMGc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SVlFeUdsM0ppcWJkeEdNSVJ2VVJKaDNnSFlOdlZrcTVfWlgyME1tNFlGTnc=', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42SWNnNEhRb0RIM1phUlB0N19UMDl3Z2I1QWNoOVBPSEgtaUN3NE1sdTdnM0Zn', 'base64').toString('utf8'),
    Buffer.from('QVEuQWI4Uk42TE1XTDlBNDNNbGRBTzBCWXpuUzZnUEhrQW91R0lLSGZwUUVIRnVBUUwwMWc=', 'base64').toString('utf8')
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
      sessionExpiresAt = Date.now() + 180000; // 3 daqiqa amal qiladi
      console.log(`[SESSION] Yangi seans keshga olindi: kapcha=${newSess.captcha}`);
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
    await new Promise(r => setTimeout(r, 250));
  }
  return null;
}

// Gemini Ultra-Fast OCR (Flash-Lite / Flash):
async function solveCaptchaWithGemini(base64) {
  const models = ['gemini-flash-lite-latest', 'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
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
                { text: 'Read the 6 or 7 characters in this captcha image. Return ONLY the lowercase characters, no spaces, no punctuation.' },
                { inlineData: { mimeType: 'image/png', data: base64 } }
              ]
            }],
            generationConfig: {
              maxOutputTokens: 60,
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
// CHIROYLI FORMATLANGAN MATN KARTASI
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatResultText(passport, html) {
  const getVal = function(label) {
    const regex = new RegExp('<td>' + label + '<\\/td>\\s*<td>[\\s\\S]*?<b>([\\s\\S]*?)<\\/b>', 'i');
    const m = html.match(regex);
    return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
  };
  
  const barcode = escapeHtml(getVal('So`rovnoma ID \\(Barkod\\)') || getVal('Barkod') || getVal('So\'rovnoma ID'));
  const teleks = escapeHtml(getVal('Teleks'));
  const name = escapeHtml(getVal('Familiya, ism'));
  const pass = escapeHtml(getVal('Pasport raqami') || passport);
  const place = escapeHtml(getVal('Viza olish joyi'));
  
  if (!name && !teleks && !barcode) {
    return `📄 <b>Natija:</b> <code>${pass}</code>\n\n✅ <b>Viza tasdiqlangan!</b>\n<i>(Batafsil ma'lumot bazada mavjud)</i>`;
  }
  
  return `📋 <b>VIZA NATIJASI</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📄 <b>Pasport:</b> <code>${pass}</code>\n` +
    (name ? `👤 <b>Familiya, ism:</b> ${name}\n` : '') +
    (teleks ? `📑 <b>Teleks:</b> ${teleks}\n` : '') +
    (barcode ? `🔢 <b>Barkod:</b> <code>${barcode}</code>\n` : '') +
    (place ? `🏛 <b>Viza olish joyi:</b> ${place}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ <b>Holati:</b> Tasdiqlangan (Ruxsat berilgan)`;
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
          text: `✅ <b>Foydalanuvchi muvaffaqiyatli qo'shildi:</b>\n👤 ${escapeHtml(newName)} (ID: <code>${newId}</code>)`,
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
      text: `⚡️ <b>Server Holati:</b> 24/7 Cloud Engine v5.2\n\n` +
        `🟢 <b>Faol seans:</b> ${activeSession ? 'Mavjud (0.15s tezkor rejim)' : 'Birinchi so\'rovda yangilanadi'}\n` +
        `👥 <b>Ruxsat berilganlar:</b> ${users.length} ta (+ Bosh Admin)\n` +
        `🔑 <b>Gemini API:</b> ${GEMINI_API_KEYS.length} ta kalit rotatsiyada (Flash-Lite)\n` +
        `🔄 <b>Keep-Alive:</b> ${PING_URL ? 'Faol (Render 24/7 rejimda)' : 'Lokal / Polling rejimida'}\n` +
        `🚀 <b>Quvvat:</b> Cheklovlarsiz parallel rejim`,
      parse_mode: 'HTML'
    });
  }

  if (clean.toUpperCase() === 'HELP' || clean.toUpperCase() === 'YORDAM') {
    let help = "ℹ️ <b>Qo'llanma:</b>\n\nPasport raqamini yuboring:\nMasalan: <code>A2255559</code> yoki <code>/A2255559</code>\n<i>(Katta-kichik, lotin yoki kirill 'A' harfi avtomatik to'g'rilanadi)</i>";
    if (userId === String(ADMIN_ID)) {
      help += "\n\n👑 <b>Admin buyruqlari:</b>\n• <code>/admin</code> — Boshqaruv paneli\n• <code>/add &lt;ID&gt; &lt;Ism&gt;</code> — Yangi foydalanuvchi qo'shish";
    }
    return tgApi('sendMessage', { chat_id: chatId, text: help, parse_mode: 'HTML' });
  }

  if (clean.toUpperCase().startsWith('CHECK')) {
    clean = clean.split(/\s+/)[1] || '';
  }

  clean = clean.replace(/^[\u0410\u0430Aa]/, 'A').toUpperCase();

  if (!/^A\d{7}$/.test(clean)) {
    return tgApi('sendMessage', {
      chat_id: chatId,
      text: "⚠️ Pasport raqamini to'g'ri kiriting.\nMasalan: <code>A2255559</code>",
      parse_mode: 'HTML'
    });
  }

  const passport = clean;
  await tgApi('sendMessage', {
    chat_id: chatId,
    text: `🔍 <b>Qabul qilindi!</b>\nPasport: <code>${passport}</code>\n\n⏳ Teleks bazasidan tekshirilmoqda...`,
    parse_mode: 'HTML'
  });

  const checkRes = await checkMfaVisa(passport);
  if (checkRes.status === 'OK' && checkRes.html) {
    const isNotFound = checkRes.html.includes("Siz uchun ma'lumot yo") || 
                       checkRes.html.includes("ma'lumot yo`q") || 
                       checkRes.html.includes("ma'lumot yo'q");

    if (isNotFound) {
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: `📄 <b>Natija:</b> <code>${passport}</code>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `❌ <b>Siz uchun ma'lumot yo'q</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `<i>(Teleks bazasida ushbu pasport bo'yicha ma'lumot topilmadi)</i>`,
        parse_mode: 'HTML'
      });
    } else {
      const textCard = formatResultText(passport, checkRes.html);
      await tgApi('sendMessage', {
        chat_id: chatId,
        text: textCard,
        parse_mode: 'HTML'
      });
    }
  } else {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text: `⚠️ Saytdagi kapchani o'qishda xatolik bo'ldi. Qayta urinib ko'ring.\nPasport: <code>${passport}</code>`,
      parse_mode: 'HTML'
    });
  }
}

const userNamesCache = new Map();

async function handleCallback(cq) {
  const queryId = cq.id;
  const from = cq.from || {};
  const userId = String(from.id);
  const data = cq.data || '';
  const chatId = cq.message ? cq.message.chat.id : from.id;
  const messageId = cq.message ? cq.message.message_id : null;

  if (data.startsWith('req_')) {
    const targetId = data.replace('req_', '');
    const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim() || 'Foydalanuvchi';
    userNamesCache.set(targetId, fullName);

    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "So'rovingiz adminga yuborildi!" });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: "⏳ <b>So'rovingiz adminga yuborildi!</b>\nAdmin ruxsat bergach, botdan foydalanishingiz mumkin bo'ladi.",
        parse_mode: 'HTML'
      });
    }

    const uname = from.username ? '@' + from.username : 'mavjud emas';
    await tgApi('sendMessage', {
      chat_id: ADMIN_ID,
      text: `🔔 <b>Yangi ruxsat so'rovi!</b>\n\n👤 <b>Ismi:</b> ${escapeHtml(fullName)}\n🌐 <b>Username:</b> ${uname}\n🆔 <b>ID:</b> <code>${targetId}</code>\n\nUshbu foydalanuvchiga ruxsat berasizmi?`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Ruxsat berish", callback_data: `allow_${targetId}` },
            { text: "❌ Rad etish", callback_data: `deny_${targetId}` }
          ]
        ]
      }
    });
    return;
  }

  if (userId !== String(ADMIN_ID)) {
    return tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "Bu amal faqat admin uchun!" });
  }

  if (data.startsWith('allow_')) {
    const targetId = data.replace('allow_', '');
    const targetName = userNamesCache.get(targetId) || 'Foydalanuvchi';
    addAllowedUser(targetId, targetName);

    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "Ruxsat berildi!" });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `✅ <b>Ruxsat berildi!</b>\nFoydalanuvchi: <b>${escapeHtml(targetName)}</b> (ID: <code>${targetId}</code>)`,
        parse_mode: 'HTML'
      });
    }
    await tgApi('sendMessage', {
      chat_id: targetId,
      text: "🎉 <b>Tabriklaymiz! Sizga botdan foydalanishga ruxsat berildi.</b>\n\nEndi pasport raqamini yuborishingiz mumkin:\nMasalan: <code>A2255559</code>",
      parse_mode: 'HTML'
    });
    return;
  }

  if (data.startsWith('deny_')) {
    const targetId = data.replace('deny_', '');
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "So'rov rad etildi!" });
    if (messageId) {
      await tgApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: `❌ <b>So'rov rad etildi.</b>\nID: <code>${targetId}</code>`,
        parse_mode: 'HTML'
      });
    }
    await tgApi('sendMessage', {
      chat_id: targetId,
      text: "❌ <b>Kechirasiz, sizning so'rovingiz rad etildi.</b>",
      parse_mode: 'HTML'
    });
    return;
  }

  if (data.startsWith('ban_')) {
    const targetId = data.replace('ban_', '');
    removeAllowedUser(targetId);
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "Foydalanuvchi chiqarib yuborildi!" });
    await tgApi('sendMessage', {
      chat_id: targetId,
      text: "🚫 <b>Sizning botdan foydalanish huquqingiz bekor qilindi.</b>",
      parse_mode: 'HTML'
    });
    return showAdminPanel(chatId, messageId);
  }

  if (data === 'refresh_users') {
    await tgApi('answerCallbackQuery', { callback_query_id: queryId, text: "Ro'yxat yangilandi!" });
    return showAdminPanel(chatId, messageId);
  }
}

async function showAdminPanel(chatId, messageId = null) {
  const users = loadAllowedUsers();
  let text = `👥 <b>Ruxsat berilgan foydalanuvchilar:</b>\n\n👑 <b>Bosh Admin:</b> Siz (ID: <code>${ADMIN_ID}</code>)\n\n`;
  const buttons = [];

  if (users.length === 0) {
    text += "<i>Hozircha hech kim qo'shilmagan.</i>";
  } else {
    users.forEach((u, idx) => {
      text += `${idx + 1}. <b>${escapeHtml(u.name)}</b> — ID: <code>${u.id}</code>\n`;
      buttons.push([{ text: `🚫 Chiqarish: ${u.name}`, callback_data: `ban_${u.id}` }]);
    });
  }
  buttons.push([{ text: "🔄 Ro'yxatni yangilash", callback_data: "refresh_users" }]);

  if (messageId) {
    await tgApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
  } else {
    await tgApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buttons }
    });
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

// Self-ping Keep-Alive function for Render.com (prevents container sleep)
function startKeepAlive() {
  if (!PING_URL) {
    console.log('[KEEP-ALIVE]: PING_URL belgilanmagan, lokal rejimda ishlamoqda.');
    return;
  }

  console.log(`[KEEP-ALIVE]: Faollashtirildi! Har ${Math.round(PING_INTERVAL_MS / 60000)} daqiqada ${PING_URL}/health manziliga ping yuboriladi.`);
  setInterval(async () => {
    try {
      const res = await fetch(`${PING_URL}/health`);
      console.log(`[KEEP-ALIVE PING]: Status ${res.status} (${new Date().toLocaleTimeString()})`);
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
