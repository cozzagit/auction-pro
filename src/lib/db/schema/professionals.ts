import { pgTable, uuid, text, boolean, real, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { professionalStatusEnum } from './enums';
import { users } from './users';
import { categories } from './categories';

export const professionals = pgTable(
  'professionals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    businessName: text('business_name').notNull(),
    vatNumber: text('vat_number').notNull(),
    description: text('description'),
    experience: text('experience'),
    address: text('address'),
    city: text('city'),
    province: text('province'),
    zipCode: text('zip_code'),
    hasInsurance: boolean('has_insurance').notNull().default(false),
    hasLicense: boolean('has_license').notNull().default(false),
    status: professionalStatusEnum('status').notNull().default('pending'),
    rating: real('rating').notNull().default(0),
    totalJobs: integer('total_jobs').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('professionals_user_id_unique').on(t.userId),
    uniqueIndex('professionals_vat_number_unique').on(t.vatNumber),
    index('professionals_status_idx').on(t.status),
  ],
);

export const professionalCategories = pgTable(
  'professional_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    professionalId: uuid('professional_id').notNull().references(() => professionals.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('prof_cat_professional_idx').on(t.professionalId),
    index('prof_cat_category_idx').on(t.categoryId),
  ],
);
