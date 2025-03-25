import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const createClientSchema = z.object({
    first_name: z.string({ required_error: "Client's first_name is required" }),
    last_name: z.string({ required_error: "Client's last_name is required" }),
    email: z.string({ required_error: "Client's email is required" }).email('Should be a valid email'),
    phone_number: z.string({ required_error: "Client's phone_number is required" })
})

const updateClientSchema = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email('Should be a valid email').optional(),
    phone_number: z.string().optional()
})

export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>

export const { schemas: clientSchemas, $ref } = buildJsonSchemas({
    createClientSchema,
    updateClientSchema
}, { '$id': 'ClientSchema' })