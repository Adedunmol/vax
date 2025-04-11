import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

export const errorSchema = z.object({
    // statusCode: z.number(),
    status: z.string(),
    message: z.string()
})

export const { schemas: errorSchemas, $ref: $errorRef } = buildJsonSchemas({
    errorSchema
}, { '$id': 'ErrorSchema' })