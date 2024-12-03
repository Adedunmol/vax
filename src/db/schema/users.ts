import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import profiles from './profiles'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 64 }).notNull().unique(),
    verified: boolean('verified').default(false),
    password: varchar('password', { length: 255 }).notNull(),
    ...timestamps
})

export const usersRelations = relations(users, ({ one }) => ({
    profile: one(profiles)
}))

export default users