import { pgTable, serial, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const profiles = pgTable('profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).unique(),
    currency: varchar('currency'),
    lastLogin: timestamp().defaultNow(),
    ...timestamps
})

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, { fields: [profiles.userId], references: [users.id] })
}))

export default profiles