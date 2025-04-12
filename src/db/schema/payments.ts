import { pgTable, serial, varchar, boolean, integer, timestamp, decimal } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'
import { invoices } from './invoices'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    amount: decimal('amount'),
    paymentDate: timestamp('payment_date'),
    paymentMethod: varchar('payment_method'),
    ...timestamps
})

export const paymentsRelations = relations(payments, ({ one }) => ({
    user: one(users, { fields: [payments.userId], references: [users.id] })
}))

export default payments