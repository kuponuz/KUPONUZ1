import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  MapPin, 
  Phone, 
  Heart, 
  MessageSquare, 
  Flame, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  CreditCard,
  Banknote,
  Shirt,
  Smartphone,
  Glasses,
  Watch,
  Tv,
  Utensils,
  Pizza,
  Zap,
  Tag,
  Laptop,
  Coffee,
  Dumbbell,
  Car,
  Home,
  Baby,
  BookOpen,
  Briefcase,
  Grid
} from 'lucide-react';
import { Deal, PlatformStats } from '../types';
import { CATEGORIES, UZBEKISTAN_REGIONS } from '../data/initialData';
import { FULL_CATALOG, FEATURED_COLLECTIONS } from '../data/catalogData';
import { playSound } from '../utils/sound';

interface ClientViewProps {
  deals: Deal[];
  stats: PlatformStats;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedDistrict: string;
  useGps: boolean;
  userLat?: number;
  userLng?: number;
  wishlistIds: string[];
  onToggleWishlist: (dealId: string) => void;
  onClaimCoupon: (deal: Deal) => void;
  onOpenChat: (deal: Deal) => void;
  onOpenMap: () => void;
  onOpenCatalog?: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  deals,
  stats,
  selectedRegion,
  onRegionChange,
  selectedDistrict,
  useGps,
  userLat = 41.3111,
  userLng = 69.2797,
  wishlistIds,
  onToggleWishlist,
  onClaimCoupon,
  onOpenChat,
  onOpenMap,
  onOpenCatalog,
  selectedCategory: externalCategory,
  onSelectCategory: externalSetCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalCategory, setInternalCategory] = useState('all');
  const activeCategory = externalCategory !== undefined ? externalCategory : internalCategory;

  const handleCategoryChange = (cat: string) => {
    if (externalSetCategory) {
      externalSetCategory(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'vip'>('all');

  // Category Icon helper
  const renderCategoryIcon = (id: string, className = 'w-4 h-4') => {
    switch (id) {
      case 'Kiyim-kechak':
        return <Shirt className={className} />;
      case 'Telefon & Aksessuarlar':
        return <Smartphone className={className} />;
      case 'Kompyuter & Texnika':
        return <Laptop className={className} />;
      case 'Ko\'zoynaklar':
        return <Glasses className={className} />;
      case 'Soatlar':
        return <Watch className={className} />;
      case 'Maishiy texnika':
        return <Tv className={className} />;
      case 'Restoran & Kafe':
        return <Coffee className={className} />;
      case 'Idish-tovoq':
        return <Utensils className={className} />;
      case 'Oziq-ovqat':
        return <Pizza className={className} />;
      case 'Sport & Fitnes':
        return <Dumbbell className={className} />;
      case 'Avto & Texxizmat':
        return <Car className={className} />;
      case 'Uy & Mebel':
        return <Home className={className} />;
      case 'Bolalar dunyosi':
        return <Baby className={className} />;
      case 'Kitoblar':
        return <BookOpen className={className} />;
      case 'Xizmatlar & Ta\'lim':
        return <Briefcase className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Distance helper
  const calcDistance = (lat?: number, lng?: number) => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return '1.0';
    }
    const R = 6371;
    const dLat = ((lat - userLat) * Math.PI) / 180;
    const dLon = ((lng - userLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Filter deals
  const filteredDeals = deals.filter((d) => {
    if (d.status !== 'active') return false;

    if (activeTab === 'hot' && d.discountPercent < 45) return false;
    if (activeTab === 'vip' && !d.isVipTop) return false;

    if (activeCategory !== 'all') {
      const qCat = activeCategory.toLowerCase();
      const matchCategory = (d.category || '').toLowerCase() === qCat;
      const matchTitle = (d.title || '').toLowerCase().includes(qCat);
      const matchDesc = (d.description || '').toLowerCase().includes(qCat);
      if (!matchCategory && !matchTitle && !matchDesc) return false;
    }

    if (selectedRegion !== 'Barcha viloyatlar' && d.region && d.region !== selectedRegion) {
      return false;
    }

    if (selectedDistrict && selectedDistrict !== 'Barcha tumanlar' && d.district && d.district !== selectedDistrict) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.storeName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        (d.region && d.region.toLowerCase().includes(q)) ||
        (d.district && d.district.toLowerCase().includes(q))
      );
    }

    return true;
  });

  // Sort: VIP first, then newest
  const sortedDeals = [...filteredDeals].sort((a, b) => {
    const aVip = Boolean(a.isVipTop);
    const bVip = Boolean(b.isVipTop);
    if (aVip && !bVip) return -1;
    if (!aVip && bVip) return 1;
    const aDisc = typeof a.discountPercent === 'number' ? a.discountPercent : 0;
    const bDisc = typeof b.discountPercent === 'number' ? b.discountPercent : 0;
    return bDisc - aDisc;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hero / Uzbekistan Wide Deals Section */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-800/80 border border-emerald-700/80 text-amber-300 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold mb-2.5 sm:mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Butun O'zbekiston bo'yicha aksiyalar platformasi</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Aksiyago — Qaynoq aksiyalar, <span className="text-amber-400">arzon narxlar kafolati!</span>
          </h1>

          <p className="text-xs sm:text-base text-emerald-100/90 mt-2 sm:mt-3 leading-relaxed max-w-2xl font-normal hidden sm:block">
            O'zingizga yaqin do'konlarning eng qaynoq aksiyalarini toping. To'lov turini (Naqd yoki Karta) tanlab, tovarlarni arzon narxda 24 soatga bepul band qilib oling!
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3.5 sm:mt-6 pt-3.5 sm:pt-6 border-t border-emerald-800/60 text-[10px] sm:text-xs">
            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-xs">
              <span className="text-emerald-300 font-medium block text-[9px] sm:text-xs">Tejalgan pul:</span>
              <span className="text-xs sm:text-lg font-extrabold text-white mt-0.5 block truncate">
                {(stats.totalMoneySavedUz || 348500000).toLocaleString()} so'm
              </span>
            </div>

            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-xs">
              <span className="text-emerald-300 font-medium block text-[9px] sm:text-xs">Band qilinganlar:</span>
              <span className="text-xs sm:text-lg font-extrabold text-amber-300 mt-0.5 block">
                {(stats.totalReservations || 1240).toLocaleString()}+ ta
              </span>
            </div>

            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-xs">
              <span className="text-emerald-300 font-medium block text-[9px] sm:text-xs">Qamrov:</span>
              <span className="text-xs sm:text-lg font-extrabold text-white mt-0.5 block">
                14 ta viloyat
              </span>
            </div>

            <div className="bg-emerald-900/60 border border-emerald-700/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 backdrop-blur-xs">
              <span className="text-emerald-300 font-medium block text-[9px] sm:text-xs">To'lov turi:</span>
              <span className="text-xs sm:text-lg font-extrabold text-emerald-300 mt-0.5 block">
                Naqd / Karta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Region Selector Bar & Search */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xs border border-slate-200 space-y-3 sm:space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Region Dropdown */}
          <div className="w-full md:w-64 shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="bg-transparent border-none outline-none w-full font-bold text-slate-800 cursor-pointer text-xs"
            >
              {UZBEKISTAN_REGIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot, do'kon yoki toifa bo'yicha qidiruv (mebel, drellar, kiyim, telefon, soat, plitka)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
          </div>

          {/* Map quick button */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={onOpenMap}
              className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-2xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Xaritada</span>
            </button>
          </div>
        </div>

        {/* Category Carousel / Pills */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Mega-Catalog Open Button */}
            {onOpenCatalog && (
              <button
                onClick={onOpenCatalog}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl text-xs font-black shadow-xs whitespace-nowrap transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <Grid className="w-4 h-4 text-amber-300" />
                <span>Barcha Katalog</span>
              </button>
            )}

            {/* Special Collections */}
            {FEATURED_COLLECTIONS.map((fc) => {
              const isActive = activeCategory === fc.id;
              return (
                <button
                  key={fc.id}
                  onClick={() => {
                    handleCategoryChange(fc.id);
                    playSound('click');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs scale-102 font-black'
                      : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>{fc.name}</span>
                </button>
              );
            })}

            {/* Standard and New Categories */}
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    handleCategoryChange(cat.id);
                    playSound('click');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs scale-102'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  {renderCategoryIcon(cat.id)}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Filter (Barchasi | Qaynoq Chegirmalar | VIP Top) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Barcha E'lonlar ({filteredDeals.length})
          </button>
          <button
            onClick={() => setActiveTab('hot')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'hot' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>50%+ Qaynoq Chegirmalar</span>
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vip' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-amber-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Top Do'konlar</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hudud: <strong className="text-slate-800">{selectedRegion}</strong>
        </div>
      </div>

      {/* Deals Grid */}
      {sortedDeals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">Ushbu toifada hozircha aksiya topilmadi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Boshqa toifani yoki «Barcha viloyatlar» bandini tanlab ko'ring. Tez orada yangi e'lonlar qo'shiladi!
          </p>
          <button
            onClick={() => {
              handleCategoryChange('all');
              onRegionChange('Barcha viloyatlar');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 transition-colors"
          >
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {sortedDeals.map((deal) => {
            const isWishlisted = wishlistIds.includes(deal.id);
            const remainingCount = Math.max(1, deal.totalItems - deal.claimedCoupons);

            return (
              <div
                key={deal.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Discount percentage tag */}
                  <div className="absolute top-2 left-2 bg-rose-600 text-white font-black text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                    <TrendingDown className="w-2.5 h-2.5" />
                    <span>-{deal.discountPercent}%</span>
                  </div>

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => onToggleWishlist(deal.id)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                    title="Sevimlilarga qo'shish"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* VIP Badge */}
                  {deal.isVipTop && (
                    <div className="absolute bottom-2 left-2 bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>TOP</span>
                    </div>
                  )}

                  {/* Category pill */}
                  <div className="hidden sm:block absolute bottom-2 right-2 bg-emerald-950/85 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {deal.category}
                  </div>
                </div>

                {/* Content body */}
                <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-3">
                  <div>
                    {/* Store and Location Header */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 mb-0.5">
                      <div className="flex items-center gap-0.5 font-bold text-slate-800 truncate pr-1">
                        <span className="truncate max-w-[90px] sm:max-w-none">{deal.storeName}</span>
                        {deal.isVerifiedStore && (
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 text-emerald-800 shrink-0 font-bold bg-emerald-50 px-1 py-0.2 rounded text-[8px] sm:text-[9px]">
                        <MapPin className="w-2 h-2 text-emerald-600" />
                        <span className="truncate max-w-[60px] sm:max-w-[80px]">{deal.district || deal.region || 'Toshkent'}</span>
                      </div>
                    </div>

                    {/* Deal Title */}
                    <h3 className="font-extrabold text-[11px] sm:text-sm text-slate-900 leading-snug line-clamp-2 min-h-[1.9rem] sm:min-h-[2.4rem]">
                      {deal.title}
                    </h3>
                  </div>

                  {/* Payment Methods and Price Row */}
                  <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between gap-1">
                      <div>
                        <span className="text-[9px] sm:text-[11px] text-slate-400 line-through block font-medium">
                          {deal.originalPrice.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-base font-black text-emerald-950 block leading-none sm:leading-tight">
                          {deal.discountPrice.toLocaleString()} <span className="text-[9px] sm:text-xs font-semibold">so'm</span>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.2 rounded block">
                          +{deal.savedMoney.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      <button
                        onClick={() => onClaimCoupon(deal)}
                        className="col-span-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white rounded-xl font-black text-[11px] sm:text-xs shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Band qilish</span>
                      </button>

                      <button
                        onClick={() => onOpenChat(deal)}
                        className="col-span-1 p-1.5 sm:p-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="Do'konga savol berish (Chat)"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
