import React, { useState, useRef } from 'react';
import { 
  Store, 
  PlusCircle, 
  Sparkles, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Phone, 
  MapPin, 
  DollarSign, 
  MessageSquare,
  CreditCard,
  Banknote,
  Search,
  ShieldCheck,
  Tag,
  Shirt,
  Smartphone,
  Glasses,
  Watch,
  Tv,
  Utensils,
  Plus,
  Trash2,
  Image as ImageIcon,
  UploadCloud
} from 'lucide-react';
import { Deal, Store as StoreType, Reservation } from '../types';
import { UZBEKISTAN_REGIONS, CATEGORIES } from '../data/initialData';
import { playSound } from '../utils/sound';

interface VendorViewProps {
  deals: Deal[];
  stores: StoreType[];
  reservations?: Reservation[];
  onDealCreated: (newDeal: Deal) => void;
  onServicePurchased: (serviceType: string, dealId?: string) => Promise<void>;
  onOpenChat: (deal: Deal) => void;
  onConfirmRedeemReservation?: (bookingCode: string) => Promise<boolean>;
}

export const VendorView: React.FC<VendorViewProps> = ({
  deals,
  stores,
  reservations = [],
  onDealCreated,
  onServicePurchased,
  onOpenChat,
  onConfirmRedeemReservation,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my_deals' | 'cashier' | 'services'>('create');
  
  // New Deal Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Kiyim-kechak');
  const [originalPrice, setOriginalPrice] = useState('450000');
  const [discountPrice, setDiscountPrice] = useState('220000');
  const [storeName, setStoreName] = useState('Zara & Men Style Toshkent');
  const [storePhone, setStorePhone] = useState('+998 90 321 45 67');
  const [storeAddress, setStoreAddress] = useState('Amir Temur shoh ko\'chasi, 42');
  const [region, setRegion] = useState('Toshkent shahri');
  const [district, setDistrict] = useState('Yunusobod tumani');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalItems, setTotalItems] = useState('15');

  // Handle file upload from mobile gallery / computer
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFormError('Faqat rasm fayllarini yuklash mumkin (JPG, PNG, WEBP)');
      playSound('pop');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError('Rasm hajmi juda katta (maksimal 15 MB). Boshqa rasm tanlang.');
      playSound('pop');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize using canvas for smooth storage & transmission
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setUploadedImage(compressed);
          playSound('click');
        } else {
          setUploadedImage(e.target?.result as string);
          playSound('click');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    playSound('pop');
  };

  // AI SMM Generator State
  const [generatingSmm, setGeneratingSmm] = useState(false);
  const [generatedSmmText, setGeneratedSmmText] = useState('');
  const [copiedSmm, setCopiedSmm] = useState(false);

  // Submitting Deal
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Cashier Verification State
  const [cashierCodeInput, setCashierCodeInput] = useState('');
  const [cashierVerificationMessage, setCashierVerificationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [cashierLoading, setCashierLoading] = useState(false);

  // Purchasing Monetization Service
  const [purchasing, setPurchasing] = useState(false);
  const [serviceMessage, setServiceMessage] = useState('');

  // AI SMM handler
  const handleGenerateSmm = async () => {
    if (!title) {
      setFormError('Iltimos, avval tovar yoki e\'lon nomini kiriting!');
      playSound('pop');
      return;
    }
    setFormError('');

    setGeneratingSmm(true);
    playSound('spin');

    try {
      const res = await fetch('/api/gemini/generate-smm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          originalPrice,
          discountPrice,
          category,
          storeName,
          region,
          district,
        }),
      });

      const data = await res.json();
      if (data.text) {
        setGeneratedSmmText(data.text);
        playSound('win');
      }
    } catch (err) {
      console.error('SMM matn yaratishda xatolik:', err);
    } finally {
      setGeneratingSmm(false);
    }
  };

  const handleCopySmm = () => {
    navigator.clipboard.writeText(generatedSmmText);
    setCopiedSmm(true);
    playSound('click');
    setTimeout(() => setCopiedSmm(false), 2000);
  };

  // Submit Deal Form
  const handleSubmitDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !originalPrice || !discountPrice || !storePhone) {
      setFormError('Iltimos, barcha majburiy maydonlarni to\'ldiring!');
      playSound('pop');
      return;
    }
    if (!uploadedImage) {
      setFormError('Iltimos, mahsulot rasmini telefon yoki kompyuteringizdan yuklang (+ tugmasini bosing)!');
      playSound('pop');
      return;
    }
    setFormError('');

    const imgToUse = uploadedImage;
    setSubmitting(true);

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          originalPrice,
          discountPrice,
          category,
          imageUrl: imgToUse,
          storeName,
          storePhone,
          storeAddress,
          region,
          district,
          totalItems: Number(totalItems) || 10,
          lat: 41.3111,
          lng: 69.2797,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onDealCreated(created);
        setSubmitSuccess(true);
        setUploadedImage('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        playSound('claim');
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('my_deals');
        }, 1800);
      }
    } catch (err) {
      console.error('Aksiya yaratishda xatolik:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Cashier Verify Handler
  const handleCashierVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = cashierCodeInput.trim().toUpperCase();
    if (!code) return;

    setCashierLoading(true);
    setCashierVerificationMessage(null);

    if (onConfirmRedeemReservation) {
      const success = await onConfirmRedeemReservation(code);
      if (success) {
        setCashierVerificationMessage({
          text: `Kod «${code}» tasdiqlandi! To'lov muvaffaqiyatli qabul qilindi va mahsulot xaridorga topshirildi.`,
          type: 'success',
        });
        playSound('win');
        setCashierCodeInput('');
      } else {
        setCashierVerificationMessage({
          text: `«${code}» kodi bo'yicha faol bron topilmadi yoki allaqachon foydalanilgan.`,
          type: 'error',
        });
        playSound('pop');
      }
    }
    setCashierLoading(false);
  };

  // Purchase Monetization Service
  const handleBuyService = async (serviceType: string, dealId?: string) => {
    setPurchasing(true);
    try {
      await onServicePurchased(serviceType, dealId);
      playSound('win');
      setServiceMessage('Xizmat faollashtirildi! To\'lov tasdiqlandi.');
      setTimeout(() => setServiceMessage(''), 4000);
    } catch (err) {
      console.error('Xizmat sotib olishda xatolik:', err);
    } finally {
      setPurchasing(false);
    }
  };

  const myDeals = deals.filter((d) => d.storeName === storeName || d.storeId === 'store-vendor-custom' || d.storeId === 'store-1');

  return (
    <div className="space-y-6 pb-16">
      {/* Top Store Info Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-3xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{storeName}</h2>
              <span className="bg-emerald-500/30 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                Hamkor Do'kon
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-1 flex items-center gap-2 flex-wrap">
              <span>📍 {region}, {district} ({storeAddress})</span>
              <span>•</span>
              <span>📞 {storePhone}</span>
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-emerald-300 block">Mening aksiyalarim</span>
            <span className="text-base font-extrabold text-white">{myDeals.length} ta</span>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-emerald-300 block">Qabul: Naqd & Karta</span>
            <span className="text-base font-extrabold text-amber-300">Faol</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Yangi Aksiya Qo'shish</span>
        </button>

        <button
          onClick={() => setActiveTab('my_deals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'my_deals'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Mening E'lonlarim ({myDeals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cashier')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'cashier'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Kassir: Bronni Tekshirish</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Pullik Xizmatlar (VIP)</span>
        </button>
      </div>

      {/* Service feedback */}
      {serviceMessage && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>{serviceMessage}</span>
        </div>
      )}

      {/* TAB 1: Create Deal Form + AI SMM Post Generator */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div className="mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                Yangi Chegirmali E'lon Joylashtirish
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiyim-kechak, telefon, soat, maishiy texnika yoki taomlar aksiyasini e'lon qiling
              </p>
            </div>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-semibold flex items-center justify-between">
                <span>{formError}</span>
                <button type="button" onClick={() => setFormError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
              </div>
            )}

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-extrabold text-emerald-950">
                  E'lon muvaffaqiyatli topshirildi!
                </h4>
                <p className="text-xs text-emerald-700">
                  Tez orada xaridorlar ro'yxatida faol bo'ladi va odamlar band qilishlari mumkin.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeal} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mahsulot yoki E'lon Nomi *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Erkaklar qishki issiq kurtkasi yoki Smartfon zaryadlagichi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Category & Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Toifa *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    >
                      {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mavjud dona soni *
                    </label>
                    <input
                      type="number"
                      value={totalItems}
                      onChange={(e) => setTotalItems(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Pricing: Original & Discount */}
                <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Asl narxi (so'm) *
                    </label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-emerald-800 mb-1">
                      Chegirmali narx (so'm) *
                    </label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-emerald-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">
                      Mijoz tejaydigan summa: {(Number(originalPrice) - Number(discountPrice)).toLocaleString()} so'm
                    </span>
                    <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                      Chegirma: {Math.max(0, Math.round(((Number(originalPrice) - Number(discountPrice)) / Number(originalPrice)) * 100))}%
                    </span>
                  </div>
                </div>

                {/* Region & District Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Viloyat / Shahar *
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {UZBEKISTAN_REGIONS.filter((r) => r !== 'Barcha viloyatlar').map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tuman yoki Shaxar *
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Masalan: Yunusobod tumani"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Phone & Address */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bog'lanish Telefoni *</span>
                    </label>
                    <input
                      type="text"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Do'kon Manzili *</span>
                    </label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Amir Temur shoh ko'chasi, 42"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      required
                    />
                  </div>
                </div>

                {/* Payment methods accepted */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="block font-bold text-slate-700 mb-1.5">Qabul qilinadigan to'lov turlari:</span>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <input type="checkbox" defaultChecked disabled className="rounded text-emerald-600" />
                      <span>💵 Naqd pulda</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <input type="checkbox" defaultChecked disabled className="rounded text-emerald-600" />
                      <span>💳 Karta orqali (Uzcard / Humo)</span>
                    </label>
                  </div>
                </div>

                {/* Mahsulot Rasmi — Kvadrat Upload Dizayn */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Mahsulot Rasmi *</span>
                    {uploadedImage && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Rasm yuklandi
                      </span>
                    )}
                  </label>

                  {/* Hidden file input for phone gallery or computer */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Kvadrat Dizayn (Square Box) with + in the middle */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative w-44 h-44 sm:w-52 sm:h-52 aspect-square rounded-3xl cursor-pointer border-2 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden group select-none shadow-xs ${
                      uploadedImage
                        ? 'border-emerald-600 bg-slate-900 shadow-md ring-2 ring-emerald-500/20'
                        : isDragging
                        ? 'border-emerald-600 bg-emerald-100/70 scale-102 border-dashed'
                        : 'border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40'
                    }`}
                  >
                    {uploadedImage ? (
                      <>
                        {/* Image Preview */}
                        <img
                          src={uploadedImage}
                          alt="Tanlangan mahsulot rasmi"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-3 text-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-1 text-white">
                            <Plus className="w-6 h-6 stroke-[2.5]" />
                          </div>
                          <span className="text-xs font-bold">Rasmni almashtirish</span>
                          <span className="text-[10px] text-white/85">Galereyadan yangisini tanlash</span>
                        </div>

                        {/* Remove Image Button */}
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          title="Rasmni o'chirish"
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        {/* Big + in circle center */}
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-110 transition-all mb-2.5">
                          <Plus className="w-8 h-8 stroke-[3]" />
                        </div>

                        <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-800 transition-colors">
                          Rasm qo'shish
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1 leading-tight max-w-[170px]">
                          Galereya yoki kompyuterdan tanlash uchun bosing
                        </span>
                        <span className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                          + Tanlash
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <span>Saqlanmoqda...</span>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>E'lonni E'lon Qilish</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* AI SMM Generator Assistant */}
          <div className="lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Telegram / Instagram SMM Yordamchisi</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                Gemini AI e'loningiz uchun Telegram kanalingizga yoki Instagram sahifangizga mos chiroyli, jozibador reklama postini bir zumda tayyorlab beradi.
              </p>

              <button
                type="button"
                onClick={handleGenerateSmm}
                disabled={generatingSmm}
                className="mt-4 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {generatingSmm ? (
                  <span>AI Post Yozmoqda...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Telegram Post Matnini Generatsiya Qilish</span>
                  </>
                )}
              </button>

              {generatedSmmText && (
                <div className="mt-4 bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800">Tayyor reklama posti:</span>
                    <button
                      onClick={handleCopySmm}
                      className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedSmm ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nusxa olish</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono">
                    {generatedSmmText}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-amber-100/60 rounded-2xl p-3 text-[11px] text-amber-900">
              💡 <strong>Maslahat:</strong> Chegirma 40% dan yuqori bo'lgan mahsulotlar 3 barobar tezroq xarid qilinadi!
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Deals */}
      {activeTab === 'my_deals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">
              Mening E'lonlarim ({myDeals.length})
            </h3>
            <button
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-1.5 bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Yangi aksiya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        deal.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : deal.status === 'pending_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {deal.status === 'active'
                        ? 'Faol'
                        : deal.status === 'pending_review'
                        ? 'Moderatsiyada'
                        : 'Rad etilgan'}
                    </span>

                    {deal.isVipTop && (
                      <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                        VIP TOP
                      </span>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                    {deal.title}
                  </h4>
                  <p className="text-xs text-emerald-800 font-bold mt-1">
                    {deal.discountPrice.toLocaleString()} so'm{' '}
                    <span className="text-slate-400 line-through text-[11px] font-normal">
                      {deal.originalPrice.toLocaleString()} so'm
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Band qilingan: <strong className="text-slate-900">{deal.claimedCoupons} dona</strong>
                  </span>

                  <button
                    onClick={() => onOpenChat(deal)}
                    className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Xaridorlar savollari"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Cashier Reservation Verification */}
      {activeTab === 'cashier' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Kassir: Xaridor Bronini Tekshirish
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Xaridor do'koningizga kelganda ko'rsatgan bron kodini (masalan: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-emerald-800">KU-BR-5291</code>) kiriting va to'lovni tasdiqlang.
            </p>
          </div>

          <form onSubmit={handleCashierVerify} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={cashierCodeInput}
                onChange={(e) => setCashierCodeInput(e.target.value)}
                placeholder="Bron kodini kiriting (KU-BR-...)"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 rounded-2xl py-3.5 pl-4 pr-32 text-sm font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:bg-white"
              />
              <button
                type="submit"
                disabled={cashierLoading || !cashierCodeInput.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                {cashierLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </form>

          {cashierVerificationMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                cashierVerificationMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border border-rose-300 text-rose-900'
              }`}
            >
              {cashierVerificationMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{cashierVerificationMessage.text}</span>
            </div>
          )}

          {/* Quick List of Active Reservations */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-700 mb-3">
              So'nggi band qilingan buyurtmalar:
            </h4>
            {reservations.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Hozircha faol bronlar yo'q.</p>
            ) : (
              <div className="space-y-2">
                {reservations.slice(0, 5).map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{res.dealTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Mijoz: {res.customerName} ({res.customerPhone}) • Kod: <span className="font-mono font-bold text-emerald-800">{res.bookingCode}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-emerald-950 block">
                        {res.discountPrice.toLocaleString()} so'm
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {res.paymentMethod === 'card' ? '💳 Karta' : '💵 Naqd'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Pullik Xizmatlar (Monetizatsiya - Strict max 20,000 UZS) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-950">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-lg">
                Do'konni Rivojlantirish Xizmatlari
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
              Aksiyalaringizni minglab xaridorlarga birinchi bo'lib ko'rsating. Barcha pullik xizmatlar narxi do'konlar uchun qulay va 20,000 so'mdan oshmasligi qat'iy belgilangan!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* VIP Top Status */}
            <div className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-md flex flex-col justify-between space-y-4 relative">
              <div className="absolute -top-3 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Ommabop
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  VIP Top Status
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Aksiyangizni qidiruv va katalogda 1-o'ringa ko'taradi hamda oltin rangli VIP nishoni beriladi.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-2xl font-black text-slate-900">20,000</span>
                  <span className="text-xs text-slate-500 ml-1">so'm / oy</span>
                </div>
              </div>

              <button
                onClick={() => handleBuyService('vip_top', myDeals[0]?.id)}
                disabled={purchasing || myDeals.length === 0}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Faollashtirish (Click / Payme)</span>
              </button>
            </div>

            {/* Instant Push */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Tezkor Push-Xabar
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Ilovadagi barcha xaridorlar smartfoniga sizning chegirmangiz haqida zudlik bilan bildirishnoma yuboriladi.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-2xl font-black text-slate-900">10,000</span>
                  <span className="text-xs text-slate-500 ml-1">so'm / 1 marta</span>
                </div>
              </div>

              <button
                onClick={() => handleBuyService('instant_push', myDeals[0]?.id)}
                disabled={purchasing || myDeals.length === 0}
                className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Push Yuborish (10,000 so'm)</span>
              </button>
            </div>

            {/* Home Banner */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Store className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Asosiy Sahifa Banneri
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Kupon.uz bosh sahifasining eng yuqori qismida do'koningiz rasmi va logotipi 1 hafta davomida namoyish etiladi.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-2xl font-black text-slate-900">15,000</span>
                  <span className="text-xs text-slate-500 ml-1">so'm / 1 hafta</span>
                </div>
              </div>

              <button
                onClick={() => handleBuyService('home_banner')}
                disabled={purchasing}
                className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Banner Olish (15,000 so'm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
