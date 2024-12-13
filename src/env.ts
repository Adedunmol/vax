import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { ZodError, z } from 'zod'

const stringBoolean = z.coerce.string().transform(val => val === 'true').default('false')

const EnvSchema = z.object({
    DB_URL: z.string(),
    DB_PASSWORD: z.string(),
    DB_USER: z.string(),
    DB_NAME: z.string(),
    DB_PORT: z.coerce.number(),
    DB_MIGRATING: stringBoolean,
    DB_SEEDING: stringBoolean,
    EMAIL_FROM: z.string(),
    EMAIL_HOST: z.string(),
    EMAIL_PASSWORD: z.string(),
    EMAIL_PORT: z.coerce.number(),
    EMAIL_USERNAME: z.string(),
    PORT: z.coerce.number(),
    JWT_SECRET: z.string(),
    REDIS_PORT: z.coerce.number(),
    REDIS_HOST: z.string(),
    REDIS_PASSWORD: z.string().default('')
})

export type EnvSchema = z.infer<typeof EnvSchema>

expand(config())

try {
    EnvSchema.parse(process.env)
} catch (error) {
    if (error instanceof ZodError) {
        let message = 'Missing required fields in .env\n'
        error.issues.forEach(issue => {
            message += issue.path[0] + '\n'
        })
        const e = new Error(message)
        e.stack = ''

        throw e
    }

    console.error(error)
}

export default EnvSchema.parse(process.env)