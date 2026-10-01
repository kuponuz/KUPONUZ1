import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Phone, 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Sparkles, 
  Store as StoreIcon, 
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Crown,
  MessageSquare,
  RefreshCw,
  Smartphone,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { playSound } from '../utils/sound';
import { 
  fetchUserByPhone, 
  MASTER_ADMIN_PHONE, 
  MASTER_ADMIN_PHONE_DIGITS 
} from '../lib/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialRole?: UserRole;
  isMandatory?: boolean;
  adminPhoneNumbers?: string[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'buyer',
  isMandatory = false,
  adminPhoneNumbers = [MASTER_ADMIN_PHONE]
}) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [incomingSms, setIncomingSms] = useState<{ code: string; show: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Countdown timer for resending SMS
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // Check if current entered phone is an admin phone
  const cleanDigits = phoneNumber.replace(/\D/g, '');
  const isAdminPhone = cleanDigits === MASTER_ADMIN_PHONE_DIGITS || 
    adminPhoneNumbers.some(p => p.replace(/\D/g, '') === cleanDigits && cleanDigits.length >= 9);

  // Format phone number as user types: +998 (90) 123-45-67
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.startsWith('998')) {
      input = input.substring(3);
    }
    input = input.substring(0, 9); // 9 digits after 998

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
    setPhoneNumber(formatted);
    setError('');
  };

  // Validate nickname: max 12 characters, only letters, numbers, and underscore (_)
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const filtered = rawValue.replace(/[^a-zA-Z0-9_]/g, '');
    const truncated = filtered.slice(0, 12);
    setNickname(truncated);

    if (rawValue !== filtered) {
      setError('Faqat lotin harflari, raqamlar va pastki chiziqcha (_) ishlatish mumkin!');
    } else {
      setError('');
    }
  };

  // Step 1: Submit Form & Send SMS confirmation code
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 12) {
      setError('Iltimos, to\'liq telefon raqamingizni kiriting (+998 XX XXX-XX-XX)');
      playSound('pop');
      return;
    }

    if (!password || password.length < 4) {
      setError('Parol kamida 4 ta belgidan iborat bo\'lishi shart!');
      playSound('pop');
      return;
    }

    if (mode === 'register') {
      const cleanNick = nickname.trim();
      if (!cleanNick) {
        setError('Iltimos, o\'zingiz uchun nik (taxallus) kiriting!');
        playSound('pop');
        return;
      }

      if (cleanNick.length < 3) {
        setError('Nik (taxallus) kamida 3 ta belgidan iborat bo\'lishi kerak!');
        playSound('pop');
        return;
      }

      if (cleanNick.length > 12) {
        setError('Nik maksimum 12 ta belgidan oshmasligi kerak!');
        playSound('pop');
        return;
      }

      const validRegex = /^[a-zA-Z0-9_]{3,12}$/;
      if (!validRegex.test(cleanNick)) {
        setError('Nikda faqat lotin harflari, raqamlar va pastki chiziqcha (_) bo\'lishi shart!');
        playSound('pop');
        return;
      }
    }

    setLoading(true);

    try {
      // If login mode, check credentials
      const existingUser = await fetchUserByPhone(digitsOnly);

      if (mode === 'login') {
        if (existingUser) {
          if (existingUser.password && existingUser.password !== password) {
            setError('Kiritilgan parol noto\'g\'ri! Qaytadan tekshirib yozing.');
            playSound('pop');
            setLoading(false);
            return;
          }
        } else if (!isAdminPhone) {
          setError('Bu telefon raqam bilan akkaunt topilmadi. Iltimos, oldin "Ro\'yxatdan o\'tish" bo\'limida ro\'yxatdan o\'ting.');
          playSound('pop');
          setLoading(false);
          return;
        }
      }

      const effectiveRole: UserRole = isAdminPhone 
        ? 'admin' 
        : mode === 'register' 
        ? role 
        : existingUser?.role || 'buyer';

      const userProfile: UserProfile = {
        id: 'usr_' + digitsOnly,
        phoneNumber: phoneNumber,
        nickname: mode === 'register' ? nickname.trim() : (existingUser?.nickname || (isAdminPhone ? 'SuperAdmin' : `user_${digitsOnly.slice(-4)}`)),
        password: password,
        phoneVerified: false,
        role: effectiveRole,
        createdAt: existingUser?.createdAt || new Date().toISOString()
      };

      setPendingUser(userProfile);

      // Trigger SMS dispatch
      await sendSmsCode(digitsOnly);

    } catch (err) {
      console.error(err);
      setError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  // Send or Resend SMS code
  const sendSmsCode = async (digits: string) => {
    setLoading(true);
    setError('');

    try {
      let code = '';
      try {
        const res = await fetch('/api/auth/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: digits })
        });
        const data = await res.json();
        if (data.code) {
          code = data.code;
        }
      } catch {
        // Fallback random 4-digit code
        code = String(Math.floor(1000 + Math.random() * 9000));
      }

      if (!code) {
        code = String(Math.floor(1000 + Math.random() * 9000));
      }

      // Reset OTP inputs
      setOtpDigits(['', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setStep('otp');

      // Show realistic SMS notification banner
      setTimeout(() => {
        setIncomingSms({ code, show: true });
        playSound('win');
      }, 500);

      // Focus first OTP input
      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 100);

    } catch {
      setError('SMS jo\'natishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);
    setError('');

    if (cleanChar && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Auto-fill code from incoming SMS banner
  const handleAutoFill = () => {
    if (incomingSms?.code && incomingSms.code.length === 4) {
      const chars = incomingSms.code.split('');
      setOtpDigits(chars);
      playSound('click');
      otpInputRefs[3].current?.focus();
    }
  };

  // Step 2: Verify SMS OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = otpDigits.join('');
    if (fullCode.length < 4) {
      setError('Iltimos, 4 xonali tasdiqlash kodini to\'liq kiriting!');
      playSound('pop');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      let isVerified = false;

      // Master code 7777 always passes
      if (fullCode === '7777' || fullCode === incomingSms?.code) {
        isVerified = true;
      } else {
        try {
          const res = await fetch('/api/auth/verify-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: cleanPhone, code: fullCode })
          });
          const data = await res.json();
          if (data.success && data.verified) {
            isVerified = true;
          } else {
            setError(data.error || 'Tasdiqlash kodi noto\'g\'ri!');
          }
        } catch {
          // If server call fails, verify against local code
          if (fullCode === incomingSms?.code) {
            isVerified = true;
          } else {
            setError('Kiritilgan tasdiqlash kodi noto\'g\'ri!');
          }
        }
      }

      if (isVerified && pendingUser) {
        const finalUser: UserProfile = {
          ...pendingUser,
          phoneVerified: true
        };

        playSound('claim');
        onSuccess(finalUser);
      } else if (!error) {
        setError('Tasdiqlash kodi noto\'g\'ri kiritildi!');
        playSound('pop');
      }
    } catch {
      setError('Tasdiqlashda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Incoming SMS Notification Banner */}
        {incomingSms && incomingSms.show && (
          <div className="mx-4 mt-4 p-3.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/40 rounded-2xl shadow-xl text-white flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    📩 Yangi SMS (Aksiyago)
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100">
                  Tasdiqlash kodi: <strong className="text-amber-400 text-sm tracking-widest font-black">{incomingSms.code}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoFill}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              To'ldirish
            </button>
          </div>
        )}

        {/* Top Header Banner */}
        <div className={`p-6 text-white relative transition-colors ${
          isAdminPhone 
            ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900' 
            : 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800'
        }`}>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
              isAdminPhone ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/20 text-amber-300 backdrop-blur-md'
            }`}>
              {step === 'otp' ? (
                <MessageSquare className="w-7 h-7 text-amber-300" />
              ) : isAdminPhone ? (
                <Crown className="w-7 h-7 text-amber-400" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">
                  {step === 'otp' 
                    ? 'SMS Tasdiqlash' 
                    : isAdminPhone 
                    ? 'Super Admin Kirish' 
                    : 'KuponUZ Akkaunti'}
                </h2>
                {isAdminPhone ? (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    👑 ADMIN
                  </span>
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
              </div>
              <p className="text-xs text-emerald-100">
                {step === 'otp'
                  ? 'Telefon raqamga yuborilgan kodni kiriting'
                  : isAdminPhone 
                  ? 'Boshqaruv paneliga xavfsiz kirish' 
                  : mode === 'register' 
                  ? 'Tezkor ro\'yxatdan o\'tish' 
                  : 'Tizimga kirish'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs (Only in Step 1) */}
          {step === 'form' && (
            <div className="flex bg-black/25 p-1 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  playSound('click');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register' 
                    ? 'bg-white text-emerald-900 shadow-sm' 
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Ro'yxatdan o'tish
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  playSound('click');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login' 
                    ? 'bg-white text-emerald-900 shadow-sm' 
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Kirish
              </button>
            </div>
          )}
        </div>

        {/* STEP 1: Registration / Login Form */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Admin phone banner if matched */}
            {isAdminPhone && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-800 text-xs">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold leading-tight">
                  Super Admin raqami aniqlandi! SMS tasdiqlangach to'liq boshqaruv markazi faollashadi.
                </span>
              </div>
            )}

            {/* Telefon Raqami */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Telefon raqamingiz *
                </span>
                <span className="text-[10px] text-slate-400">O'zbekiston (+998)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base">
                  🇺🇿
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="+998 (90) 123-45-67"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all tracking-wide placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Nickname / Taxallus */}
            {(mode === 'register' || (mode === 'login' && isAdminPhone)) && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    Nik (Foydalanuvchi nomi) *
                  </span>
                  <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    nickname.length === 12 
                      ? 'bg-amber-100 text-amber-700' 
                      : nickname.length > 0 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {nickname.length}/12
                  </span>
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    maxLength={12}
                    value={nickname}
                    onChange={handleNicknameChange}
                    placeholder={isAdminPhone ? "super_admin" : "masalan: ali_77 yoki botir_99"}
                    required={mode === 'register'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 leading-tight">
                  <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Maksimal 12 ta belgi
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Faqat harf, raqam va pastki chiziqcha (_)
                  </span>
                </div>
              </div>
            )}

            {/* Parol (Password) Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  {mode === 'register' ? 'Akkaunt uchun maxfiy parol *' : 'Parolingiz *'}
                </span>
                <span className="text-[10px] text-slate-400">Kamida 4 ta belgi</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Yangi parol kiriting' : 'Parolni kiriting'}
                  required
                  minLength={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-11 py-3 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Rol Tanlash (Buyer vs Vendor) */}
            {mode === 'register' && !isAdminPhone && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sizning maqsadingiz:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('buyer');
                      playSound('click');
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      role === 'buyer'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ShoppingBag className={`w-4 h-4 ${role === 'buyer' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {role === 'buyer' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-xs font-bold mt-1">Haridor (Mijoz)</span>
                    <span className="text-[10px] text-slate-500">Chegirmalardan foydalanish</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole('vendor');
                      playSound('click');
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      role === 'vendor'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <StoreIcon className={`w-4 h-4 ${role === 'vendor' ? 'text-emerald-700' : 'text-slate-500'}`} />
                      {role === 'vendor' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-xs font-bold mt-1">Do'kon / Sotuvchi</span>
                    <span className="text-[10px] text-slate-500">Aksiya va e'lon joylash</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2 disabled:opacity-50 ${
                isAdminPhone 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-700/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25'
              }`}
            >
              {loading ? (
                <span>Kutilmoqda...</span>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS Tasdiqlash Kodini Olish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Footer Terms */}
            <p className="text-[11px] text-center text-slate-400">
              Telefon raqamingizga bepul 4 xonali SMS tasdiqlash kodi yuboriladi
            </p>
          </form>
        )}

        {/* STEP 2: SMS OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-5 animate-fadeIn">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Back & Target Phone Display */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    Kod yuborildi:
                  </span>
                  <span className="text-xs font-black text-slate-900 tracking-wide">
                    {phoneNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>O'zgartirish</span>
              </button>
            </div>

            {/* 4-digit segmented OTP input */}
            <div>
              <label className="block text-center text-xs font-bold text-slate-700 mb-3">
                4 xonali SMS kodni kiriting:
              </label>

              <div className="flex justify-center items-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={otpInputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpDigits[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-13 h-14 text-center font-black text-2xl text-slate-900 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-2xl outline-none shadow-xs transition-all tracking-wider"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer & Button */}
            <div className="text-center pt-1">
              {canResend ? (
                <button
                  type="button"
                  onClick={() => sendSmsCode(cleanDigits)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Kodni qaytadan yuborish</span>
                </button>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  Kodni qayta yuborish: <strong className="text-slate-700 font-black">{countdown}s</strong>
                </p>
              )}
            </div>

            {/* Submit Confirmation Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 4}
              className={`w-full py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 ${
                isAdminPhone 
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-700/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25'
              }`}
            >
              {loading ? (
                <span>Tekshirilmoqda...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tasdiqlash va Tizimga Kirish</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
