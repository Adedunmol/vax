import { pgTable, serial, varchar, boolean, integer, timestamp, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { invoices } from './invoices'

export const items = pgTable('items', {
    id: serial('id').primaryKey(),
    invoiceId: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    units: integer('units').notNull(),
    description: varchar('description'),
    rate: decimal('rate'),
    total: decimal('total'),
});

export const itemsRelations = relations(items, ({ one }) => ({
    invoice: one(invoices, { fields: [items.invoiceId], references: [invoices.id] }),
}))

export default items