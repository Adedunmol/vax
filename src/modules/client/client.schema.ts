import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const createClientSchema = z.object({
    first_name: z.string({ required_error: "Client's first_name is required" }),
    last_name: z.string({ required_error: "Client's last_name is required" }),
    email: z.string({ required_error: "Client's email is required" }).email('Should be a valid email'),
    phone_number: z.string({ required_error: "Client's phone_number is required" })
})

const clientCore = z.object({
    email: z.string(),
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    phoneNumber: z.string(),
    createdBy: z.number()
})

const clientResponse = z.object({
    ...responseCore,
    data: clientCore
})

const allClientsCore = z.array(clientCore)

const allClientsResponse = z.object({
    ...responseCore,
    data: allClientsCore
})

const invoiceCore = z.array(
    z.object({
        status: z.enum(["unpaid", "partially_paid", "paid", "overdue"]),
        id: z.number(),
        updated_at: z.date(),
        created_at: z.date(),
        deleted_at: z.date(),
        createdBy: z.number(),
        createdFor: z.number(),
        totalAmount: z.number(),
        amountPaid: z.number()
    })
)

const invoiceResponse = z.object({
    ...responseCore,
    data: invoiceCore
})

const getClientParam = z.object({
    clientId: z.number()
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
    getClientParam,
    clientResponse,
    invoiceResponse,
    allClientsResponse,
    updateClientSchema
}, { '$id': 'ClientSchema' })