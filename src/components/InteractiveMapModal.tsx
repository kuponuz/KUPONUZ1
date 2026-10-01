import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Store as StoreIcon, 
  Phone, 
  CheckCircle2, 
  ExternalLink,
  Tag,
  Compass,
  Layers,
  Sparkles,
  ShoppingBag,
  Check
} from 'lucide-react';
import { Deal, Store as StoreType } from '../types';
import { UZBEKISTAN_REGIONS, REGION_DISTRICTS } from '../data/initialData';
import { playSound } from '../utils/sound';

interface InteractiveMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: Deal[];
  stores: StoreType[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  userLat?: number;
  userLng?: number;
  useGps?: boolean;
  onToggleGps?: () => void;
  onSelectDeal: (deal: Deal) => void;
}

// Regional center coordinates and zoom bounding box
const REGION_BOUNDS: Record<string, { lat: number; lng: number; dLat: number; dLng: number }> = {
  'Barcha viloyatlar': { lat: 41.3111, lng: 69.2797, dLat: 0.25, dLng: 0.35 },
  'Toshkent shahri': { lat: 41.3111, lng: 69.2797, dLat: 0.12, dLng: 0.16 },
  'Toshkent viloyati': { lat: 41.2500, lng: 69.5000, dLat: 0.35, dLng: 0.45 },
  'Samarqand': { lat: 39.6542, lng: 66.9597, dLat: 0.15, dLng: 0.20 },
  'Buxoro': { lat: 39.7681, lng: 64.4556, dLat: 0.15, dLng: 0.20 },
  'Farg\'ona': { lat: 40.3842, lng: 71.7843, dLat: 0.15, dLng: 0.22 },
  'Andijon': { lat: 40.7821, lng: 72.3442, dLat: 0.14, dLng: 0.18 },
  'Namangan': { lat: 40.9983, lng: 71.6726, dLat: 0.16, dLng: 0.22 },
  'Qashqadaryo': { lat: 38.8606, lng: 65.7891, dLat: 0.25, dLng: 0.30 },
  'Surxondaryo': { lat: 37.2242, lng: 67.2783, dLat: 0.25, dLng: 0.30 },
  'Xorazm': { lat: 41.5504, lng: 60.6315, dLat: 0.20, dLng: 0.25 },
  'Navoiy': { lat: 40.0844, lng: 65.3792, dLat: 0.25, dLng: 0.30 },
  'Jizzax': { lat: 40.1158, lng: 67.8422, dLat: 0.20, dLng: 0.25 },
  'Sirdaryo': { lat: 40.4897, lng: 68.7842, dLat: 0.20, dLng: 0.25 },
  'Qoraqalpog\'iston': { lat: 42.4602, lng: 59.6166, dLat: 0.35, dLng: 0.45 },
};

