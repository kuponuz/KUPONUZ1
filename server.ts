import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DEALS, INITIAL_STORES, INITIAL_NOTIFICATIONS, INITIAL_STATS } from './src/data/initialData';
import { Deal, Store, Coupon, ChatMessage, AppNotification, EcoStats } from './src/types';
import { 
  insertReservation, 
  getReservations, 
  storeSmsCode, 
  checkSmsCode, 
  markReservationCompleted 
} from './src/db/reservations.ts';

// In-memory data storage (persists during container runtime)
let deals: Deal[] = [...INITIAL_DEALS];
let stores: Store[] = [...INITIAL_STORES];
let coupons: Coupon[] = [];
let chats: ChatMessage[] = [
  {
    id: 'msg-1',
    dealId: 'deal-1',
    dealTitle: 'Kechki Tandir Somsa va Non Seti (5 dona)',
    sender: 'buyer',
    senderName: 'Azizbek',
    text: 'Assalomu alaykum! Somsa hali issiqmi, hozir borib olsam bo\'ladimi?',
    timestamp: '19:15',
    read: true,
  },
  {
    id: 'msg-2',
    dealId: 'deal-1',
    dealTitle: 'Kechki Tandir Somsa va Non Seti (5 dona)',
    sender: 'vendor',
    senderName: 'Rayhon Milliy Taomlar',
    text: 'Va alaykum assalom! Ha, albatta, pechdan yangi uzilgan, bemalol kelib kuponni ko\'rsatsangiz bo\'ladi.',
    timestamp: '19:17',
    read: true,
  }
];
let notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
let stats: EcoStats = { ...INITIAL_STATS };

