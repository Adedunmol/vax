import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

export const errorSchema = z.object({
    statusCode: z.number(),
    error: z.string(),
    message: z.string()
})

export const { schemas: errorSchemas, $ref: $errorRef } = buildJsonSchemas({
    errorSchema,
})