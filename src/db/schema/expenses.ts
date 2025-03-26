import { pgTable, serial, varchar, integer, timestamp, decimal } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const expenses = pgTable('expenses', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    category: varchar('category', { length: 64 }),
    amount: decimal('amount'),
    expenseDate: timestamp().defaultNow(),
    ...timestamps
})

export const profilesRelations = relations(expenses, ({ one }) => ({
    user: one(users, { fields: [expenses.userId], references: [users.id] })
}))

export default expenses