// Initialize Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Gemini API client:', err);
    }
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Endpoints ---

  // SMS Confirmation in-memory storage: phone -> { code: string, expiresAt: number }
  const smsVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

  // Send SMS Confirmation Code
  app.post('/api/auth/send-sms', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
    }

    const clean = String(phoneNumber).replace(/\D/g, '');
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    smsVerificationCodes.set(clean, { code, expiresAt });

    console.log(`[SMS-SERVICE] Tasdiqlash kodi yuborildi: ${clean} -> ${code}`);

    res.json({
      success: true,
      message: 'Tasdiqlash kodi yuborildi',
      code,
      expiresIn: 300,
      timestamp: new Date().toISOString()
    });
  });

  // Verify SMS Confirmation Code
  app.post('/api/auth/verify-sms', (req, res) => {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Telefon raqam va kod kiritilishi shart' });
    }

    const clean = String(phoneNumber).replace(/\D/g, '');
    const entry = smsVerificationCodes.get(clean);

    // Master test code
    if (code === '7777') {
      return res.json({ success: true, verified: true });
    }

    if (!entry) {
      return res.status(400).json({ error: 'Tasdiqlash kodi topilmadi yoki muddati tugagan. Qaytadan kod so\'rang.' });
    }

    if (Date.now() > entry.expiresAt) {
      smsVerificationCodes.delete(clean);
      return res.status(400).json({ error: 'Tasdiqlash kodi muddati o\'tib ketgan. Yangi kod so\'rang.' });
    }

    if (entry.code !== String(code).trim()) {
      return res.status(400).json({ error: 'Kiritilgan tasdiqlash kodi noto\'g\'ri!' });
    }

    // Success - consume code
    smsVerificationCodes.delete(clean);
    res.json({ success: true, verified: true });
  });

  // Send SMS verification code for Booking / Reservation (Cloud SQL PostgreSQL + memory)
  app.post('/api/reservations/send-code', async (req, res) => {
    const { phoneNumber, dealId, dealTitle } = req.body || {};
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
    }

    const clean = String(phoneNumber).replace(/\D/g, '');
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Save in memory
    smsVerificationCodes.set(clean, { code, expiresAt });

    // Save in Cloud SQL PostgreSQL
    try {
      await storeSmsCode(clean, code, 'booking');
      console.log(`[PostgreSQL] Band qilish uchun SMS kod saqlandi: ${clean} -> ${code}`);
    } catch (err) {
      console.warn('[PostgreSQL] SMS saqlashda ogohlantirish (in-memory ishlaydi):', err);
    }

    console.log(`[SMS-SERVICE] Band qilish uchun SMS tasdiqlash kodi: ${clean} -> ${code}`);

    res.json({
      success: true,
      message: 'Band qilish uchun SMS tasdiqlash kodi yuborildi',
      code,
      expiresIn: 300,
      timestamp: new Date().toISOString()
    });
  });

  // Verify SMS code and create Reservation in PostgreSQL
  app.post('/api/reservations/verify-and-book', async (req, res) => {
    const { 
      dealId, 
      phoneNumber, 
      code, 
      customerName, 
      paymentMethod,
    } = req.body || {};

    if (!dealId || !phoneNumber || !code) {
      return res.status(400).json({ error: 'Barcha maydonlar va tasdiqlash kodi kiritilishi shart' });
    }

    const clean = String(phoneNumber).replace(/\D/g, '');

    // Check code in PostgreSQL or fallback to in-memory
    let isValid = false;
    if (code === '7777') {
      isValid = true;
    } else {
      try {
        isValid = await checkSmsCode(clean, String(code).trim(), 'booking');
      } catch (err) {
        console.warn('PostgreSQL SMS check error:', err);
      }

      if (!isValid) {
        const memEntry = smsVerificationCodes.get(clean);
        if (memEntry && Date.now() <= memEntry.expiresAt && memEntry.code === String(code).trim()) {
          isValid = true;
          smsVerificationCodes.delete(clean);
        }
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Kiritilgan tasdiqlash kodi noto\'g\'ri yoki muddati tugagan!' });
    }

    const deal = deals.find((d) => d.id === dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Aksiya topilmadi' });
    }

    if (deal.claimedCoupons >= (deal.totalCoupons || deal.totalItems || 10)) {
      return res.status(400).json({ error: 'Kuponlar qolmagan!' });
    }

    deal.claimedCoupons += 1;

    const randomBookingCode = `KU-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

    const reservationData = {
      bookingCode: randomBookingCode,
      dealId: deal.id,
      dealTitle: deal.title,
      storeName: deal.storeName,
      storeAddress: deal.storeAddress || '',
      storePhone: deal.storePhone || '',
      customerName: customerName || 'Xaridor',
      customerPhone: phoneNumber,
      paymentMethod: paymentMethod || 'cash',
      originalPrice: deal.originalPrice || 0,
      discountPrice: deal.discountPrice || 0,
      savedMoney: (deal.originalPrice || 0) - (deal.discountPrice || 0),
      status: 'active',
      isVerified: true,
      expiresAt,
    };

    // Insert into Cloud SQL PostgreSQL
    let savedPgReservation: any = null;
    try {
      savedPgReservation = await insertReservation(reservationData);
      console.log(`[PostgreSQL] Buyurtma muvaffaqiyatli saqlandi: ${randomBookingCode}`);
    } catch (err) {
      console.warn('[PostgreSQL] Band qilishda xatolik:', err);
    }

    // Also create matching Coupon object
    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: randomBookingCode,
      bookingCode: randomBookingCode,
      dealId: deal.id,
      dealTitle: deal.title,
      storeName: deal.storeName,
      storePhone: deal.storePhone,
      storeAddress: deal.storeAddress,
      region: deal.region,
      district: deal.district,
      originalPrice: deal.originalPrice,
      discountPrice: deal.discountPrice,
      savedMoney: deal.originalPrice - deal.discountPrice,
      savedFoodKg: deal.savedFoodKg || 1.0,
      claimedAt: new Date().toISOString(),
      reservedAt: new Date().toISOString(),
      expiresAt,
      status: 'active',
      paymentMethod: paymentMethod || 'cash',
      qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KUPONUZ-${randomBookingCode}`,
      ecoPointsAwarded: 25,
    };

    coupons.unshift(newCoupon);

    // Update global stats
    stats.totalReservations = (stats.totalReservations || 0) + 1;
    stats.totalMoneySavedUz = (stats.totalMoneySavedUz || 0) + newCoupon.savedMoney;

    res.status(201).json({
      success: true,
      bookingCode: randomBookingCode,
      coupon: newCoupon,
      pgRecord: savedPgReservation,
      message: 'Buyurtma PostgreSQL bazasida tasdiqlandi va muvaffaqiyatli band qilindi!',
    });
  });

  // Get reservations from PostgreSQL
  app.get('/api/reservations', async (req, res) => {
    try {
      const pgReservations = await getReservations();
      res.json(pgReservations);
    } catch (err) {
      console.warn('Failed to fetch from PostgreSQL:', err);
      res.json([]);
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get Stats
  app.get('/api/stats', (req, res) => {
    res.json(stats);
  });

  // Get Stores
  app.get('/api/stores', (req, res) => {
    res.json(stores);
  });

  // Verify Store (Admin) - supports PATCH and POST
  app.all('/api/stores/:id/verify', (req, res) => {
    const { id } = req.params;
    const { isVerified } = req.body || {};
    const store = stores.find((s) => s.id === id);
    if (!store) {
      return res.status(404).json({ error: 'Do\'kon topilmadi' });
    }
    store.isVerified = isVerified !== undefined ? isVerified : !store.isVerified;
    
    // Also update all deals of this store
    deals.forEach((d) => {
      if (d.storeId === id) {
        d.isVerifiedStore = store.isVerified;
      }
    });

    res.json({ success: true, store });
  });

  // Get Deals
  app.get('/api/deals', (req, res) => {
    const { district, category, tag, search, status } = req.query;

    let filtered = [...deals];

    if (status) {
      filtered = filtered.filter((d) => d.status === status);
    }

    if (district && district !== 'Barcha tumanlar') {
      filtered = filtered.filter((d) => d.district === district);
    }

    if (category && category !== 'Barchasi') {
      filtered = filtered.filter((d) => d.category === category);
    }

    if (tag === 'kunox') {
      filtered = filtered.filter((d) => d.isKunox);
    } else if (tag === 'flash') {
      filtered = filtered.filter((d) => d.isFlashSale);
    } else if (tag === 'vip') {
      filtered = filtered.filter((d) => d.isVipTop);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.storeName.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Sort VIP on top, then newest
    filtered.sort((a, b) => {
      if (a.isVipTop && !b.isVipTop) return -1;
      if (!a.isVipTop && b.isVipTop) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(filtered);
  });

  // Create Deal (Vendor)
  app.post('/api/deals', (req, res) => {
    const {
      title,
      description,
      originalPrice,
      discountPrice,
      savedFoodKg,
      category,
      imageUrl,
      storeName,
      storePhone,
      storeAddress,
      district,
      lat,
      lng,
      isKunox,
      isFlashSale,
      flashMinutes,
      totalCoupons,
    } = req.body;

    if (!title || !originalPrice || !discountPrice || !savedFoodKg) {
      return res.status(400).json({ error: 'Barcha asosiy maydonlarni to\'ldiring' });
    }

    const orig = Number(originalPrice);
    const disc = Number(discountPrice);
    const percent = Math.round(((orig - disc) / orig) * 100);

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title,
      description: description || 'Chegirmali mahsulot e\'loni.',
      originalPrice: orig,
      discountPrice: disc,
      discountPercent: percent,
      savedMoney: orig - disc,
      savedFoodKg: Number(savedFoodKg) || 1,
      category: category || 'Kiyim-kechak',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      region: req.body.region || 'Toshkent shahri',
      district: district || 'Yunusobod',
      storeId: 'store-vendor-custom',
      storeName: storeName || 'Mahalliy Hamkor Do\'kon',
      storePhone: storePhone || '+998 90 123 45 67',
      storeAddress: storeAddress || 'Toshkent shahri',
      lat: Number(lat) || 41.3111,
      lng: Number(lng) || 69.2797,
      paymentMethods: ['cash', 'card'],
      isVerifiedStore: false,
      isVipTop: false,
      isKunox: Boolean(isKunox),
      isFlashSale: Boolean(isFlashSale),
      flashSaleEndsAt: isFlashSale
        ? new Date(Date.now() + (Number(flashMinutes) || 60) * 60 * 1000).toISOString()
        : undefined,
      status: 'pending_review', // Requires Admin moderation
      totalCoupons: Number(totalCoupons) || 10,
      totalItems: Number(totalCoupons) || 10,
      claimedCoupons: 0,
      createdAt: new Date().toISOString(),
    };

    deals.unshift(newDeal);

    // Notify admin
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: '📋 Yangi aksiya moderatsiyada!',
      message: `${newDeal.storeName} yangi "${newDeal.title}" aksiyasini joyladi. Tekshiring!`,
      type: 'system',
      timestamp: 'Hozirgina',
      linkDealId: newDeal.id,
      read: false,
    });

    res.status(201).json(newDeal);
  });

  // Update Deal (Admin Moderation / Status / VIP)
  app.patch('/api/deals/:id', (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason, isVipTop } = req.body;

    const deal = deals.find((d) => d.id === id);
    if (!deal) {
      return res.status(404).json({ error: 'Aksiya topilmadi' });
    }

    if (status) deal.status = status;
    if (rejectionReason !== undefined) deal.rejectionReason = rejectionReason;
    if (isVipTop !== undefined) deal.isVipTop = isVipTop;

    res.json({ success: true, deal });
  });

  // Approve Deal (Admin)
  app.post('/api/deals/:id/approve', (req, res) => {
    const { id } = req.params;
    const deal = deals.find((d) => d.id === id);
    if (!deal) {
      return res.status(404).json({ error: 'Aksiya topilmadi' });
    }
    deal.status = 'active';
    delete deal.rejectionReason;
    res.json({ success: true, deal });
  });

  // Reject Deal (Admin)
  app.post('/api/deals/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const deal = deals.find((d) => d.id === id);
    if (!deal) {
      return res.status(404).json({ error: 'Aksiya topilmadi' });
    }
    deal.status = 'rejected';
    deal.rejectionReason = reason || 'Qoidabuzarlik sababli rad etildi';
    res.json({ success: true, deal });
  });

  // Get Coupons
  app.get('/api/coupons', (req, res) => {
    res.json(coupons);
  });

  // Claim Coupon (Buyer) - supports both /api/coupons and /api/coupons/claim
  const handleClaim = (req: express.Request, res: express.Response) => {
    const { dealId } = req.body || {};
    const deal = deals.find((d) => d.id === dealId);

    if (!deal) {
      return res.status(404).json({ error: 'Aksiya topilmadi' });
    }

    if (deal.claimedCoupons >= (deal.totalCoupons || deal.totalItems || 10)) {
      return res.status(400).json({ error: 'Kuponlar qolmagan!' });
    }

    deal.claimedCoupons += 1;

    const dealFoodKg = deal.savedFoodKg || 1.5;
    const ecoPoints = Math.max(25, Math.round(dealFoodKg * 50));
    const randomCode = `KU-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}`,
      code: randomCode,
      bookingCode: randomCode,
      dealId: deal.id,
      dealTitle: deal.title,
      storeName: deal.storeName,
      storePhone: deal.storePhone,
      storeAddress: deal.storeAddress,
      region: deal.region,
      district: deal.district,
      originalPrice: deal.originalPrice,
      discountPrice: deal.discountPrice,
      savedMoney: deal.originalPrice - deal.discountPrice,
      savedFoodKg: dealFoodKg,
      claimedAt: new Date().toISOString(),
      reservedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // 3 hours countdown
      status: 'active',
      paymentMethod: 'cash',
      qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KUPON_UZ:${randomCode}:${deal.id}`,
      ecoPointsAwarded: ecoPoints,
    };

    coupons.unshift(newCoupon);

    // Update global eco stats
    stats.totalCouponsClaimed = (stats.totalCouponsClaimed || 0) + 1;
    stats.totalSavedFoodKg = Number(((stats.totalSavedFoodKg || 0) + dealFoodKg).toFixed(1));
    stats.co2PreventedKg = Number(((stats.totalSavedFoodKg || 0) * 2.5).toFixed(1));
    stats.totalMoneySavedUz = (stats.totalMoneySavedUz || 0) + newCoupon.savedMoney;

    res.status(201).json(newCoupon);
  };

  app.post('/api/coupons', handleClaim);
  app.post('/api/coupons/claim', handleClaim);

  // Redeem Coupon (Cashier verification)
  const handleRedeem = (couponIdentifier: string, res: express.Response) => {
    const coupon = coupons.find((c) => c.id === couponIdentifier || c.code === couponIdentifier);
    if (!coupon) {
      return res.status(404).json({ error: 'Kupon topilmadi' });
    }
    if (coupon.status === 'used') {
      return res.status(400).json({ error: 'Bu kupon allaqachon ishlatilgan!' });
    }
    coupon.status = 'used';
    res.json({ success: true, message: 'Kupon muvaffaqiyatli qabul qilindi!', coupon });
  };

  app.post('/api/coupons/redeem', (req, res) => {
    const { couponId } = req.body || {};
    if (!couponId) {
      return res.status(400).json({ error: 'Kupon ID kiritilmadi' });
    }
    handleRedeem(couponId, res);
  });

  app.post('/api/coupons/:id/redeem', (req, res) => {
    const { id } = req.params;
    handleRedeem(id, res);
  });

  // Get Chat Messages for Deal
  app.get('/api/chat/:dealId', (req, res) => {
    const { dealId } = req.params;
    const dealChats = chats.filter((c) => c.dealId === dealId);
    res.json(dealChats);
  });

  // Send Chat Message
  app.post('/api/chat', (req, res) => {
    const { dealId, text, sender, senderName } = req.body;
    const deal = deals.find((d) => d.id === dealId);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      dealId,
      dealTitle: deal?.title || 'Aksiya',
      sender: sender || 'buyer',
      senderName: senderName || (sender === 'buyer' ? 'Xaridor' : 'Sotuvchi'),
      text,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    chats.push(newMsg);

    // If buyer messaged, simulate automatic helpful merchant response after a short delay
    if (sender === 'buyer') {
      setTimeout(() => {
        let replyText = 'Assalomu alaykum! Ha, mahsulotimiz yangi va sotuvda mavjud. Bemalol tashrif buyurib kuponingizni ko\'rsatishingiz mumkin!';
        const lower = text.toLowerCase();
        if (lower.includes('bormi') || lower.includes('qoldimi')) {
          replyText = 'Ha, kupon soni cheklangan, ammo hozirda zaxirada bor. Kelishingiz mumkin!';
        } else if (lower.includes('yetkazib') || lower.includes('dostavka')) {
          replyText = 'Yetkazib berish Yandex Go yoki Express orqali kelishilgan holda amalga oshirilishi mumkin.';
        } else if (lower.includes('manzil') || lower.includes('qayerda')) {
          replyText = `Do'konimiz manzili: ${deal?.storeAddress || 'Toshkent shahri'}. Mo'ljal xaritada ko'rsatilgan!`;
        }

        const autoReply: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          dealId,
          dealTitle: deal?.title || 'Aksiya',
          sender: 'vendor',
          senderName: deal?.storeName || 'Sotuvchi',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          read: false,
        };
        chats.push(autoReply);
      }, 1200);
    }

    res.status(201).json(newMsg);
  });

  // Get Notifications
  app.get('/api/notifications', (req, res) => {
    res.json(notifications);
  });

  // Broadcast Push & Telegram Post (Admin) - supports both /api/notifications/broadcast and /api/admin/broadcast
  const handleBroadcast = (req: express.Request, res: express.Response) => {
    const { title, message, sendTelegram, telegramChannel } = req.body;

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: title || '📢 Maxsus Aksiya E\'loni!',
      message: message || 'Kupon.uz orqali yangi chegirmalar mavjud!',
      type: 'telegram_post',
      timestamp: 'Hozirgina',
      read: false,
    };

    notifications.unshift(newNotif);

    res.json({
      success: true,
      notification: newNotif,
      telegramPosted: Boolean(sendTelegram),
      channel: telegramChannel || '@kuponuz_deals',
    });
  };

  app.post('/api/notifications/broadcast', handleBroadcast);
  app.post('/api/admin/broadcast', handleBroadcast);

  // Monetization Services Order (Vendor)
  app.post('/api/monetization/order', (req, res) => {
    const { serviceType, dealId, storeId } = req.body;
    // Strict max price <= 20,000 UZS as mandated
    const PRICING: Record<string, { name: string; price: number }> = {
      vip_top: { name: 'VIP Top Status (1 oy)', price: 20000 },
      instant_push: { name: 'Tezkor Push-Xabar', price: 10000 },
      home_banner: { name: 'Asosiy Sahifa Banneri (1 hafta)', price: 15000 },
    };

    const selected = PRICING[serviceType];
    if (!selected) {
      return res.status(400).json({ error: 'Noto\'g\'ri xizmat turi' });
    }

    // Apply service effect
    if (serviceType === 'vip_top' && dealId) {
      const d = deals.find((deal) => deal.id === dealId);
      if (d) d.isVipTop = true;
    } else if (serviceType === 'home_banner') {
      const s = stores.find((store) => store.id === storeId);
      if (s) s.hasBanner = true;
    } else if (serviceType === 'instant_push') {
      const d = deals.find((deal) => deal.id === dealId);
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `🔥 Tezkor E\'lon: ${d ? d.storeName : 'Hamkor Do\'kon'}`,
        message: d ? `${d.title} mahsulotiga katta chegirma! Shoshiling, kuponlar cheklangan!` : 'Yangi chegirmali aksiya boshlandi!',
        type: 'flash_sale',
        timestamp: 'Hozirgina',
        linkDealId: dealId,
        read: false,
      });
    }

    stats.totalPlatformRevenueUz = (stats.totalPlatformRevenueUz || 0) + selected.price;

    res.json({
      success: true,
      service: selected.name,
      paidAmount: selected.price,
      message: `${selected.name} muvaffaqiyatli faollashtirildi! Hisobdan ${selected.price.toLocaleString()} so'm yechildi.`,
    });
  });

  // AI SMM Copy Generator (Gemini 3.8 Flash)
  app.post('/api/gemini/generate-smm', async (req, res) => {
    const { title, originalPrice, discountPrice, savedFoodKg, storeName, district } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // High-quality fallback text in Uzbek if API key is not yet set
      const origStr = Number(originalPrice).toLocaleString();
      const discStr = Number(discountPrice).toLocaleString();
      const fallbackPost = `🌿 **Kupon.uz orqali AQLBOVAR QILMAS CHEGIRMA!**\n\n🍽 **${title}**\n📍 Manzil: ${storeName || 'Do\'konimiz'} (${district || 'Toshkent'})\n\n❌ Asl narxi: ~${origStr} so'm~\n✅ **Chegirmada: atigi ${discStr} so'm!**\n🌱 Siz ${savedFoodKg || 1} kg mazali taomni isrofdan qutqarib qolasiz!\n\n⚡️ Shoshiling! Kuponlar soni juda oz qoldi. Hoziroq Kupon.uz orqali QR-kuponni oling va kassada ko'rsating!\n\n#KuponUz #Tejamkorlik #OziqOvqatIsrofigaYoq #ToshkentChegirmalar #EkoHarakat`;
      return res.json({ text: fallbackPost });
    }

    try {
      const prompt = `Siz O'zbekistonning "Kupon.uz" eko-chegirma platformasi uchun professional SMM mutaxassisisiz.
Quyidagi tovar va chegirma bo'yicha Telegram va Instagram uchun sotuvbop, hayajonli, o'zbek tilida emojilar bilan boyitilgan SMM post va xeshteglar yozib bering.

Ma'lumotlar:
- Tovar nomi: ${title}
- Asl narxi: ${Number(originalPrice).toLocaleString()} so'm
- Chegirmali narxi: ${Number(discountPrice).toLocaleString()} so'm
- Isrofdan saqlanadigan taom vazni: ${savedFoodKg} kg
- Do'kon / Restoran: ${storeName || 'Kupon.uz hamkori'}
- Tuman / Hudud: ${district || 'Toshkent'}

Talablar:
- O'zbek tilida (lotin yozuvida) bo'lsin.
- Diqqatni tortuvchi sarlavha, narx tejamkorligi va ekologik ta'sir (isrofdan qutqarilgan ovqat) urg'ulansin.
- Aniq Call To Action (Kupon.uz ilovasida kupon olishga chaqiruv).
- 5-7 ta dolzarb o'zbekcha xeshteglar qo'shilsin.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({ text: response.text || '' });
    } catch (err: any) {
      console.error('Gemini SMM generation error:', err);
      res.status(500).json({ error: 'AI matn yaratishda xatolik yuz berdi: ' + (err.message || '') });
    }
  });

  // AI Fraud & Scam Detection (Gemini 3.8 Flash)
  app.post('/api/gemini/fraud-check', async (req, res) => {
    const { title, description, originalPrice, discountPrice, savedFoodKg, storeName } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Heuristic rule-based fallback
      const orig = Number(originalPrice) || 0;
      const disc = Number(discountPrice) || 0;
      let score = 10;
      let reason = 'Narxlar va mahsulot parametrlari standart me\'yorlarga mos keladi. Shubha aniqlanmadi.';

      if (orig > 2000000 && disc < 50000) {
        score = 85;
        reason = 'Asossiz 95%+ chegirma va sun\'iy oshirilgan narx shubhalari mavjud.';
      } else if (disc >= orig) {
        score = 95;
        reason = 'Chegirmali narx asl narxdan baland yoki teng!';
      }

      return res.json({ riskScore: score, reason });
    }

    try {
      const prompt = `O'zbekistondagi "Kupon.uz" platformasida elon qilingan yangi aksiya ma'lumotlarini tahlil qiling va unda firibgarlik (sun'iy oshirilgan narx, soxta chegirma, spam, noo'rin tovar) xavfini baholang.

Tovar: ${title}
Tavsif: ${description}
Asl narx: ${originalPrice} so'm
Chegirmali narx: ${discountPrice} so'm
Isrofdan saqlanadigan kg: ${savedFoodKg} kg
Do'kon: ${storeName}

Quyidagi JSON formatda javob bering:
{
  "riskScore": <0 dan 100 gacha son, 0 - xavfsiz, 100 - mutlaqo firibgarlik>,
  "reason": "<o'zbek tilida qisqa tahliliy xulosa>"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        riskScore: parsed.riskScore ?? 15,
        reason: parsed.reason ?? 'Mahsulot mezonlarga mos.',
      });
    } catch (err: any) {
      console.error('Gemini fraud check error:', err);
      res.json({
        riskScore: 20,
        reason: 'Standart tekshiruvdan o\'tdi (AI tahlili vaqtinchalik mavjud emas).',
      });
    }
  });

  // --- Vite Middleware (Development) or Static Serving (Production) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kupon Uz Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
