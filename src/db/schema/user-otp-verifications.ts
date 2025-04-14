import { pgTable, serial, boolean, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import users from './users';

export const userOtpVerifications = pgTable('user_otp_verifications', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    otp: varchar('otp', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const userOtpVerificationsRelations = relations(userOtpVerifications, ({ one }) => ({
    user: one(users, { fields: [userOtpVerifications.userId], references: [users.id] }),
}));

export default userOtpVerifications;