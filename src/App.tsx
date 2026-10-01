import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Deal, 
  Store as StoreType, 
  Coupon, 
  PlatformStats, 
  AppNotification,
  Reservation,
  UserProfile
} from './types';
import { Header } from './components/Header';
import { ClientView } from './components/ClientView';
import { VendorView } from './components/VendorView';
import { AdminView } from './components/AdminView';
import { CouponModal } from './components/CouponModal';
import { AuthModal } from './components/AuthModal';
import { DirectChatModal } from './components/DirectChatModal';
import { InteractiveMapModal } from './components/InteractiveMapModal';
import { WishlistModal } from './components/WishlistModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { CatalogModal } from './components/CatalogModal';
import { INITIAL_DEALS, INITIAL_STORES } from './data/initialData';
import { playSound } from './utils/sound';
import { 
  initFirestoreSeed, 
  fetchDealsFromFirestore, 
  fetchStoresFromFirestore, 
  fetchReservationsFromFirestore, 
  saveReservationToFirestore,
  markReservationCompletedInFirestore,
  saveDealToFirestore,
  saveUserToFirestore,
  fetchAdminPhoneNumbers,
  saveAdminPhoneNumbers,
  MASTER_ADMIN_PHONE,
  MASTER_ADMIN_PHONE_DIGITS
} from './lib/firestoreService';

