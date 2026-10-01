import { db } from './index.ts';
import { reservations, smsVerifications } from './schema.ts';
import { eq, and, desc, gte } from 'drizzle-orm';

export interface NewReservationInput {
  bookingCode: string;
  dealId: string;
  dealTitle: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  originalPrice: number;
  discountPrice: number;
  savedMoney: number;
  status?: string;
  isVerified?: boolean;
  expiresAt: string;
}

// Save reservation to Cloud SQL PostgreSQL
export async function insertReservation(data: NewReservationInput) {
  try {
    const result = await db.insert(reservations).values({
      bookingCode: data.bookingCode,
      dealId: data.dealId,
      dealTitle: data.dealTitle,
      storeName: data.storeName,
      storeAddress: data.storeAddress || '',
      storePhone: data.storePhone || '',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      paymentMethod: data.paymentMethod || 'cash',
      originalPrice: data.originalPrice,
      discountPrice: data.discountPrice,
      savedMoney: data.savedMoney,
      status: data.status || 'active',
      isVerified: data.isVerified ?? true,
      expiresAt: data.expiresAt,
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to insert reservation into PostgreSQL:', error);
    throw new Error('Database insert failed', { cause: error });
  }
}

// Retrieve reservations from Cloud SQL PostgreSQL
export async function getReservations() {
  try {
    return await db.select().from(reservations).orderBy(desc(reservations.id));
  } catch (error) {
    console.error('Failed to get reservations from PostgreSQL:', error);
    throw new Error('Database select failed', { cause: error });
  }
}

// Mark reservation as completed
export async function markReservationCompleted(bookingCode: string) {
  try {
    return await db.update(reservations)
      .set({ status: 'completed' })
      .where(eq(reservations.bookingCode, bookingCode))
      .returning();
  } catch (error) {
    console.error('Failed to update reservation in PostgreSQL:', error);
    throw new Error('Database update failed', { cause: error });
  }
}

// Create and store SMS verification code
export async function storeSmsCode(phoneNumber: string, code: string, purpose = 'booking') {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    const result = await db.insert(smsVerifications).values({
      phoneNumber: cleanPhone,
      code,
      purpose,
      isUsed: false,
      expiresAt,
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Failed to store SMS code in PostgreSQL:', error);
    throw new Error('Database SMS code storage failed', { cause: error });
  }
}

// Verify SMS code in Cloud SQL PostgreSQL
export async function checkSmsCode(phoneNumber: string, code: string, purpose = 'booking'): Promise<boolean> {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const now = new Date();

    const matches = await db.select()
      .from(smsVerifications)
      .where(
        and(
          eq(smsVerifications.phoneNumber, cleanPhone),
          eq(smsVerifications.code, code.trim()),
          eq(smsVerifications.purpose, purpose),
          eq(smsVerifications.isUsed, false),
          gte(smsVerifications.expiresAt, now)
        )
      )
      .orderBy(desc(smsVerifications.id))
      .limit(1);

    if (matches.length > 0) {
      // Mark code as used
      await db.update(smsVerifications)
        .set({ isUsed: true })
        .where(eq(smsVerifications.id, matches[0].id));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to verify SMS code in PostgreSQL:', error);
    return false;
  }
}
