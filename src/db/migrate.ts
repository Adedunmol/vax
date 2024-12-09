import { migrate } from 'drizzle-orm/postgres-js/migrator';
import env from '../env';
import { db, connection } from '.';
import config from '../../drizzle.config'

if (!env.DB_MIGRATING) {
    throw new Error('expected DB_MIGRATING to be set to "true"')
}

await migrate(db, { migrationsFolder: config.out! })

await connection.end()