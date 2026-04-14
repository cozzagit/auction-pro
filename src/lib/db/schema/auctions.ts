import { pgTable, uuid, text, integer, real, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { auctionStatusEnum, bidStatusEnum } from './enums';
import { users } from './users';
import { services } from './categories';

export const auctions = pgTable(
  'auctions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    maxBudget: integer('max_budget_cents').notNull(),
    status: auctionStatusEnum('status').notNull().default('active'),
    city: text('city'),
    province: text('province'),
    photos: jsonb('photos').$type<string[]>().default(sql`'[]'::jsonb`),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    winningBidId: uuid('winning_bid_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => [
    index('auctions_user_id_idx').on(t.userId),
    index('auctions_status_idx').on(t.status),
    index('auctions_expires_at_idx').on(t.expiresAt),
  ],
);

export const auctionServices = pgTable(
  'auction_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').notNull().references(() => services.id),
    parameters: jsonb('parameters').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('auction_services_auction_id_idx').on(t.auctionId),
  ],
);

export const bids = pgTable(
  'bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id').notNull().references(() => auctions.id, { onDelete: 'cascade' }),
    professionalId: uuid('professional_id').notNull().references(() => users.id),
    amountCents: integer('amount_cents').notNull(),
    message: text('message'),
    status: bidStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('bids_auction_id_idx').on(t.auctionId),
    index('bids_professional_id_idx').on(t.professionalId),
  ],
);
