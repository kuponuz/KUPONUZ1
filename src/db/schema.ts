import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

// Reservations table (PostgreSQL)
export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  dealId: text('deal_id').notNull(),
  dealTitle: text('deal_title').notNull(),
  storeName: text('store_name').notNull(),
  storeAddress: text('store_address'),
  storePhone: text('store_phone'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  paymentMethod: text('payment_method').notNull().default('cash'),
  originalPrice: integer('original_price').notNull().default(0),
  discountPrice: integer('discount_price').notNull().default(0),
  savedMoney: integer('saved_money').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active', 'completed', 'cancelled'
  isVerified: boolean('is_verified').notNull().default(true),
  reservedAt: timestamp('reserved_at').defaultNow(),
  expiresAt: text('expires_at').notNull(),
});

// SMS verification codes table for bookings and logins
export const smsVerifications = pgTable('sms_verifications', {
  id: serial('id').primaryKey(),
  phoneNumber: text('phone_number').notNull(),
  code: text('code').notNull(),
  purpose: text('purpose').notNull().default('booking'), // 'booking' | 'auth'
  isUsed: boolean('is_used').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});
