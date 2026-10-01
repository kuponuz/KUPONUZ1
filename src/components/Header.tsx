import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  ShoppingBag, 
  MapPin, 
  Award, 
  Heart, 
  Ticket, 
  Bell, 
  Sparkles,
  Map as MapIcon,
  Menu,
  X,
  Navigation,
  User,
  LogOut,
  Grid,
  Zap
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { UZBEKISTAN_REGIONS, TASHKENT_DISTRICTS } from '../data/initialData';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  useGps: boolean;
  onToggleGps: () => void;
  wishlistCount: number;
  couponsCount: number;
  unreadNotifsCount: number;
  currentUser: UserProfile | null;
  adminPhoneNumbers?: string[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenMap: () => void;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onOpenNotifs: () => void;
  onOpenCatalog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedRegion,
  onRegionChange,
  selectedDistrict,
  onDistrictChange,
  useGps,
  onToggleGps,
  wishlistCount,
  couponsCount,
  unreadNotifsCount,
  currentUser,
  adminPhoneNumbers = ['+998938971120'],
  onOpenAuth,
  onLogout,
  onOpenMap,
  onOpenWishlist,
  onOpenCoupons,
  onOpenNotifs,
  onOpenCatalog,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current user is Admin or Vendor
  const userPhoneDigits = currentUser?.phoneNumber ? currentUser.phoneNumber.replace(/\D/g, '') : '';
  const isUserAdmin = Boolean(
    currentUser?.role === 'admin' ||
    userPhoneDigits === '998938971120' ||
    adminPhoneNumbers.some(p => p.replace(/\D/g, '') === userPhoneDigits && userPhoneDigits.length >= 9)
  );

  const isUserVendor = Boolean(currentUser?.role === 'vendor' || isUserAdmin);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      {/* Top micro-bar for platform motto & stats - desktop only */}
      <div className="hidden sm:block bg-emerald-900 text-emerald-100 text-xs py-1 px-4">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-emerald-200 hidden sm:inline">
              Aksiyago — Butun O'zbekiston bo'yicha chegirmalar, aksiyalar va tovarlarni band qilish platformasi
            </span>
            <span className="font-medium text-emerald-200 sm:hidden">
              Aksiyago — Chegirmalar & Aksiyalar
            </span>
          </div>

          <div className="flex items-center gap-2 text-emerald-300 font-medium text-[11px]">
            <span className="text-amber-300 font-bold">⚡ Arzon narxlar kafolati</span>
            <span className="text-emerald-700">|</span>
            <span>Do'konda Naqd yoki Karta orqali to'lov</span>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand Logo & Katalog Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            onClick={() => onRoleChange('buyer')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950">Aksiya</span>
                <span className="text-xl sm:text-2xl font-black text-amber-500">go</span>
              </div>
              <p className="text-[9px] font-bold tracking-wider uppercase text-emerald-700 leading-none">
                Chegirmalar & Aksiyalar
              </p>
            </div>
          </div>

          {/* Prominent "Katalog" Button - unified on all screen sizes */}
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
              title="Katalog"
            >
              <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              <span className="text-[11px] sm:text-xs">Katalog</span>
            </button>
          )}

          {/* Region & Proximity Picker (visible on tablet & desktop) */}
          {currentRole === 'buyer' && (
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <select
                  value={useGps ? 'gps' : selectedRegion}
                  onChange={(e) => {
                    if (e.target.value === 'gps') {
                      if (!useGps) onToggleGps();
                    } else {
                      onRegionChange(e.target.value);
                    }
                  }}
                  className="bg-transparent border-none outline-none font-medium text-slate-800 text-xs cursor-pointer pr-1"
                >
                  <option value="gps">📍 GPS (Eng yaqin)</option>
                  {UZBEKISTAN_REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onOpenMap}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                title="Xaritada do'konlar va chegirmalarni ko'rish"
              >
                <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xarita</span>
              </button>
            </div>
          )}
        </div>

        {/* Role Switcher (Desktop Pills) - ONLY visible to vendors or authorized admins. NEVER to regular buyers! */}
        {(isUserVendor || isUserAdmin) && (
          <div className="hidden xl:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onRoleChange('buyer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRole === 'buyer'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Xaridor</span>
            </button>

            {isUserVendor && (
              <button
                onClick={() => onRoleChange('vendor')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentRole === 'vendor'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Do'kon Kabineti</span>
              </button>
            )}

            {isUserAdmin && (
              <button
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentRole === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-100/70'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>👑 Super Admin</span>
              </button>
            )}
          </div>
        )}

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Region Pill on Mobile */}
          {currentRole === 'buyer' && (
            <button
              onClick={onOpenMap}
              className="lg:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
              title="Hudud va Xarita"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span className="truncate max-w-[70px]">
                {useGps ? 'GPS' : (selectedRegion || 'Barcha viloyatlar').replace(" viloyati", "").replace(" shahri", "")}
              </span>
            </button>
          )}

          {/* Wishlist (Sevimlilar) button - visible on all devices */}
          {currentRole === 'buyer' && (
            <button
              onClick={onOpenWishlist}
              className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 hover:bg-rose-50/60 transition-all cursor-pointer"
              title="Saqlangan sevimlilar (Wishlist)"
            >
              <Heart className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-rose-600 text-white text-[10px] sm:text-[11px] font-black w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>
          )}

          {/* Active reservations button (Band qilinganlar) - visible on all devices */}
          {currentRole === 'buyer' && (
            <button
              onClick={onOpenCoupons}
              className="relative flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              title="Mening band qilgan buyurtmalarim"
            >
              <Ticket className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Bandlar</span>
              {couponsCount > 0 && (
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {couponsCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Bell with prominent live badge */}
          <button
            onClick={onOpenNotifs}
            className="relative p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-700 hover:bg-amber-50/60 transition-all cursor-pointer"
            title="Yangiliklar va bildirishnomalar"
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-amber-500 text-slate-950 text-[10px] sm:text-[11px] font-black w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* User Account / Profile / Auth in Header - visible on all devices */}
          <div className="flex items-center pl-0.5 sm:pl-1 sm:border-l sm:border-slate-200">
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200/80 px-1.5 sm:px-2.5 py-1 rounded-2xl transition-colors">
                <div 
                  onClick={onOpenAuth}
                  className={`w-7 h-7 rounded-xl text-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer ${
                    isUserAdmin ? 'bg-amber-600' : 'bg-emerald-700'
                  }`}
                  title="Mening profilim"
                >
                  {isUserAdmin ? '👑' : currentUser.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left pr-1 cursor-pointer" onClick={onOpenAuth}>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-emerald-950 leading-tight">
                      @{currentUser.nickname}
                    </span>
                    {isUserAdmin && (
                      <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1 rounded-sm">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 leading-tight font-medium">
                    {currentUser.phoneNumber}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Akkauntdan chiqish"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer ml-0.5 sm:ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all hover:scale-102 cursor-pointer"
                title="Kirish / Ro'yxatdan o'tish"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kirish</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle - for admin/vendor switcher and region settings */}
          {(isUserVendor || isUserAdmin) && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Boshqaruv paneli"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg">
          {/* User profile / Login banner */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center text-sm font-black shadow-xs ${
                    isUserAdmin ? 'bg-amber-600' : 'bg-emerald-700'
                  }`}>
                    {isUserAdmin ? '👑' : currentUser.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        @{currentUser.nickname}
                      </p>
                      {isUserAdmin && (
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium leading-tight">
                      {currentUser.phoneNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                >
                  Chiqish
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Kirish yoki Ro'yxatdan o'tish</span>
              </button>
            )}
          </div>

          {/* Mobile role switcher - ONLY visible for authorized vendors or admins. NEVER for plain buyers */}
          {(isUserVendor || isUserAdmin) && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Foydalanuvchi paneli:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onRoleChange('buyer');
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                    currentRole === 'buyer'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Xaridor
                </button>
                {isUserVendor && (
                  <button
                    onClick={() => {
                      onRoleChange('vendor');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                      currentRole === 'vendor'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Do'kon Kabineti
                  </button>
                )}
                {isUserAdmin && (
                  <button
                    onClick={() => {
                      onRoleChange('admin');
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                      currentRole === 'admin'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    👑 Super Admin
                  </button>
                )}
              </div>
            </div>
          )}


          {/* Mobile District Picker */}
          {currentRole === 'buyer' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hudud / Tuman tanlash:
              </p>
              <div className="flex gap-2">
                <select
                  value={useGps ? 'gps' : selectedDistrict}
                  onChange={(e) => {
                    if (e.target.value === 'gps') {
                      if (!useGps) onToggleGps();
                    } else {
                      onDistrictChange(e.target.value);
                    }
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800"
                >
                  <option value="gps">📍 GPS (Eng yaqin 1-3 km)</option>
                  {TASHKENT_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    onOpenMap();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Xarita</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </header>
  );
};
