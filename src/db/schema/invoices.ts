import { pgTable, serial, varchar, boolean, integer, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'
import clients from './clients'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const invoiceStatus = pgEnum("invoice_status", ["pending", "partially_paid", "paid", "overdue"])

const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    description: varchar('description', { length: 255 }),
    dueDate: timestamp('due_date'),
    createdBy: integer('created_by').references(() => users.id),
    createdFor: integer('created_for').references(() => clients.id),
    totalAmount: decimal('total_amount'),
    amountPaid: decimal('amount_paid'),
    status: invoiceStatus().default('pending'),
    ...timestamps
})

export const invoicesRelations = relations(invoices, ({ one }) => ({
    user: one(users, { fields: [invoices.createdBy], references: [users.id] }),
    client: one(clients, { fields: [invoices.createdFor], references: [clients.id] })
}))

export default invoices