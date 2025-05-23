import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const createPaymentSchema = z.object({
    invoice_id: z.number({ required_error: 'invoice_id is required' }),
    amount: z.number({ required_error: 'amount is required' }), //.gt(0, { message: 'amount must be greater than 0' }),
    payment_method: z.string({ required_error: 'payment_method of payment is required' }), // enum(['bank_transfer', 'cash', 'online_payment', 'crypto'])
    payment_date: z.string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
                .transform((str) => new Date(str))
}).refine(data => data.amount > 0, { message: 'amount must be greater than 0' })

const paymentCore = z.object({
    amount: z.number(),
    id: z.number(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    userId: z.number(),
    invoiceId: z.number(),
    paymentDate: z.date(),
    paymentMethod: z.string(),
})

const paymentResponse = z.object({
    ...responseCore,
    data: paymentCore
})

const allPaymentsResponse = z.object({
    ...responseCore,
    data: z.array(paymentCore)
})

const paymentParam = z.object({
    paymentId: z.number()
})

const updatePaymentSchema = z.object({
    // invoice_id: z.number().optional(),
    // amount: z.number().optional(),
    payment_method: z.string().optional(), // enum(['bank_transfer', 'cash', 'online_payment', 'crypto'])
    payment_date: z.string().transform((str) => (str ? new Date(str) : undefined)).optional()
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

export const { schemas: paymentSchemas, $ref } = buildJsonSchemas({
    createPaymentSchema,
    paymentResponse,
    paymentParam,
    allPaymentsResponse,
    updatePaymentSchema
}, { '$id': 'PaymentSchema' })