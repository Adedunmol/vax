import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import env from '../env'

console.log("DB_URL", env.DB_URL)

export const connection = postgres(env.DB_URL, {
    max: (env.DB_MIGRATING || env.DB_SEEDING) ? 1 : undefined,
    onnotice: env.DB_SEEDING ? () => {} : undefined
})

export const db = drizzle(connection, {
    logger: true
})

export type db = typeof db

export default db