export default function App() {
  // Current user & role state
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('kuponuz_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [adminPhoneNumbers, setAdminPhoneNumbers] = useState<string[]>([MASTER_ADMIN_PHONE]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<(() => void) | null>(null);

  // Check if current user is Admin or Vendor
  const userPhoneDigits = currentUser?.phoneNumber ? currentUser.phoneNumber.replace(/\D/g, '') : '';
  const isUserAdmin = Boolean(
    currentUser?.role === 'admin' ||
    userPhoneDigits === MASTER_ADMIN_PHONE_DIGITS ||
    adminPhoneNumbers.some(p => p.replace(/\D/g, '') === userPhoneDigits && userPhoneDigits.length >= 9)
  );

  const isUserVendor = Boolean(currentUser?.role === 'vendor' || isUserAdmin);

  // Region and district filter state
  const [selectedRegion, setSelectedRegion] = useState<string>('Barcha viloyatlar');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Barcha tumanlar');
  const [useGps, setUseGps] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 41.3111,
    lng: 69.2797,
  });

  // Data state
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [stores, setStores] = useState<StoreType[]>(INITIAL_STORES);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalSavedFoodKg: 1845.5,
    co2PreventedKg: 4613.75,
    totalReservations: 1240,
    totalCouponsClaimed: 2430,
    totalMoneySavedUz: 348500000,
    totalPlatformRevenueUz: 1650000,
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('aksiyago_wishlist');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['deal-clothes-1', 'deal-tech-1'];
  });

  // Modals state
  const [selectedDealForBooking, setSelectedDealForBooking] = useState<Deal | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [userCoupons, setUserCoupons] = useState<Coupon[]>(() => {
    try {
      const stored = localStorage.getItem('kuponuz_coupons');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [chatDeal, setChatDeal] = useState<Deal | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 4500);
  };

  // Initial Data Fetching: Firestore + Local API Fallback
  const fetchAllData = async () => {
    try {
      // Initialize firestore data check
      await initFirestoreSeed();

      // Fetch from Firestore
      const [firestoreDeals, firestoreStores, firestoreReservations, firestoreAdminPhones] = await Promise.all([
        fetchDealsFromFirestore(),
        fetchStoresFromFirestore(),
        fetchReservationsFromFirestore(),
        fetchAdminPhoneNumbers(),
      ]);

      if (firestoreAdminPhones && firestoreAdminPhones.length > 0) {
        setAdminPhoneNumbers(firestoreAdminPhones);
      }

      if (firestoreDeals && firestoreDeals.length > 0) {
        setDeals(firestoreDeals);
      }
      if (firestoreStores && firestoreStores.length > 0) {
        setStores(firestoreStores);
      }
      if (firestoreReservations && firestoreReservations.length > 0) {
        setReservations(firestoreReservations);
        // Map reservations to coupons
        const mappedCoupons: Coupon[] = firestoreReservations.map((r) => ({
          id: r.id,
          code: r.bookingCode,
          bookingCode: r.bookingCode,
          dealId: r.dealId,
          dealTitle: r.dealTitle,
          storeName: r.storeName,
          storeAddress: r.storeAddress,
          storePhone: r.storePhone,
          region: r.region,
          district: r.district,
          originalPrice: r.originalPrice,
          discountPrice: r.discountPrice,
          savedMoney: r.savedMoney,
          discountPercent: Math.round(((r.originalPrice - r.discountPrice) / r.originalPrice) * 100),
          paymentMethod: r.paymentMethod,
          status: r.status === 'completed' ? 'used' : 'active',
          qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KUPONUZ-${r.bookingCode}`,
          createdAt: r.reservedAt,
          expiresAt: r.expiresAt,
          ecoPointsAwarded: 25,
        }));

        // Merge with local coupons
        const localSaved = (() => {
          try {
            const raw = localStorage.getItem('kuponuz_coupons');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();
        const mergedCoupons = [...mappedCoupons];
        localSaved.forEach((lc: Coupon) => {
          if (!mergedCoupons.some((m) => m.bookingCode === lc.bookingCode || m.id === lc.id)) {
            mergedCoupons.push(lc);
          }
        });
        setUserCoupons(mergedCoupons);
        try {
          localStorage.setItem('kuponuz_coupons', JSON.stringify(mergedCoupons));
        } catch {}
      }

      // Also fetch stats & notifications from server API
      try {
        const [statsRes, notifRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/notifications'),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (notifRes.ok) setNotifications(await notifRes.json());
      } catch {
        // Safe ignore
      }
    } catch (err) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // GPS Geolocation Handler
  const handleToggleGps = () => {
    if (!useGps) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
            setUseGps(true);
            playSound('click');
          },
          (err) => {
            console.warn('GPS ruxsat berilmadi yoki xato:', err);
            setUserCoords({ lat: 41.3111, lng: 69.2797 });
            setUseGps(true);
            playSound('click');
          }
        );
      } else {
        setUseGps(true);
      }
    } else {
      setUseGps(false);
      playSound('click');
    }
  };

  const handleRegionChange = (reg: string) => {
    setUseGps(false);
    setSelectedRegion(reg);
    playSound('click');
  };

  const handleDistrictChange = (district: string) => {
    setUseGps(false);
    setSelectedDistrict(district);
    playSound('click');
  };

  // Wishlist toggle
  const handleToggleWishlist = (dealId: string) => {
    const exists = wishlistIds.includes(dealId);
    playSound(exists ? 'pop' : 'claim');
    const next = exists ? wishlistIds.filter((id) => id !== dealId) : [...wishlistIds, dealId];
    setWishlistIds(next);
    try {
      localStorage.setItem('aksiyago_wishlist', JSON.stringify(next));
    } catch {}
    const deal = deals.find((d) => d.id === dealId);
    const title = deal?.title ? `«${deal.title.slice(0, 28)}...»` : 'Mahsulot';
    showToast(exists ? `${title} sevimlilardan chiqarildi` : `${title} sevimlilarga qo'shildi!`);
  };

  // Auth Handlers
  const handleOpenAuth = () => {
    setIsAuthModalOpen(true);
    playSound('click');
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    const cleanUserPhone = user.phoneNumber.replace(/\D/g, '');
    const isAdmin = cleanUserPhone === MASTER_ADMIN_PHONE_DIGITS ||
      adminPhoneNumbers.some(p => p.replace(/\D/g, '') === cleanUserPhone && cleanUserPhone.length >= 9);

    const finalUser: UserProfile = {
      ...user,
      role: isAdmin ? 'admin' : user.role
    };

    setCurrentUser(finalUser);
    try {
      localStorage.setItem('kuponuz_user', JSON.stringify(finalUser));
      await saveUserToFirestore(finalUser);
    } catch (err) {
      console.warn('Could not save user profile', err);
    }
    setIsAuthModalOpen(false);

    if (isAdmin) {
      setCurrentRole('admin');
      showToast(`👑 Xush kelibsiz, Super Administrator! Boshqaruv paneli faollashtirildi.`);
    } else {
      if (finalUser.role && finalUser.role !== currentRole) {
        setCurrentRole(finalUser.role);
      }
      showToast(`Xush kelibsiz, @${finalUser.nickname}! Tizimga muvaffaqiyatli kirdingiz.`);
    }

    if (pendingActionAfterAuth) {
      pendingActionAfterAuth();
      setPendingActionAfterAuth(null);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('kuponuz_user');
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setCurrentRole('buyer');
    playSound('pop');
    showToast("Akkauntdan muvaffaqiyatli chiqildi.");
  };

  const handleRoleChangeWithAuth = (role: UserRole) => {
    if (role === 'admin') {
      if (!isUserAdmin) {
        showToast("Super Admin paneli faqat ruxsat etilgan adminlar uchun!");
        setIsAuthModalOpen(true);
        playSound('pop');
        return;
      }
      setCurrentRole('admin');
      playSound('click');
      return;
    }

    if (role === 'vendor' && !currentUser) {
      setPendingActionAfterAuth(() => () => {
        setCurrentRole('vendor');
      });
      setIsAuthModalOpen(true);
      playSound('pop');
      showToast("Do'kon kabinetidan foydalanish uchun ro'yxatdan o'ting!");
      return;
    }

    setCurrentRole(role);
    playSound('click');
  };

  const handleAddAdminPhone = async (newPhone: string): Promise<boolean> => {
    try {
      const updated = Array.from(new Set([...adminPhoneNumbers, newPhone]));
      setAdminPhoneNumbers(updated);
      await saveAdminPhoneNumbers(updated);
      showToast(`Admin raqami (${newPhone}) muvaffaqiyatli saqlandi!`);
      return true;
    } catch (err) {
      console.error('Failed to add admin phone:', err);
      return false;
    }
  };

  const handleRemoveAdminPhone = async (phoneToRemove: string): Promise<boolean> => {
    try {
      const updated = adminPhoneNumbers.filter(
        p => p.replace(/\D/g, '') !== phoneToRemove.replace(/\D/g, '')
      );
      setAdminPhoneNumbers(updated);
      await saveAdminPhoneNumbers(updated);
      showToast(`${phoneToRemove} adminlar ro'yxatidan chiqarildi.`);
      return true;
    } catch (err) {
      console.error('Failed to remove admin phone:', err);
      return false;
    }
  };

  // Step 1: User clicks "Band qilish (Bron)" on a deal -> Opens modal for payment selection
  const handleOpenBookingModal = (deal: Deal) => {
    setSelectedDealForBooking(deal);
    setActiveCoupon(null);
    setIsCouponModalOpen(true);
    playSound('click');
  };

  // Step 2: User confirms reservation with payment method (Naqd / Karta)
  const handleConfirmReservation = async (
    paymentMethod: 'cash' | 'card',
    customerName: string,
    customerPhone: string
  ) => {
    if (!selectedDealForBooking) return;

    try {
      playSound('claim');
      const deal = selectedDealForBooking;
      const bookingCode = `KU-BR-${Math.floor(1000 + Math.random() * 9000)}`;
      const reservationId = `res-${Date.now()}`;
      const expiresDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const newReservation: Reservation = {
        id: reservationId,
        bookingCode,
        dealId: deal.id,
        dealTitle: deal.title,
        category: deal.category,
        storeName: deal.storeName,
        storeAddress: deal.storeAddress,
        storePhone: deal.storePhone,
        region: deal.region,
        district: deal.district,
        originalPrice: deal.originalPrice,
        discountPrice: deal.discountPrice,
        savedMoney: deal.savedMoney,
        paymentMethod,
        customerName,
        customerPhone,
        status: 'reserved',
        reservedAt: new Date().toISOString(),
        expiresAt: expiresDate,
      };

      // Save to Firestore
      await saveReservationToFirestore(newReservation);

      // Create local Coupon representation
      const newCoupon: Coupon = {
        id: reservationId,
        code: bookingCode,
        bookingCode,
        dealId: deal.id,
        dealTitle: deal.title,
        storeName: deal.storeName,
        storeAddress: deal.storeAddress,
        storePhone: deal.storePhone,
        region: deal.region,
        district: deal.district,
        originalPrice: deal.originalPrice,
        discountPrice: deal.discountPrice,
        savedMoney: deal.savedMoney,
        discountPercent: deal.discountPercent,
        paymentMethod,
        status: 'active',
        qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KUPONUZ-${bookingCode}`,
        createdAt: newReservation.reservedAt,
        expiresAt: expiresDate,
        ecoPointsAwarded: 25,
      };

      // Update states: switch from booking form to generated ticket view
      setSelectedDealForBooking(null);
      setActiveCoupon(newCoupon);
      setUserCoupons((prev) => {
        const next = [newCoupon, ...prev];
        try {
          localStorage.setItem('kuponuz_coupons', JSON.stringify(next));
        } catch {}
        return next;
      });
      setReservations((prev) => {
        const next = [newReservation, ...prev];
        try {
          localStorage.setItem('kuponuz_reservations', JSON.stringify(next));
        } catch {}
        return next;
      });

      // Update deals count
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deal.id ? { ...d, claimedCoupons: d.claimedCoupons + 1 } : d
        )
      );

      const payText = paymentMethod === 'card' ? 'Plastik karta' : 'Naqd pul';
      showToast(`«${deal.title}» muvaffaqiyatli band qilindi! To'lov usuli: ${payText}. Kod: ${bookingCode}`);
    } catch (err) {
      console.error('Band qilishda xatolik:', err);
      showToast('Band qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
  };

  // Cashier: Redeem / Complete reservation by booking code
  const handleConfirmRedeemReservation = async (bookingCode: string): Promise<boolean> => {
    const foundIndex = reservations.findIndex(
      (r) => r.bookingCode.toUpperCase() === bookingCode.toUpperCase()
    );

    if (foundIndex === -1) return false;

    const res = reservations[foundIndex];
    if (res.status === 'completed') return false;

    try {
      await markReservationCompletedInFirestore(res.id);

      // Update local state
      const updated = { ...res, status: 'completed' as const };
      setReservations((prev) => prev.map((r) => (r.id === res.id ? updated : r)));
      setUserCoupons((prev) =>
        prev.map((c) => (c.id === res.id ? { ...c, status: 'used' } : c))
      );
      if (activeCoupon?.id === res.id) {
        setActiveCoupon((prev) => (prev ? { ...prev, status: 'used' } : null));
      }

      showToast(`Kod ${bookingCode} tasdiqlandi! Mahsulot xaridorga topshirildi.`);
      return true;
    } catch {
      return false;
    }
  };

  // Redeem Coupon directly from CouponModal (Cashier action)
  const handleRedeemCoupon = async (couponId: string) => {
    try {
      await markReservationCompletedInFirestore(couponId);
      setUserCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, status: 'used' } : c))
      );
      if (activeCoupon?.id === couponId) {
        setActiveCoupon((prev) => (prev ? { ...prev, status: 'used' } : null));
      }
      showToast('Kassir to\'lovni qabul qildi va mahsulot topshirildi deb tasdiqladi!');
    } catch (err) {
      console.error('Kuponni ishlatishda xatolik:', err);
    }
  };

  // Open Direct Chat for Deal
  const handleOpenChat = (deal: Deal) => {
    setChatDeal(deal);
    setIsChatModalOpen(true);
    playSound('click');
  };

  // New Deal created by Vendor
  const handleDealCreated = async (newDeal: Deal) => {
    setDeals((prev) => [newDeal, ...prev]);
    await saveDealToFirestore(newDeal);
    showToast(`«${newDeal.title}» e'loni Firestore ma'lumotlar bazasiga saqlandi!`);
  };

  // Vendor Service Purchased
  const handleServicePurchased = async (serviceType: string, dealId?: string) => {
    try {
      await fetch('/api/monetization/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          dealId,
          storeId: 'store-1',
          storeName: 'Zara & Men Style Toshkent',
        }),
      });
      fetchAllData();
    } catch (err) {
      console.error('Xizmat buyurtma qilishda xatolik:', err);
    }
  };

  // Super Admin: Approve Deal
  const handleApproveDeal = async (dealId: string) => {
    try {
      await fetch(`/api/deals/${dealId}/approve`, { method: 'POST' });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: 'active' } : d)));
      playSound('claim');
      showToast('E\'lon tasdiqlandi va saytda barcha foydalanuvchilarga ko\'rindi!');
    } catch (err) {
      console.error('Aksiyani tasdiqlashda xatolik:', err);
    }
  };

  // Super Admin: Reject Deal
  const handleRejectDeal = async (dealId: string, reason: string) => {
    try {
      await fetch(`/api/deals/${dealId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: 'rejected' } : d)));
      playSound('click');
      showToast('E\'lon rad etildi.');
    } catch (err) {
      console.error('Aksiyani rad etishda xatolik:', err);
    }
  };

  // Super Admin: Toggle Store Verification
  const handleToggleVerifyStore = async (storeId: string) => {
    try {
      await fetch(`/api/stores/${storeId}/verify`, { method: 'POST' });
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, isVerified: !s.isVerified } : s))
      );
      playSound('click');
    } catch (err) {
      console.error('Do\'konni verifikatsiya qilishda xatolik:', err);
    }
  };

  // Super Admin: Broadcast Push & Telegram
  const handleBroadcastPush = async (title: string, message: string, sendTelegram: boolean) => {
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, sendTelegram }),
      });
      showToast(`Ommaviy xabar jo'natildi! Telegram: ${sendTelegram ? 'Faol' : 'O\'chirilgan'}`);
      fetchAllData();
    } catch (err) {
      console.error('Ommaviy xabar jo\'natishda xatolik:', err);
    }
  };

  const wishlistDeals = deals.filter((d) => wishlistIds.includes(d.id));

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Main Navigation Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChangeWithAuth}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
        selectedDistrict={selectedDistrict}
        onDistrictChange={handleDistrictChange}
        useGps={useGps}
        onToggleGps={handleToggleGps}
        wishlistCount={wishlistIds.length}
        couponsCount={userCoupons.length}
        unreadNotifsCount={notifications.filter((n) => !n.read).length}
        currentUser={currentUser}
        adminPhoneNumbers={adminPhoneNumbers}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenMap={() => {
          setIsMapModalOpen(true);
          playSound('click');
        }}
        onOpenWishlist={() => {
          setIsWishlistModalOpen(true);
          playSound('click');
        }}
        onOpenCoupons={() => {
          setSelectedDealForBooking(null);
          setActiveCoupon(null);
          setIsCouponModalOpen(true);
          playSound('click');
        }}
        onOpenNotifs={() => {
          setIsNotificationsOpen(true);
          playSound('click');
        }}
        onOpenCatalog={() => {
          setIsCatalogModalOpen(true);
          playSound('click');
        }}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-28 lg:pb-12">
        {(currentRole === 'buyer' || (currentRole === 'admin' && !isUserAdmin) || (currentRole === 'vendor' && !isUserVendor)) && (
          <ClientView
            deals={deals}
            stats={stats}
            selectedRegion={selectedRegion}
            onRegionChange={handleRegionChange}
            selectedDistrict={selectedDistrict}
            useGps={useGps}
            userLat={userCoords.lat}
            userLng={userCoords.lng}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onClaimCoupon={handleOpenBookingModal}
            onOpenChat={handleOpenChat}
            onOpenMap={() => setIsMapModalOpen(true)}
            onOpenCatalog={() => {
              setIsCatalogModalOpen(true);
              playSound('click');
            }}
            selectedCategory={selectedCatalogCategory}
            onSelectCategory={(cat) => {
              setSelectedCatalogCategory(cat);
            }}
          />
        )}

        {currentRole === 'vendor' && isUserVendor && (
          <VendorView
            deals={deals}
            stores={stores}
            reservations={reservations}
            onDealCreated={handleDealCreated}
            onServicePurchased={handleServicePurchased}
            onOpenChat={handleOpenChat}
            onConfirmRedeemReservation={handleConfirmRedeemReservation}
          />
        )}

        {currentRole === 'admin' && isUserAdmin && (
          <AdminView
            deals={deals}
            stores={stores}
            stats={stats as any}
            adminPhoneNumbers={adminPhoneNumbers}
            onAddAdminPhone={handleAddAdminPhone}
            onRemoveAdminPhone={handleRemoveAdminPhone}
            currentUserPhone={currentUser?.phoneNumber || ''}
            onApproveDeal={handleApproveDeal}
            onRejectDeal={handleRejectDeal}
            onToggleVerifyStore={handleToggleVerifyStore}
            onBroadcastPush={handleBroadcastPush}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <CouponModal
        coupon={activeCoupon}
        selectedDeal={selectedDealForBooking}
        isOpen={isCouponModalOpen}
        currentUser={currentUser}
        userCoupons={userCoupons}
        onClose={() => {
          setIsCouponModalOpen(false);
          setSelectedDealForBooking(null);
          setActiveCoupon(null);
        }}
        onSelectCoupon={(c) => {
          setActiveCoupon(c);
        }}
        onConfirmReservation={handleConfirmReservation}
        onRedeem={handleRedeemCoupon}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        adminPhoneNumbers={adminPhoneNumbers}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingActionAfterAuth(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <DirectChatModal
        deal={chatDeal}
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        currentUser={{ name: currentUser ? `@${currentUser.nickname}` : 'Mijoz', role: currentRole }}
      />

      <InteractiveMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        deals={deals}
        stores={stores}
        selectedRegion={selectedRegion}
        onRegionChange={(reg) => {
          handleRegionChange(reg);
          showToast(`📍 Tanlangan viloyat: ${reg}`);
        }}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={(dist) => {
          handleDistrictChange(dist);
          if (dist !== 'Barcha tumanlar') {
            showToast(`📍 Tanlangan hudud: ${dist}`);
          }
        }}
        userLat={userCoords.lat}
        userLng={userCoords.lng}
        useGps={useGps}
        onToggleGps={handleToggleGps}
        onSelectDeal={(deal) => {
          handleOpenBookingModal(deal);
        }}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        wishlistDeals={wishlistDeals}
        onRemoveFromWishlist={handleToggleWishlist}
        onClaimCoupon={handleOpenBookingModal}
      />

      <CatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        onSelectCategory={(cat) => {
          setSelectedCatalogCategory(cat);
          playSound('click');
          showToast(`«${cat}» toifasi bo'yicha e'lonlar saralandi`);
        }}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onSelectDeal={(dealId) => {
          const found = deals.find((d) => d.id === dealId);
          if (found) handleOpenBookingModal(found);
        }}
      />

      {/* Toast Notification Banner - safe above bottom bar on mobile */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 max-w-sm bg-emerald-950/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-start gap-3 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-pulse" />
          <p className="text-xs font-semibold leading-relaxed flex-1">{toastMessage}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-300 py-8 border-t border-emerald-900 mt-auto mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">Aksiyago</span>
            <span className="text-emerald-500">•</span>
            <span>Butun O'zbekiston bo'yicha e'lonlar, chegirmalar va aksiyalar platformasi</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-400 flex-wrap">
            <span>Toshkent, Samarqand, Andijon, Farg'ona, Buxoro...</span>
            <span>Telegram: <a href="https://t.me/aksiyago_deals" target="_blank" rel="noreferrer" className="text-amber-400 font-bold hover:underline">@aksiyago_deals</a></span>
            <span>© {new Date().getFullYear()} Aksiyago</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
