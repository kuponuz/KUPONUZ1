import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Deal, Store, Reservation, AppNotification, PlatformStats, UserProfile } from '../types';
import { INITIAL_DEALS, INITIAL_STORES, INITIAL_NOTIFICATIONS, INITIAL_STATS } from '../data/initialData';

// Firestore collection names
const DEALS_COLLECTION = 'deals';
const STORES_COLLECTION = 'stores';
const RESERVATIONS_COLLECTION = 'reservations';
const NOTIFICATIONS_COLLECTION = 'notifications';
const STATS_COLLECTION = 'stats';
const USERS_COLLECTION = 'users';

export async function initFirestoreSeed(): Promise<void> {
  try {
    const dealsSnap = await getDocs(collection(db, DEALS_COLLECTION));
    if (dealsSnap.empty) {
      console.log('Seeding initial deals into Firestore...');
      for (const deal of INITIAL_DEALS) {
        await setDoc(doc(db, DEALS_COLLECTION, deal.id), deal);
      }
    }

    const storesSnap = await getDocs(collection(db, STORES_COLLECTION));
    if (storesSnap.empty) {
      console.log('Seeding initial stores into Firestore...');
      for (const store of INITIAL_STORES) {
        await setDoc(doc(db, STORES_COLLECTION, store.id), store);
      }
    }

    const notifsSnap = await getDocs(collection(db, NOTIFICATIONS_COLLECTION));
    if (notifsSnap.empty) {
      for (const n of INITIAL_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COLLECTION, n.id), n);
      }
    }

    const statsDoc = doc(db, STATS_COLLECTION, 'global');
    await setDoc(statsDoc, INITIAL_STATS, { merge: true });
  } catch (err) {
    console.warn('Firestore initial check / seed error:', err);
  }
}

export async function fetchDealsFromFirestore(): Promise<Deal[]> {
  try {
    const snap = await getDocs(collection(db, DEALS_COLLECTION));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Deal));
    }
    return INITIAL_DEALS;
  } catch (err) {
    console.warn('Fallback to local deals on fetch error:', err);
    return INITIAL_DEALS;
  }
}

export async function fetchStoresFromFirestore(): Promise<Store[]> {
  try {
    const snap = await getDocs(collection(db, STORES_COLLECTION));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Store));
    }
    return INITIAL_STORES;
  } catch (err) {
    console.warn('Fallback to local stores on fetch error:', err);
    return INITIAL_STORES;
  }
}

export async function fetchReservationsFromFirestore(): Promise<Reservation[]> {
  try {
    const q = query(collection(db, RESERVATIONS_COLLECTION), orderBy('reservedAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Reservation));
  } catch (err) {
    // If index or error, fallback to simple getDocs
    try {
      const snap = await getDocs(collection(db, RESERVATIONS_COLLECTION));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Reservation));
    } catch {
      return [];
    }
  }
}

export async function saveReservationToFirestore(reservation: Reservation): Promise<void> {
  try {
    await setDoc(doc(db, RESERVATIONS_COLLECTION, reservation.id), reservation);
    
    // Also increment deal's claimed count
    const dealRef = doc(db, DEALS_COLLECTION, reservation.dealId);
    try {
      await updateDoc(dealRef, {
        claimedCoupons: (reservation.originalPrice ? 1 : 1) // will be updated
      });
    } catch {
      // safe fallback
    }
  } catch (err) {
    console.warn('Firestore reservation save warning:', err);
  }
}

export async function saveDealToFirestore(deal: Deal): Promise<void> {
  try {
    await setDoc(doc(db, DEALS_COLLECTION, deal.id), deal);
  } catch (err) {
    console.warn('Firestore deal save error:', err);
  }
}

export async function updateDealStatusInFirestore(dealId: string, status: 'active' | 'pending_review' | 'rejected', rejectionReason?: string): Promise<void> {
  try {
    const ref = doc(db, DEALS_COLLECTION, dealId);
    await updateDoc(ref, {
      status,
      ...(rejectionReason ? { rejectionReason } : {})
    });
  } catch (err) {
    console.warn('Firestore deal status update warning:', err);
  }
}

export async function toggleStoreVerificationInFirestore(storeId: string, isVerified: boolean): Promise<void> {
  try {
    const ref = doc(db, STORES_COLLECTION, storeId);
    await updateDoc(ref, { isVerified });
  } catch (err) {
    console.warn('Firestore store verification update warning:', err);
  }
}

export async function markReservationCompletedInFirestore(bookingId: string): Promise<void> {
  try {
    const ref = doc(db, RESERVATIONS_COLLECTION, bookingId);
    await updateDoc(ref, { status: 'completed' });
  } catch (err) {
    console.warn('Firestore reservation update warning:', err);
  }
}

export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), user);
  } catch (err) {
    console.warn('Firestore user save warning:', err);
  }
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Firestore user fetch warning:', err);
  }
  return null;
}

export async function fetchUserByPhone(phone: string): Promise<UserProfile | null> {
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const q = query(collection(db, USERS_COLLECTION), where('phoneNumber', '==', cleanPhone), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as UserProfile;
    }
  } catch (err) {
    console.warn('Firestore user phone query warning:', err);
  }
  return null;
}

export const MASTER_ADMIN_PHONE = '+998938971120';
export const MASTER_ADMIN_PHONE_DIGITS = '998938971120';

export async function fetchAdminPhoneNumbers(): Promise<string[]> {
  try {
    const docRef = doc(db, 'config', 'admin_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.adminPhones) && data.adminPhones.length > 0) {
        // Ensure master admin phone is always included
        if (!data.adminPhones.some((p: string) => p.replace(/\D/g, '') === MASTER_ADMIN_PHONE_DIGITS)) {
          return [MASTER_ADMIN_PHONE, ...data.adminPhones];
        }
        return data.adminPhones;
      }
    }
  } catch (err) {
    console.warn('Error fetching admin phones from Firestore:', err);
  }
  return [MASTER_ADMIN_PHONE];
}

export async function saveAdminPhoneNumbers(phones: string[]): Promise<void> {
  try {
    // Always include master admin
    const cleanList = Array.from(new Set([MASTER_ADMIN_PHONE, ...phones]));
    await setDoc(doc(db, 'config', 'admin_settings'), {
      adminPhones: cleanList,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Error saving admin phones to Firestore:', err);
  }
}