export const InteractiveMapModal: React.FC<InteractiveMapModalProps> = ({
  isOpen,
  onClose,
  deals,
  stores,
  selectedRegion,
  onRegionChange,
  selectedDistrict,
  onSelectDistrict,
  userLat = 41.3111,
  userLng = 69.2797,
  useGps = false,
  onToggleGps,
  onSelectDeal,
}) => {
  const [activeRegion, setActiveRegion] = useState(selectedRegion || 'Barcha viloyatlar');
  const [activeDistrict, setActiveDistrict] = useState(selectedDistrict || 'Barcha tumanlar');
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveRegion(selectedRegion || 'Barcha viloyatlar');
      setActiveDistrict(selectedDistrict || 'Barcha tumanlar');
      const currentStores = stores.filter((s) => {
        if (selectedRegion && selectedRegion !== 'Barcha viloyatlar' && s.region !== selectedRegion) return false;
        return true;
      });
      setSelectedStore(currentStores[0] || stores[0] || null);
    }
  }, [isOpen, selectedRegion, selectedDistrict, stores]);

  if (!isOpen) return null;

  // Handle region switch
  const handleRegionSelect = (region: string) => {
    setActiveRegion(region);
    setActiveDistrict('Barcha tumanlar');
    playSound('click');
    const matchingStores = stores.filter((s) => region === 'Barcha viloyatlar' || s.region === region);
    if (matchingStores.length > 0) {
      setSelectedStore(matchingStores[0]);
    }
  };

  // Handle district switch
  const handleDistrictSelect = (district: string) => {
    setActiveDistrict(district);
    playSound('click');
    const matchingStores = stores.filter((s) => {
      if (activeRegion !== 'Barcha viloyatlar' && s.region !== activeRegion) return false;
      if (district !== 'Barcha tumanlar' && s.district !== district) return false;
      return true;
    });
    if (matchingStores.length > 0) {
      setSelectedStore(matchingStores[0]);
    }
  };

  // Apply chosen region to app and close modal
  const handleApplySelection = () => {
    onRegionChange(activeRegion);
    onSelectDistrict(activeDistrict);
    playSound('claim');
    onClose();
  };

  // Available districts for the currently selected region
  const availableDistricts = REGION_DISTRICTS[activeRegion] || ['Barcha tumanlar'];

  // Filter stores by region and district
  const filteredStores = stores.filter((s) => {
    if (activeRegion !== 'Barcha viloyatlar' && s.region && s.region !== activeRegion) return false;
    if (activeDistrict !== 'Barcha tumanlar' && s.district && s.district !== activeDistrict) return false;
    return true;
  });

  // Calculate approximate distance
  const getDistanceKm = (lat1: number, lon1: number, lat2?: number, lon2?: number) => {
    if (typeof lat2 !== 'number' || typeof lon2 !== 'number' || isNaN(lat2) || isNaN(lon2)) {
      return '1.2';
    }
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Map coordinates projection
  const mapWidth = 800;
  const mapHeight = 550;
  const regionConfig = REGION_BOUNDS[activeRegion] || REGION_BOUNDS['Barcha viloyatlar'];

  const minLat = regionConfig.lat - regionConfig.dLat;
  const maxLat = regionConfig.lat + regionConfig.dLat;
  const minLng = regionConfig.lng - regionConfig.dLng;
  const maxLng = regionConfig.lng + regionConfig.dLng;

  const projectToX = (lng?: number) => {
    if (!lng) return mapWidth / 2;
    const clamped = Math.max(minLng, Math.min(maxLng, lng));
    return ((clamped - minLng) / (maxLng - minLng)) * (mapWidth - 80) + 40;
  };

  const projectToY = (lat?: number) => {
    if (!lat) return mapHeight / 2;
    const clamped = Math.max(minLat, Math.min(maxLat, lat));
    return (1 - (clamped - minLat) / (maxLat - minLat)) * (mapHeight - 80) + 40;
  };

  const userX = projectToX(userLng);
  const userY = projectToY(userLat);

  // Deals for the selected store
  const storeDeals = selectedStore
    ? deals.filter((d) => d.storeName === selectedStore.name || d.storeId === selectedStore.id)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-5xl w-full h-[90vh] shadow-2xl border border-emerald-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-700 flex items-center justify-center text-amber-400 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>Hudud va Xaritani Tanlash</span>
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-1.5 py-0.5 rounded-md">
                  O'zbekiston
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200">
                Viloyat, shahar yoki tumaningizni tanlang va yaqin aksiyalarni ko'ring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleGps && (
              <button
                type="button"
                onClick={onToggleGps}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  useGps
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white'
                }`}
                title="GPS orqali joylashuvni aniqlash"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{useGps ? 'GPS Faol' : 'GPS (Mening joylashuvim)'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Region (Viloyat) Selector Bar */}
        <div className="bg-emerald-50/80 border-b border-emerald-200 px-3 sm:px-5 py-2.5 flex items-center gap-2">
          <div className="flex items-center gap-1 text-emerald-950 font-bold text-xs shrink-0">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Viloyat:</span>
          </div>

          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {UZBEKISTAN_REGIONS.map((reg) => {
              const isSelected = activeRegion === reg;
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => handleRegionSelect(reg)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs scale-102 ring-2 ring-emerald-600/30'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-emerald-900'
                  }`}
                >
                  {reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* District (Tuman) Filter Bar */}
        {availableDistricts.length > 1 && (
          <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5" />
              <span>Tuman / Shahar:</span>
            </span>
            {availableDistricts.map((dist) => (
              <button
                key={dist}
                type="button"
                onClick={() => handleDistrictSelect(dist)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeDistrict === dist
                    ? 'bg-amber-500 text-emerald-950 font-black shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {dist}
              </button>
            ))}
          </div>
        )}

        {/* Main Content: Map Visualizer + Sidebar Info */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Interactive SVG Vector Map */}
          <div className="flex-1 bg-gradient-to-br from-slate-100 via-emerald-50/20 to-slate-200 relative overflow-hidden flex items-center justify-center select-none min-h-[260px]">
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="w-full h-full object-cover"
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

              {/* Decorative Roads / River lines */}
              <ellipse
                cx={mapWidth * 0.5}
                cy={mapHeight * 0.52}
                rx={mapWidth * 0.38}
                ry={mapHeight * 0.36}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="5"
                strokeDasharray="8 4"
              />
              <path
                d={`M ${mapWidth * 0.4} 0 Q ${mapWidth * 0.5} ${mapHeight * 0.4} ${mapWidth * 0.45} ${mapHeight * 0.6} T ${mapWidth * 0.3} ${mapHeight}`}
                fill="none"
                stroke="#93c5fd"
                strokeWidth="4"
                opacity="0.6"
              />

              {/* Region Label Watermark */}
              <text
                x={mapWidth / 2}
                y={mapHeight * 0.15}
                textAnchor="middle"
                fontSize="24"
                fontWeight="900"
                fill="#047857"
                opacity="0.25"
                letterSpacing="4"
              >
                {activeRegion.toUpperCase()}
              </text>

              {/* User Location Radar if in region */}
              <g transform={`translate(${userX}, ${userY})`}>
                <circle r="26" fill="#10b981" opacity="0.15" className="animate-ping" />
                <circle r="10" fill="#059669" opacity="0.3" />
                <circle r="5" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                <text y="-12" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#064e3b">
                  📍 Siz shu yerdasiz
                </text>
              </g>

              {/* Store Pins */}
              {filteredStores.map((store) => {
                const px = projectToX(store.lng);
                const py = projectToY(store.lat);
                const isSelected = selectedStore?.id === store.id;

                return (
                  <g
                    key={store.id}
                    transform={`translate(${px}, ${py})`}
                    onClick={() => {
                      setSelectedStore(store);
                      playSound('click');
                    }}
                    className="cursor-pointer group"
                  >
                    {isSelected && (
                      <circle r="22" fill="#f59e0b" opacity="0.35" className="animate-pulse" />
                    )}
                    {/* Pin shape */}
                    <path
                      d="M 0 -22 C -9 -22 -16 -15 -16 -6 C -16 5 0 20 0 20 C 0 20 16 5 16 -6 C 16 -15 9 -22 0 -22 Z"
                      fill={isSelected ? '#d97706' : '#047857'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="filter drop-shadow-md group-hover:scale-110 transition-transform"
                    />
                    <circle cx="0" cy="-6" r="5" fill="#ffffff" />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="bold"
                      fill={isSelected ? '#d97706' : '#047857'}
                    >
                      ★
                    </text>
                    {/* Tooltip / label */}
                    <text
                      x="0"
                      y="32"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#0f172a"
                      className="bg-white/80 px-1"
                    >
                      {store.name.split('—')[0].trim()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Floating Map Summary & Confirm Bar */}
            <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-emerald-200 shadow-lg flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                <span className="font-bold text-slate-800 truncate">
                  Tanlangan: <strong className="text-emerald-700">{activeRegion}</strong> {activeDistrict !== 'Barcha tumanlar' && `(${activeDistrict})`}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  • {filteredStores.length} ta do'kon xaritada
                </span>
              </div>

              <button
                type="button"
                onClick={handleApplySelection}
                className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Hududni Tanlash</span>
              </button>
            </div>
          </div>

          {/* Sidebar: Store Information & Deals */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col h-1/2 md:h-full overflow-hidden">
            {selectedStore ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-block mb-1">
                        {selectedStore.category}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 leading-tight">
                        {selectedStore.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{selectedStore.region}, {selectedStore.district}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-0.5">
                        ⭐ {selectedStore.rating || '4.9'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        ~{getDistanceKm(userLat, userLng, selectedStore.lat, selectedStore.lng)} km
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="truncate pr-2">{selectedStore.address}</span>
                    <a
                      href={`tel:${selectedStore.phone}`}
                      className="text-emerald-700 font-bold hover:underline shrink-0 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Qo'ng'iroq</span>
                    </a>
                  </div>
                </div>

                {/* Deals of this store */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 px-1">
                    <span>Do'kon aksiyalari:</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">{storeDeals.length} ta mavjud</span>
                  </div>

                  {storeDeals.length > 0 ? (
                    storeDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-slate-50 hover:bg-emerald-50/50 p-2.5 rounded-2xl border border-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
                        onClick={() => {
                          onSelectDeal(deal);
                          onClose();
                        }}
                      >
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate group-hover:text-emerald-800">
                            {deal.title}
                          </h5>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 line-through">
                              {deal.originalPrice.toLocaleString()} so'm
                            </span>
                            <span className="text-xs font-black text-emerald-700">
                              {deal.discountPrice.toLocaleString()} so'm
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-amber-600">
                            -{deal.discountPercent}% Chegirma
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1.5 bg-emerald-700 group-hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                        >
                          Band qilish
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Bu hududdagi do'konda hozircha qaynoq chegirmalar yangilanmoqda.
                    </div>
                  )}
                </div>

                {/* Bottom confirm button */}
                <div className="p-3 border-t border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={handleApplySelection}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>«{activeRegion}» aksiyalarini ko'rish</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 text-xs space-y-2">
                <StoreIcon className="w-8 h-8 text-slate-300" />
                <p>Do'kon haqida ma'lumot olish uchun xaritadagi nishonni bosing</p>
                <button
                  type="button"
                  onClick={handleApplySelection}
                  className="mt-2 px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  «{activeRegion}» hududini tanlash
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
