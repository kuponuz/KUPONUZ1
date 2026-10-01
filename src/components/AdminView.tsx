import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  Store, 
  DollarSign, 
  Leaf, 
  Ticket, 
  TrendingUp,
  ExternalLink,
  MessageSquare,
  Search,
  Eye,
  Crown,
  Users,
  UserPlus,
  Trash2,
  Phone,
  Check
} from 'lucide-react';
import { Deal, Store as StoreType, EcoStats } from '../types';
import { playSound } from '../utils/sound';
import { MASTER_ADMIN_PHONE, MASTER_ADMIN_PHONE_DIGITS } from '../lib/firestoreService';

interface AdminViewProps {
  deals: Deal[];
  stores: StoreType[];
  stats: EcoStats;
  onApproveDeal: (dealId: string) => Promise<void>;
  onRejectDeal: (dealId: string, reason: string) => Promise<void>;
  onToggleVerifyStore: (storeId: string) => Promise<void>;
  onBroadcastPush: (title: string, message: string, sendTelegram: boolean) => Promise<void>;
  adminPhoneNumbers?: string[];
  onAddAdminPhone?: (phone: string) => Promise<boolean>;
  onRemoveAdminPhone?: (phone: string) => Promise<boolean>;
  currentUserPhone?: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  deals,
  stores,
  stats,
  onApproveDeal,
  onRejectDeal,
  onToggleVerifyStore,
  onBroadcastPush,
  adminPhoneNumbers = [MASTER_ADMIN_PHONE],
  onAddAdminPhone,
  onRemoveAdminPhone,
  currentUserPhone = '',
}) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'stores' | 'broadcast' | 'stats' | 'admins'>('moderation');

  // Admin phone numbers state
  const [newAdminInput, setNewAdminInput] = useState('');
  const [adminActionError, setAdminActionError] = useState('');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  // Moderation state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [aiCheckingId, setAiCheckingId] = useState<string | null>(null);
  const [fraudResults, setFraudResults] = useState<Record<string, { score: number; reason: string }>>({});

  // Broadcast & Telegram state
  const [pushTitle, setPushTitle] = useState('🔥 Kechki 19:00+ Maxsus Aksiyalar!');
  const [pushMessage, setPushMessage] = useState('Bugun Safia va Rayhon restoranlaridan 50%+ chegirmada yangi taomlarni xarid qiling va ovqat isrofiga chek qo\'ying!');
  const [sendTelegram, setSendTelegram] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Run AI Fraud & Risk Analysis with Gemini
  const handleRunAiFraudCheck = async (deal: Deal) => {
    setAiCheckingId(deal.id);
    playSound('spin');

    try {
      const res = await fetch('/api/gemini/fraud-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deal.title,
          description: deal.description,
          originalPrice: deal.originalPrice,
          discountPrice: deal.discountPrice,
          savedFoodKg: deal.savedFoodKg,
          storeName: deal.storeName,
        }),
      });

      const data = await res.json();
      setFraudResults((prev) => ({
        ...prev,
        [deal.id]: {
          score: data.riskScore ?? 15,
          reason: data.reason ?? 'Tekshirildi.',
        },
      }));
      playSound('claim');
    } catch (err) {
      console.error('AI firibgarlik tekshiruvida xatolik:', err);
    } finally {
      setAiCheckingId(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushMessage) return;

    setBroadcasting(true);
    try {
      await onBroadcastPush(pushTitle, pushMessage, sendTelegram);
      setBroadcastSuccess(true);
      playSound('win');
      setTimeout(() => setBroadcastSuccess(false), 3500);
    } catch (err) {
      console.error('Push yuborishda xatolik:', err);
    } finally {
      setBroadcasting(false);
    }
  };

  // Navigation tabs
  const pendingDeals = deals.filter((d) => d.status === 'pending_review');

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
    setNewAdminInput(formatted);
    setAdminActionError('');
    setAdminActionSuccess('');
  };

  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    const clean = newAdminInput.replace(/\D/g, '');
    if (clean.length < 12) {
      setAdminActionError('Iltimos, to\'liq telefon raqam kiriting (+998 XX XXX-XX-XX)');
      playSound('pop');
      return;
    }

    if (adminPhoneNumbers.some(p => p.replace(/\D/g, '') === clean)) {
      setAdminActionError('Bu telefon raqam allaqachon adminlar ro\'yxatida mavjud!');
      playSound('pop');
      return;
    }

    setAdminSubmitting(true);
    try {
      if (onAddAdminPhone) {
        const ok = await onAddAdminPhone(newAdminInput);
        if (ok) {
          setAdminActionSuccess(`Raqam (${newAdminInput}) muvaffaqiyatli Super Adminlar safiga qo'shildi!`);
          setNewAdminInput('');
          playSound('claim');
        } else {
          setAdminActionError('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
          playSound('pop');
        }
      }
    } catch {
      setAdminActionError('Xatolik yuz berdi.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    if (clean === MASTER_ADMIN_PHONE_DIGITS) {
      alert("Asosiy Super Admin raqamini o'chirib bo'lmaydi!");
      return;
    }

    setAdminSubmitting(true);
    try {
      if (onRemoveAdminPhone) {
        await onRemoveAdminPhone(phone);
        playSound('pop');
      }
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">
                Super Admin Boshqaruv Markazi
              </h2>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aksiyalar moderatsiyasi, do'konlar verifikatsiyasi va platforma xavfsizligi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-3 py-1.5 rounded-xl">
            Moderatsiyada: {pendingDeals.length} ta aksiya
          </span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Aksiyalar Moderatsiyasi ({pendingDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'stores'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Do'konlarni Verifikatsiya Qilish</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Push va Telegram Avto-Post</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Eko & Moliya Statistikasi</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'admins'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Adminlar Boshqaruvi ({adminPhoneNumbers.length})</span>
        </button>
      </div>

      {/* Tab 1: Moderation with AI Fraud & Scam Detector */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Tekshiruv kutilayotgan aksiyalar
            </h3>
            <span className="text-xs text-slate-500">
              Sotuvchilar joylagan takliflar sanitariya va to'g'ri narx mezonlariga mos bo'lishi kerak
            </span>
          </div>

          {pendingDeals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-slate-800">
                Hozirda yangi tekshiriladigan aksiyalar yo'q!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Barcha e'lonlar moderatsiyadan o'tgan va xaridorlarga ko'rinmoqda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDeals.map((deal) => {
                const fraud = fraudResults[deal.id];
                const isChecking = aiCheckingId === deal.id;

                return (
                  <div
                    key={deal.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-5 justify-between"
                  >
                    <div className="flex gap-4">
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="w-28 h-28 rounded-2xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {deal.title}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Moderatsiyada
                          </span>
                        </div>

                        <p className="text-slate-600 leading-relaxed max-w-xl">
                          {deal.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-slate-700 pt-1">
                          <span>
                            Do'kon: <strong className="text-slate-900">{deal.storeName}</strong> ({deal.district})
                          </span>
                          <span>
                            Telefon: <strong className="text-emerald-700">{deal.storePhone}</strong>
                          </span>
                          <span>
                            Isrofdan saqlanadi: <strong className="text-emerald-800">{deal.savedFoodKg} kg</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <span className="font-extrabold text-sm text-emerald-700">
                            {deal.discountPrice.toLocaleString()} so'm
                          </span>
                          <span className="text-slate-400 line-through text-xs">
                            {deal.originalPrice.toLocaleString()} so'm
                          </span>
                          <span className="bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            -{deal.discountPercent}% Chegirma
                          </span>
                        </div>

                        {/* AI Fraud & Scam Risk Section */}
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          {fraud ? (
                            <div
                              className={`p-3 rounded-xl flex items-start gap-2 text-xs ${
                                fraud.score > 50
                                  ? 'bg-rose-50 border border-rose-200 text-rose-900'
                                  : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                              }`}
                            >
                              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
                              <div>
                                <span className="font-bold block">
                                  AI Firibgarlik Xavfi: {fraud.score}% ({fraud.score > 50 ? 'Shubhali' : 'Xavfsiz / Ishonchli'})
                                </span>
                                <span className="text-[11px] leading-relaxed">
                                  {fraud.reason}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRunAiFraudCheck(deal)}
                              disabled={isChecking}
                              className="text-[11px] bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-purple-700 ${isChecking ? 'animate-spin' : ''}`} />
                              <span>{isChecking ? 'AI Tekshirmoqda...' : 'Gemini AI bilan Firibgarlikni Tekshirish'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row lg:flex-col items-end justify-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => onApproveDeal(deal.id)}
                        className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Tasdiqlash</span>
                      </button>

                      {rejectingId === deal.id ? (
                        <div className="w-64 space-y-2 animate-fade-in text-xs">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rad etish sababi..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                onRejectDeal(deal.id, rejectReason || 'Narx yoki sanitariya talabiga mos kelmadi');
                                setRejectingId(null);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs"
                            >
                              Yuborish
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              Bekor
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectingId(deal.id)}
                          className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rad etish</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Store Verification Management */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Hamkor Do'konlar va Rasmiy Verifikatsiya
            </h3>
            <span className="text-xs text-slate-500">
              Ishonchli va sifatli xizmat ko'rsatuvchi do'konlarga "Verifikatsiyalangan" nishoni beriladi
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-200">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={store.logoUrl}
                      alt={store.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {store.name}
                        </h4>
                        {store.isVerified && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verifikatsiyalangan</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {store.address} ({store.district}) • {store.phone}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Isrofdan saqlagan: {store.totalSavedKg} kg taom
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleVerifyStore(store.id)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      store.isVerified
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
                    }`}
                  >
                    {store.isVerified ? 'Nishonni Olib Tashlash' : 'Verifikatsiya Nishonini Berish'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Broadcast Push & Telegram Auto-Post with Live Preview */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Push Broadcast Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Ommaviy Push va Telegram Xabarnoma
                </h3>
                <p className="text-xs text-slate-500">
                  Barcha xaridorlar ilovasiga va Telegram kanalga bir vaqtda xabar tarqating
                </p>
              </div>
            </div>

            {broadcastSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Xabar barcha foydalanuvchilarga yuborildi va Telegram kanalga joylandi!</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Xabar Sarlavhasi (Push Title) *
                </label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="Masalan: Kechki 19:00+ aksiyalari boshlandi!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Xabar Matni (Post Content) *
                </label>
                <textarea
                  rows={4}
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder="Chegirma haqida batafsil ma'lumot..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  required
                />
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendTelegram}
                    onChange={(e) => setSendTelegram(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-bold text-sky-950 block">
                      Telegram kanalga ham avtomatik post qilish (@kuponuz_deals)
                    </span>
                    <span className="text-[11px] text-sky-700">
                      Jonli ko'rinish o'ng tomondagi Telegram simulatorida aks etadi
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{broadcasting ? 'Yuborilmoqda...' : 'Xabarni Tarqatish & Telegramga Joylash'}</span>
              </button>
            </form>
          </div>

          {/* Telegram Channel Live Preview */}
          <div className="lg:col-span-6">
            <div className="bg-[#0e1621] text-white rounded-3xl p-5 shadow-xl border border-slate-700 flex flex-col justify-between h-full">
              <div>
                {/* Channel Header Simulation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm">
                      K
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-white">Kupon.uz | Rasmiy Aksiyalar</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400 text-[#0e1621]" />
                      </div>
                      <span className="text-[10px] text-slate-400">@kuponuz_deals • 12,450 obunachi</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                    Jonli Preview
                  </span>
                </div>

                {/* Simulated Post Message */}
                <div className="mt-4 bg-[#182533] rounded-2xl p-4 border border-slate-700/80 shadow-md space-y-3">
                  <img
                    src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80"
                    alt="Post Preview"
                    className="w-full h-40 object-cover rounded-xl"
                  />

                  <div className="space-y-1.5">
                    <h5 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <span>{pushTitle || 'Aksiya Sarlavhasi'}</span>
                    </h5>
                    <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                      {pushMessage || 'Aksiya tafsilotlari shu yerda ko\'rinadi...'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-sky-300">
                    <span>🌱 Kupon.uz — Oziq-ovqat isrofiga qarshi harakat</span>
                    <span className="text-slate-400">Hozirgina</span>
                  </div>

                  {/* Channel Action Button */}
                  <a
                    href="https://t.me/kuponuz_deals"
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full text-center py-2 bg-sky-500 hover:bg-sky-400 text-[#0e1621] font-bold rounded-xl text-xs transition-colors"
                  >
                    Kupon.uz Ilovasida Ko'rish
                  </a>
                </div>
              </div>

              <div className="text-center pt-4 text-[11px] text-slate-500">
                Ushbu ko'rinish xabarnoma Telegram kanalga chiqqanda obunachilarga ko'rinadigan aniq dizayn.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Eco & Financial Stats Analytics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Isrofdan saqlangan ovqat:</span>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                {(stats.totalSavedFoodKg || 0).toLocaleString()} kg
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                +14.2% o'tgan haftaga nisbatan
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium">CO2 emissiyasi qisqardi:</span>
              <h4 className="text-2xl font-extrabold text-amber-600 mt-1">
                {(stats.co2PreventedKg || 0).toLocaleString()} kg
              </h4>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">
                Formula: 1 kg taom = 2.5 kg CO2
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Jami olingan kuponlar:</span>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">
                {(stats.totalCouponsClaimed || 0).toLocaleString()} ta
              </h4>
              <span className="text-[10px] text-purple-700 font-bold mt-1 inline-block">
                87% kupon kassada ishlatilgan
              </span>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-500 font-medium">Platforma umumiy tushumi:</span>
              <h4 className="text-2xl font-extrabold text-emerald-800 mt-1">
                {(stats.totalPlatformRevenueUz || 0).toLocaleString()} so'm
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                Monetizatsiya xizmatlaridan sof foyda
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900">
              Monetizatsiya Xizmatlari Taqvimi (Qat'iy narxlar &lt;= 20,000 so'm)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">VIP Top Status</span>
                <span className="text-xl font-extrabold text-amber-600 block mt-1">20,000 so'm</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Qidiruvda birinchi o'ringa ko'tarish (1 oy muddatga)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Tezkor Push-Xabar</span>
                <span className="text-xl font-extrabold text-rose-600 block mt-1">10,000 so'm</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Barcha xaridorlar telefoniga to'g'ridan-to'g'ri xabar
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">Asosiy Sahifa Banneri</span>
                <span className="text-xl font-extrabold text-indigo-600 block mt-1">15,000 so'm</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bosh sahifa yuqorisida reklama banneri (1 hafta)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Phone Numbers Management */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-amber-950/40 border border-amber-600/30 p-6 rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Super Admin Telefon Raqamlari Boshqaruvi
                  <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-300">
                    Maxfiy & Xavfsiz
                  </span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  Ushbu ro'yxatdagi telefon raqam egalari platformaga o'z parollari bilan kirganda 
                  avtomatik tarzda <strong>Super Admin</strong> maqomiga ega bo'ladilar va ushbu 
                  boshqaruv panelini to'liq ko'ra oladilar. Oddiy xaridorlar ushbu panelni va do'kon kabinetini ko'ra olmaydi.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add New Admin Phone */}
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs h-fit space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-sm text-slate-900">
                  Yangi Admin Qo'shish
                </h4>
              </div>

              <form onSubmit={handleAddNewAdmin} className="space-y-3">
                {adminActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{adminActionError}</span>
                  </div>
                )}

                {adminActionSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>{adminActionSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin telefon raqami *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm">
                      🇺🇿
                    </div>
                    <input
                      type="tel"
                      value={newAdminInput}
                      onChange={handlePhoneInputChange}
                      placeholder="+998 (90) 123-45-67"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Masalan: +998 90 123 45 67
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={adminSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-4 h-4" />
                  <span>{adminSubmitting ? 'Qo\'shilmoqda...' : 'Admin Huquqini Berish'}</span>
                </button>
              </form>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-[11px] text-slate-500 leading-tight space-y-1">
                <span className="font-bold text-slate-700 block">💡 Eslatma:</span>
                <p>
                  Yangi qo'shilgan admin saytga o'z telefon raqami va paroli bilan kirganda Super Admin paneli ularga ko'rinadi.
                </p>
              </div>
            </div>

            {/* Right: List of Authorized Admin Phones */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Faol Administratorlar Ro'yxati
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  Jami: {adminPhoneNumbers.length} ta admin
                </span>
              </div>

              <div className="space-y-3">
                {/* Master Admin Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-xs">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 tracking-wide">
                          {MASTER_ADMIN_PHONE}
                        </span>
                        <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Asosiy Bosh Administrator
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-900 font-medium block mt-0.5">
                        Tizim egasi (O'chirib bo'lmaydi)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 bg-amber-200/70 px-3 py-1.5 rounded-xl border border-amber-300">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Doimiy Faol</span>
                  </div>
                </div>

                {/* Additional Admin Cards */}
                {adminPhoneNumbers
                  .filter((p) => p.replace(/\D/g, '') !== MASTER_ADMIN_PHONE_DIGITS)
                  .map((phone, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center shadow-xs text-xs">
                          <ShieldCheck className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 tracking-wide">
                              {phone}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full">
                              Qo'shimcha Admin
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            To'liq moderatsiya va statistika huquqiga ega
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveAdmin(phone)}
                        disabled={adminSubmitting}
                        title="Adminlik huquqini bekor qilish"
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">O'chirish</span>
                      </button>
                    </div>
                  ))}

                {adminPhoneNumbers.filter((p) => p.replace(/\D/g, '') !== MASTER_ADMIN_PHONE_DIGITS).length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Hozircha qo'shimcha adminlar yo'q. Chap tarafdagi forma orqali yangi admin qo'shishingiz mumkin.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
