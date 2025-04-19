import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'
import { invoiceStatusValues } from '../../db/schema'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const serviceSchema = z.object({
    units: z.number({ required_error: 'units is required' }),
    rate: z.number({ required_error: 'rate is required' }),
    description: z.string().optional(),
    paid: z.boolean().default(false)
})

const createInvoiceSchema = z.object({
    due_date: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
            .transform((str) => new Date(str)),
    client_id: z.number({ required_error: "client_id is required" }),
    description: z.string().optional(),
    items: z.array(serviceSchema).optional()
})

const invoiceCore = z.object({
    status: z.enum(["unpaid", "partially_paid", "paid", "overdue"]),
    id: z.number(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    createdBy: z.number(),
    createdFor: z.number(),
    totalAmount: z.number(),
    amountPaid: z.number(),
    description: z.string(),
    dueDate: z.date(),
    items: z.array(z.object({
        id: z.number(),
        description: z.string(),
        invoiceId: z.number(),
        units: z.number(),
        rate: z.string(),
        total: z.string(),
    })).optional()
})

const clientCore = z.object({ 
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    phoneNumber: z.string(),
    createdBy: z.number(),
})

const invoiceWithClientResponse = z.object({
    ...responseCore,
    data: z.object({
        invoice: invoiceCore,
        client: clientCore
    })
})

const invoiceResponse = z.object({
    ...responseCore,
    data: invoiceCore
})

const allInvoicesResponse = z.object({
    ...responseCore,
    data: z.array(invoiceCore)
})

const invoiceParam = z.object({
    invoiceId: z.number()
})

const updateInvoiceSchema = z.object({
    description: z.string().optional(),
    status: z.enum(invoiceStatusValues).optional()
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

export const { schemas: invoiceSchemas, $ref } = buildJsonSchemas({
    createInvoiceSchema,
    invoiceResponse,
    invoiceParam,
    allInvoicesResponse,
    updateInvoiceSchema,
    invoiceWithClientResponse
}, { '$id': 'InvoiceSchema' })
