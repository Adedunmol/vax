import { pgTable, serial, varchar, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import invoices from './invoices'
import users from './users'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const reminderStatus = pgEnum('reminder_status', ['pending', 'sent', 'scheduled', 'canceled'])

const reminders = pgTable('reminders', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    invoiceId: integer('invoice_id').references(() => invoices.id),
    reminderStatus: reminderStatus().default('pending'),
    isRecurring: boolean('is_recurring').default(false),
    intervalDays: integer('interval_days').default(1),
    dueDate: timestamp('due_date').notNull(),
    canceled: boolean('canceled').default(false),
    ...timestamps
})

export const remindersRelations = relations(reminders, ({ one }) => ({
    invoice: one(invoices, { fields: [reminders.invoiceId], references: [invoices.id] }),
    user: one(users, { fields: [reminders.userId], references: [users.id] })
}))

export default reminders