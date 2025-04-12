import { pgTable, serial, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'
import { invoices } from './invoices'
import { reminders } from './reminders'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const clients = pgTable('clients', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 50 }),
    lastName: varchar('last_name', { length: 50 }),
    email: varchar('email', { length: 64 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 16 }),
    createdBy: integer('created_by').references(() => users.id),
    ...timestamps
})

export const clientsRelations = relations(clients, ({ one, many }) => ({
    user: one(users, { fields: [clients.createdBy], references: [users.id] }),
    invoice: many(invoices),
    reminder: many(reminders)
}))

export default clients