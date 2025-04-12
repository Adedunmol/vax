import { pgTable, serial, varchar, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'
import clients from './clients'
import { reminders } from './reminders'
import items from './items'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

export const invoiceStatus = pgEnum("invoice_status", ["unpaid", "partially_paid", "paid", "overdue"])

export const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    description: varchar('description', { length: 255 }),
    dueDate: timestamp('due_date'),
    createdBy: integer('created_by').references(() => users.id),
    createdFor: integer('created_for').references(() => clients.id),
    totalAmount: decimal('total_amount'),
    amountPaid: decimal('amount_paid'),
    status: invoiceStatus().default('unpaid'),
    ...timestamps
})

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    user: one(users, { fields: [invoices.createdBy], references: [users.id] }),
    client: one(clients, { fields: [invoices.createdFor], references: [clients.id] }),
    reminders: many(reminders),
    items: many(items)
}))

// export default invoices