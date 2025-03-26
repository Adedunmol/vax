import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import profiles from './profiles'
import settings from './settings'
import clients from './clients'

const timestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
    deleted_at: timestamp(),
}

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    email: varchar('email', { length: 64 }).notNull().unique(),
    verified: boolean('verified').default(false),
    password: varchar('password', { length: 255 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 255 }),
    ...timestamps
})

export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles),
    settings: one(settings),
    clients: many(clients)
}))

export default users