import { pgTable, serial, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core'
import users from './users'
import { relations } from 'drizzle-orm'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const settings = pgTable('settings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).unique(),
    currency: varchar('currency', { length: 3 }),
    customLogo: varchar('custom_logo', { length: 255 }),
    notify_before: integer('notify_before').default(0),
    recurrentReminders: boolean('recurrent_reminders').default(true),
    recurrentInterval: integer('recurrent_interval').default(0),
    lastLogin: timestamp().defaultNow(),
    ...timestamps
})

export const settingsRelations = relations(settings, ({ one }) => ({
    user: one(users, { fields: [settings.userId], references: [users.id] })
}))

export default settings