import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['customer', 'professional', 'admin']);
export const professionalStatusEnum = pgEnum('professional_status', ['pending', 'approved', 'rejected', 'suspended']);
export const auctionStatusEnum = pgEnum('auction_status', ['active', 'expired', 'awarded', 'in_progress', 'completed', 'cancelled']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'accepted', 'rejected']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'completed', 'disputed']);
export const parameterTypeEnum = pgEnum('parameter_type', ['text', 'number', 'boolean', 'select', 'date', 'textarea']);
