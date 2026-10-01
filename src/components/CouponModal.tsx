import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  MapPin, 
  Phone, 
  Sparkles, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  AlertCircle,
  Ticket,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import { Coupon, Deal, UserProfile } from '../types';
import { playSound } from '../utils/sound';

interface CouponModalProps {
  coupon: Coupon | null;
  selectedDeal?: Deal | null;
  isOpen: boolean;
  currentUser?: UserProfile | null;
  userCoupons?: Coupon[];
  onClose: () => void;
  onConfirmReservation?: (paymentMethod: 'cash' | 'card', customerName: string, customerPhone: string) => Promise<void>;
  onRedeem: (couponId: string) => Promise<void>;
  onSelectCoupon?: (coupon: Coupon | null) => void;
  onCancelReservation?: (couponId: string) => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({ 
  coupon, 
  selectedDeal,
  isOpen, 
  currentUser,
  userCoupons = [],
  onClose, 
  onConfirmReservation,
  onRedeem,
  onSelectCoupon,
  onCancelReservation
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'used'>('all');
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Form states for booking when selectedDeal is provided
  const [bookingStep, setBookingStep] = useState<'form' | 'sms'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [sentCodeHint, setSentCodeHint] = useState<string | null>(null);
  const [smsCountdown, setSmsCountdown] = useState(60);
  const [canResendSms, setCanResendSms] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset booking step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setBookingStep('form');
      setSmsCode('');
      setSentCodeHint(null);
      setFormError('');
    }
  }, [isOpen]);

  // Countdown timer for SMS resend
  useEffect(() => {
    let timer: any;
    if (bookingStep === 'sms' && smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown((c) => c - 1), 1000);
    } else if (bookingStep === 'sms' && smsCountdown === 0) {
      setCanResendSms(true);
    }
    return () => clearTimeout(timer);
  }, [bookingStep, smsCountdown]);

  // Auto-populate user details when modal opens or user changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.nickname) setCustomerName(`@${currentUser.nickname}`);
      if (currentUser.phoneNumber) setCustomerPhone(currentUser.phoneNumber);
    } else {
      if (!customerName) setCustomerName('Xaridor');
      if (!customerPhone) setCustomerPhone('+998 ');
    }
  }, [currentUser, isOpen]);

  // Format phone number during input
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.startsWith('998')) {
      input = input.substring(3);
    }
    input = input.substring(0, 9);

    let formatted = '';
    if (input.length > 0) {
      formatted = '+998 ';
      if (input.length <= 2) {
        formatted += `(${input}`;
      } else if (input.length <= 5) {
        formatted += `(${input.substring(0, 2)}) ${input.substring(2)}`;
      } else if (input.length <= 7) {
        formatted += `(${input.substring(0, 2)}) ${input.substring(2, 5)}-${input.substring(5)}`;
      } else {
        formatted += `(${input.substring(0, 2)}) ${input.substring(2, 5)}-${input.substring(5, 7)}-${input.substring(7, 9)}`;
      }
    }
    setCustomerPhone(formatted);
    setFormError('');
  };

  // Countdown timer for individual active coupon
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    if (!coupon) return;

    const updateCountdown = () => {
      const expires = new Date(coupon.expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, expires - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [coupon]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeemClick = async (couponId: string) => {
    setRedeeming(true);
    await onRedeem(couponId);
    playSound('claim');
    setRedeeming(false);
  };

  // Step 1: Send SMS code to user phone
  const handleSendSmsCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      setFormError('Iltimos, ismingizni kiriting!');
      playSound('pop');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      setFormError('Iltimos, to\'liq telefon raqamingizni kiriting (+998 XX XXX-XX-XX)!');
      playSound('pop');
      return;
    }

    setFormError('');
    setBookingLoading(true);
    try {
      const res = await fetch('/api/reservations/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          dealId: selectedDeal?.id,
          dealTitle: selectedDeal?.title,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentCodeHint(data.code || '7777');
        setBookingStep('sms');
        setSmsCountdown(60);
        setCanResendSms(false);
        playSound('pop');
      } else {
        setFormError(data.error || 'SMS kod yuborishda xatolik yuz berdi.');
      }
    } catch {
      setFormError('Server bilan aloqa o\'rnatilmadi. Iltimos qaytadan urinib ko\'ring.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Step 2: Verify SMS code with PostgreSQL and complete reservation
  const handleVerifyAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsCode.trim()) {
      setFormError('Iltimos, SMS orqali yuborilgan 4 xonali kodni kiriting!');
      playSound('pop');
      return;
    }

    setFormError('');
    setBookingLoading(true);
    try {
      const res = await fetch('/api/reservations/verify-and-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: selectedDeal?.id,
          phoneNumber: customerPhone,
          code: smsCode.trim(),
          customerName: customerName.trim(),
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playSound('win');
        if (onConfirmReservation) {
          await onConfirmReservation(paymentMethod, customerName.trim(), customerPhone);
        }
      } else {
        setFormError(data.error || 'Tasdiqlash kodi noto\'g\'ri!');
        playSound('pop');
      }
    } catch {
      setFormError('Tasdiqlashda xatolik yuz berdi. Qayta urinib ko\'ring.');
    } finally {
      setBookingLoading(false);
    }
  };

  const padZero = (n: number) => String(n).padStart(2, '0');

  // Filter coupons by tab
  const filteredCoupons = userCoupons.filter((c) => {
    if (activeTab === 'active') return c.status === 'active' || c.status === 'reserved';
    if (activeTab === 'used') return c.status === 'used' || c.status === 'completed';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Top ribbon banner */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-700" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* VIEW 1: BOOKING FORM (When user clicked "Band qilish" on a deal) */}
        {/* ======================================================== */}
        {selectedDeal ? (
          <div className="overflow-y-auto flex-1 pr-1">
            <div className="text-center mt-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Chegirmali Narxda Band Qilish (Bron)</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {selectedDeal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{selectedDeal.storeName}</p>
            </div>

            {/* Product thumbnail preview */}
            <div className="relative rounded-2xl overflow-hidden mb-3 border border-slate-200 h-36">
              <img 
                src={selectedDeal.imageUrl} 
                alt={selectedDeal.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                -{selectedDeal.discountPercent}% CHEGIRMA
              </div>
              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{selectedDeal.region || 'Toshkent'}, {selectedDeal.district}</span>
              </div>
            </div>

            {/* Price overview */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block line-through">
                  Asl narxi: {selectedDeal.originalPrice.toLocaleString()} so'm
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-950 block">
                  {selectedDeal.discountPrice.toLocaleString()} so'm
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 font-bold block">Siz tejaysiz:</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-600">
                  +{selectedDeal.savedMoney.toLocaleString()} so'm
                </span>
              </div>
            </div>

            {formError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {bookingStep === 'form' ? (
              <form onSubmit={handleSendSmsCode} className="space-y-3.5 text-xs">
                {/* Payment Method Selector */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    To'lov turini tanlang *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('cash');
                        playSound('click');
                      }}
                      className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">Naqd Pulda</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal leading-tight">
                        Do'konga borganda to'laysiz
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('card');
                        playSound('click');
                      }}
                      className={`p-3 rounded-2xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">Plastik Karta</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal leading-tight">
                        Uzcard / Humo bilan
                      </span>
                    </button>
                  </div>
                </div>

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-[11px]">
                      Ismingiz *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masalan: Nodirbek"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1 text-[11px]">
                      Telefon raqamingiz *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={handlePhoneInputChange}
                      placeholder="+998 (90) 123-45-67"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                  <span className="text-base leading-none">📱</span>
                  <span>Band qilish uchun telefoningizga <strong>SMS tasdiqlash kodi</strong> yuboriladi va ma'lumotlar <strong>PostgreSQL</strong> bazasiga saqlanadi.</span>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <span>SMS kod yuborilmoqda...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>SMS Kod Olish va Band Qilish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            ) : (
              /* SMS Verification Step */
              <form onSubmit={handleVerifyAndBook} className="space-y-4 text-xs animate-fadeIn">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <Phone className="w-6 h-6 animate-bounce" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    SMS Tasdiqlash Kodi
                  </h4>
                  <p className="text-xs text-slate-600">
                    Tasdiqlash kodi <strong className="text-emerald-950 font-bold">{customerPhone}</strong> raqamiga yuborildi.
                  </p>
                  {sentCodeHint && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs">
                      <span>SMS Kod:</span>
                      <span className="text-amber-300 text-sm font-black tracking-widest">{sentCodeHint}</span>
                      <span className="text-[10px] text-emerald-300 font-normal">(yoki test kodi 7777)</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-center mb-2">
                    4 xonali SMS kodni kiriting:
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={smsCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setSmsCode(val);
                      setFormError('');
                    }}
                    placeholder="••••"
                    autoFocus
                    className="w-48 mx-auto block bg-slate-50 border-2 border-emerald-600 focus:border-emerald-700 rounded-2xl p-3 text-center text-2xl font-mono font-black tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep('form');
                      setFormError('');
                      playSound('click');
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Raqamni o'zgartirish</span>
                  </button>

                  <div>
                    {canResendSms ? (
                      <button
                        type="button"
                        onClick={handleSendSmsCode}
                        className="text-amber-700 hover:text-amber-900 font-bold cursor-pointer underline"
                      >
                        Kodni qayta yuborish
                      </button>
                    ) : (
                      <span>Qayta yuborish ({smsCountdown}s)</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={bookingLoading || smsCode.length < 4}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <span>PostgreSQL bazasiga saqlanmoqda...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Kodni Tasdiqlash va Band Qilish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingStep('form');
                      setFormError('');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Orqaga
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : coupon ? (
          /* ======================================================== */
          /* VIEW 2: SINGLE COUPON / QR TICKET VIEW */
          /* ======================================================== */
          <div className="overflow-y-auto flex-1 pr-1">
            {/* Back button to list if user has multiple coupons */}
            {userCoupons.length > 1 && onSelectCoupon && (
              <button
                onClick={() => onSelectCoupon(null)}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 mb-3 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Barcha bandliklarimga qaytish</span>
              </button>
            )}

            {/* Ticket Header */}
            <div className="text-center mt-1 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Aksiyago Rasmiy Band Qilish Chiptasi</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {coupon.dealTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{coupon.storeName}</p>
            </div>

            {/* Payment Method Badge */}
            <div className="bg-slate-50 rounded-2xl p-2.5 mb-3 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500 font-medium">To'lov usuli:</span>
              <span className="font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                {coupon.paymentMethod === 'card' ? (
                  <>
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Plastik Karta (Uzcard/Humo)</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Naqd pulda (Do'konda)</span>
                  </>
                )}
              </span>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center my-3 relative">
              <div className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
                <img
                  src={coupon.qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KUPONUZ-${coupon.bookingCode || coupon.code}`}
                  alt="Booking QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Booking Code with Copy */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Bron kodi:</span>
                <span className="text-base font-mono font-extrabold text-emerald-900 tracking-wider bg-emerald-100 px-3 py-1 rounded-lg">
                  {coupon.bookingCode || coupon.code}
                </span>
                <button
                  onClick={() => handleCopy(coupon.bookingCode || coupon.code || '')}
                  className="p-1.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-slate-600 hover:text-emerald-700 cursor-pointer transition-colors"
                  title="Kodni nusxalash"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {coupon.status === 'completed' || coupon.status === 'used' ? (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                  <span className="text-base font-extrabold">Qabul Qilindi & To'landi!</span>
                  <span className="text-xs text-emerald-200 mt-1">Ushbu mahsulot do'konda muvaffaqiyatli xarid qilindi.</span>
                </div>
              ) : null}
            </div>

            {/* Price breakdown */}
            <div className="grid grid-cols-3 gap-2 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-2.5 text-center my-3">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Asl narxi</span>
                <span className="text-xs font-bold text-slate-500 line-through">
                  {coupon.originalPrice.toLocaleString()} so'm
                </span>
              </div>
              <div className="border-x border-emerald-200/60">
                <span className="text-[10px] text-emerald-800 font-bold block">Chegirmada</span>
                <span className="text-sm font-extrabold text-emerald-900">
                  {coupon.discountPrice.toLocaleString()} so'm
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-bold block">Tejov</span>
                <span className="text-xs font-extrabold text-amber-600">
                  +{coupon.savedMoney.toLocaleString()} so'm
                </span>
              </div>
            </div>

            {/* Countdown timer */}
            {(coupon.status === 'active' || coupon.status === 'reserved') && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs mb-3 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Do'konda saqlanish vaqti:</span>
                </div>
                <div className="font-mono font-extrabold bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded">
                  {padZero(timeLeft.hours)}:{padZero(timeLeft.minutes)}:{padZero(timeLeft.seconds)}
                </div>
              </div>
            )}

            {/* Store details */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-slate-800">
                  {coupon.region ? `${coupon.region}, ` : ''}{coupon.district}: {coupon.storeAddress}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{coupon.storePhone}</span>
                </div>
                <a
                  href={`tel:${coupon.storePhone}`}
                  className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold text-[11px] transition-colors"
                >
                  Qo'ng'iroq qilish
                </a>
              </div>
            </div>

            {/* Cashier / Customer Actions */}
            <div className="space-y-2">
              {(coupon.status === 'active' || coupon.status === 'reserved') && (
                <button
                  onClick={() => handleRedeemClick(coupon.id)}
                  disabled={redeeming}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {redeeming ? (
                    <span>Tasdiqlanmoqda...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Kassir: To'lovni Qabul Qilish & Yakunlash</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 3: ALL RESERVATIONS LIST ("Band qilinganlar" main menu) */
          /* ======================================================== */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mt-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Mening Band Qilgan Buyurtmalarim
                </h3>
                <p className="text-[11px] text-slate-400">
                  Do'konlarda chegirma bilan olish uchun chiptalaringiz
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl my-3 text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Barchasi ({userCoupons.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Faol chiptalar ({userCoupons.filter((c) => c.status === 'active' || c.status === 'reserved').length})
              </button>
              <button
                onClick={() => setActiveTab('used')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'used'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ishlatilganlar ({userCoupons.filter((c) => c.status === 'used' || c.status === 'completed').length})
              </button>
            </div>

            {/* List of Coupons */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredCoupons.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-800">
                    {userCoupons.length === 0
                      ? "Sizda hali band qilingan mahsulotlar yo'q"
                      : "Bu toifada kuponlar topilmadi"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Istalgan aksiya kartochkasidagi <strong>"Band qilish"</strong> tugmasini bosib, tovarlarni 24 soatga chegirmali narxda saqlab qo'yishingiz mumkin!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Aksiyalarni ko'rish
                  </button>
                </div>
              ) : (
                filteredCoupons.map((c) => {
                  const isCompleted = c.status === 'completed' || c.status === 'used';
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-white border-emerald-200 shadow-xs hover:border-emerald-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                              {c.bookingCode || c.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              isCompleted 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isCompleted ? 'Ishlatilgan' : 'Faol (24s)'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1">
                            {c.dealTitle}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.storeName} • {c.region || 'Toshkent'}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-extrabold text-xs text-emerald-800">
                              {c.discountPrice.toLocaleString()} so'm
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {c.originalPrice.toLocaleString()} so'm
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 rounded">
                              +{c.savedMoney.toLocaleString()} so'm tejov
                            </span>
                          </div>
                        </div>

                        {/* View QR / Ticket Action */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (onSelectCoupon) onSelectCoupon(c);
                              playSound('click');
                            }}
                            className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <span>QR Kod</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCopy(c.bookingCode || c.code || '')}
                            className="text-[10px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer pt-0.5"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Nusxalash</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Close */}
            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
