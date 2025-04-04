import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const serviceSchema = z.object({
    units: z.number({ required_error: 'units is required' }),
    rate: z.number({ required_error: 'rate is required' }),
    description: z.string().optional(),
    paid: z.boolean().default(false)
})

const createInvoiceSchema = z.object({
    due_date: z.string()
                .refine((str) => !isNaN(Date.parse(str)), { message: "invalid due_date format" })
                .transform((str) => new Date(str))
                .refine((date) => date > new Date(), { message: "due_date must be in the future" }),
    client_id: z.number({ required_error: "client_id is required" }),
    description: z.string().optional(),
    items: z.array(serviceSchema).optional()
})

const invoiceResponse = z.object({
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

const allInvoicesResponse = z.array(invoiceResponse)

const invoiceParam = z.object({
    invoiceId: z.number()
})

const updateInvoiceSchema = z.object({
    description: z.string().optional(),
    amount: z.number().optional(),
    expense_date: z.string().optional() // Makes the field optional
                    .refine((str) => !str || !isNaN(Date.parse(str)), { message: "invalid due_date format" }) // Validate only if provided
                    .transform((str) => (str ? new Date(str) : undefined)) // Convert only if present
                    .refine((date) => !date || date > new Date(), { message: "due_date must be in the future" })
})

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

export const { schemas: invoiceSchemas, $ref } = buildJsonSchemas({
    createInvoiceSchema,
    invoiceResponse,
    invoiceParam,
    allInvoicesResponse,
    updateInvoiceSchema
}, { '$id': 'InvoiceSchema' })
