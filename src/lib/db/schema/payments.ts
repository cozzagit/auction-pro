import { pgTable, uuid, text, integer, real, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { paymentStatusEnum, contractStatusEnum } from './enums';
import { auctions, bids } from './auctions';
import { users } from './users';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id),
    bidId: uuid('bid_id').notNull().references(() => bids.id),
    clientUserId: uuid('client_user_id').notNull().references(() => users.id),
    professionalUserId: uuid('professional_user_id').notNull().references(() => users.id),
    originalAmountCents: integer('original_amount_cents').notNull(),
    winningBidAmountCents: integer('winning_bid_amount_cents').notNull(),
    finalAmountCents: integer('final_amount_cents').notNull(),
    platformFeeCents: integer('platform_fee_cents').notNull(),
    platformFeePercent: real('platform_fee_percent').notNull().default(6),
    status: paymentStatusEnum('status').notNull().default('pending'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('payments_auction_id_idx').on(t.auctionId),
    index('payments_status_idx').on(t.status),
  ],
);

export const contracts = pgTable(
  'contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id),
    paymentId: uuid('payment_id').notNull().references(() => payments.id),
    clientUserId: uuid('client_user_id').notNull().references(() => users.id),
    professionalUserId: uuid('professional_user_id').notNull().references(() => users.id),
    clientContactInfo: jsonb('client_contact_info').$type<{ name: string; email: string; phone: string }>(),
    professionalContactInfo: jsonb('professional_contact_info').$type<{ name: string; email: string; businessName: string; phone: string }>(),
    contractStatus: contractStatusEnum('contract_status').notNull().default('active'),
    workStartDate: timestamp('work_start_date', { withTimezone: true }),
    workCompletedDate: timestamp('work_completed_date', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('contracts_auction_id_idx').on(t.auctionId),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id),
    professionalId: uuid('professional_id').notNull().references(() => users.id),
    clientUserId: uuid('client_user_id').notNull().references(() => users.id),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('reviews_professional_id_idx').on(t.professionalId),
    index('reviews_auction_id_idx').on(t.auctionId),
  ],
);
