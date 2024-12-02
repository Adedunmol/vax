import { pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core'

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    verified: boolean('verified').default(false),
    password: varchar('password', { length: 255 }).notNull()
})

export default users