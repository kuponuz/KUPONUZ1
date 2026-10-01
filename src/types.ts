export interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  savedMoney: number;
  category: string;
  imageUrl: string;
  region: string;
  district: string;
  storeId: string;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  lat: number;
  lng: number;
  paymentMethods: ('cash' | 'card')[];
  totalItems: number;
  claimedCoupons: number;
  isVerifiedStore: boolean;
  isVipTop: boolean;
  isKunox?: boolean;
  isFlashSale?: boolean;
  flashSaleEndsAt?: string;
  status: 'active' | 'pending_review' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  expiresAt: string;
  fraudRiskScore?: number;
  fraudRiskReason?: string;
  savedFoodKg?: number;
  totalCoupons?: number;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  phone: string;
  telegram?: string;
  region: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  isVerified: boolean;
  logoUrl: string;
  rating: number;
  reviewsCount: number;
  hasVip: boolean;
  hasBanner: boolean;
  totalSavedKg?: number;
}

export interface Reservation {
  id: string;
  bookingCode: string;
  code?: string;
  dealId: string;
  dealTitle: string;
  dealImage?: string;
  category?: string;
  storeId?: string;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  region: string;
  district: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent?: number;
  savedMoney: number;
  paymentMethod: 'cash' | 'card';
  customerName?: string;
  customerPhone?: string;
  status: 'reserved' | 'completed' | 'cancelled' | 'active' | 'used';
  reservedAt?: string;
  claimedAt?: string;
  createdAt?: string;
  expiresAt: string;
  qrDataUrl?: string;
  ecoPointsAwarded?: number;
  savedFoodKg?: number;
}

export type Coupon = Reservation;

export interface ChatMessage {
  id: string;
  dealId: string;
  dealTitle: string;
  sender: 'buyer' | 'vendor';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'flash_sale' | 'telegram_post' | 'booking_confirmed' | 'price_drop' | 'system' | 'eco_reward';
  timestamp: string;
  linkDealId?: string;
  read: boolean;
}

export interface PlatformStats {
  totalReservations?: number;
  totalMoneySavedUz: number;
  activeDealsCount?: number;
  totalStoresCount?: number;
  totalSavedFoodKg?: number;
  co2PreventedKg?: number;
  totalCouponsClaimed?: number;
  totalPlatformRevenueUz?: number;
}

export type EcoStats = PlatformStats;

export type UserRole = 'buyer' | 'vendor' | 'admin';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  nickname: string;
  password?: string;
  phoneVerified?: boolean;
  role: UserRole;
  createdAt: string;
}

export interface SpinPrize {
  id: number;
  label: string;
  rewardType: 'points' | 'discount' | 'treat' | 'reroll';
  value: number | string;
  color: string;
}
