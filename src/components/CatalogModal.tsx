import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Grid, 
  Flame, 
  Tag, 
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Home,
  Compass,
  Smartphone,
  Tv,
  Shirt,
  Footprints,
  Watch,
  HeartPulse,
  Utensils,
  Wrench,
  Layers,
  Droplets,
  Lightbulb,
  Zap,
  Droplet,
  Package,
  Truck,
  Anchor,
  Shield,
  Wind,
  Paintbrush,
  Hammer,
  Warehouse,
  Car,
  Baby,
  Palette,
  Dumbbell,
  Apple,
  Sparkle,
  PenTool,
  Dog,
  Book,
  Sprout,
  Accessibility
} from 'lucide-react';
import { FULL_CATALOG, FEATURED_COLLECTIONS, CatalogCategory } from '../data/catalogData';
import { playSound } from '../utils/sound';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryName: string) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(FULL_CATALOG[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'categories' | 'subcategories'>('categories');

  useEffect(() => {
    if (isOpen) {
      setMobileView('categories');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategory = FULL_CATALOG.find((c) => c.id === selectedCatId) || FULL_CATALOG[0];

  // Helper to render dynamic icon
  const renderIcon = (name?: string, className = "w-4 h-4") => {
    switch (name) {
      case 'Home': return <Home className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'Smartphone': return <Smartphone className={className} />;
      case 'Tv': return <Tv className={className} />;
      case 'Shirt': return <Shirt className={className} />;
      case 'Footprints': return <Footprints className={className} />;
      case 'Watch': return <Watch className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'HeartPulse': return <HeartPulse className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Droplets': return <Droplets className={className} />;
      case 'Lightbulb': return <Lightbulb className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Droplet': return <Droplet className={className} />;
      case 'Package': return <Package className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'Anchor': return <Anchor className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Wind': return <Wind className={className} />;
      case 'Paintbrush': return <Paintbrush className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      case 'Warehouse': return <Warehouse className={className} />;
      case 'Car': return <Car className={className} />;
      case 'Baby': return <Baby className={className} />;
      case 'Palette': return <Palette className={className} />;
      case 'Dumbbell': return <Dumbbell className={className} />;
      case 'Apple': return <Apple className={className} />;
      case 'Sparkle': return <Sparkle className={className} />;
      case 'PenTool': return <PenTool className={className} />;
      case 'Dog': return <Dog className={className} />;
      case 'Book': return <Book className={className} />;
      case 'Sprout': return <Sprout className={className} />;
      case 'Accessibility': return <Accessibility className={className} />;
      default: return <Grid className={className} />;
    }
  };

  const filteredCategories = FULL_CATALOG.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = cat.name.toLowerCase().includes(q);
    const matchesSub = cat.subcategories?.some((s) => s.name.toLowerCase().includes(q));
    return matchesName || matchesSub;
  });

  const handlePick = (categoryName: string) => {
    playSound('click');
    onSelectCategory(categoryName);
    onClose();
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCatId(catId);
    playSound('click');
    setMobileView('subcategories');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div 
        className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full h-[92vh] sm:h-[88vh] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-800 to-teal-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                <span>Aksiyago Katalogi</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                  Barchasi
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100 truncate max-w-[230px] sm:max-w-md">
                Barcha aksiyadorlik tovarlar va toifalar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Featured Seasonal Bar */}
        <div className="bg-slate-50 px-3 sm:px-4 py-2 border-b border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Maxsus:
          </span>
          {FEATURED_COLLECTIONS.map((fc) => (
            <button
              key={fc.id}
              onClick={() => handlePick(fc.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 text-[11px] font-bold rounded-xl border border-slate-200 shadow-2xs shrink-0 transition-colors cursor-pointer"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${fc.badgeColor}`} />
              <span>{fc.name}</span>
            </button>
          ))}
        </div>

        {/* Search bar inside catalog */}
        <div className="p-2.5 sm:p-3 border-b border-slate-100 bg-white shrink-0">
          <div className="relative w-full max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Katalog bo'yicha qidiring (Mebel, Drellar, Plitka, Santexnika)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Main Content Area: Responsive split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Sidebar / Mobile List View */}
          <div className={`w-full md:w-72 lg:w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto p-2 space-y-1 ${
            mobileView === 'subcategories' ? 'hidden md:block' : 'block'
          }`}>
            <button
              onClick={() => handlePick('all')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-black text-emerald-800 bg-emerald-100/50 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Barcha aksiyalar</span>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>

            {filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedCatId;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-1">
                    <span className={isSelected ? 'text-amber-300' : 'text-slate-500'}>
                      {renderIcon(cat.iconName)}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>

          {/* Subcategories View: On mobile shows when mobileView === 'subcategories', on desktop always visible */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 bg-white ${
            mobileView === 'categories' ? 'hidden md:block' : 'block'
          }`}>
            {/* Mobile Back Button */}
            <div className="md:hidden pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setMobileView('categories')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Barcha toifalar</span>
              </button>
              <span className="text-xs font-bold text-emerald-800 truncate max-w-[170px]">
                {currentCategory.name}
              </span>
            </div>

            {/* Subcategory Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  {renderIcon(currentCategory.iconName, "w-4 h-4 sm:w-5 sm:h-5")}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {currentCategory.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Toifadagi barcha aksiyalar
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePick(currentCategory.name)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
              >
                <span>Barchasi</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Subcategories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {currentCategory.subcategories?.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handlePick(sub.name)}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 leading-tight">
                    {sub.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                </button>
              ))}
            </div>

            {/* Promo banner */}
            <div className="mt-6 p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                  Aksiyago Kafolati
                </span>
                <h4 className="font-black text-xs text-slate-900 mt-1 leading-snug">
                  24 soatga arzon narxda bepul band qilib oling!
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Oldindan to'lov qilinmaydi, do'konda to'lanadi.
                </p>
              </div>

              <button
                onClick={() => handlePick(currentCategory.name)}
                className="px-3.5 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer hover:bg-emerald-900"
              >
                Ochish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
