import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const createPaymentSchema = z.object({
    invoice_id: z.number({ required_error: 'invoice_id is required' }),
    amount: z.number({ required_error: 'amount is required' }),
    payment_method: z.string({ required_error: 'payment_method of payment is required' }), // enum(['bank_transfer', 'cash', 'online_payment', 'crypto'])
    payment_date: z.string().refine((str) => !isNaN(Date.parse(str)), { message: "Invalid payment_date format" }).transform((str) => new Date(str))
})

const updatePaymentSchema = z.object({
    invoice_id: z.number().optional(),
    amount: z.number().optional(),
    payment_method: z.string().optional(), // enum(['bank_transfer', 'cash', 'online_payment', 'crypto'])
    payment_date: z.string().transform((str) => (str ? new Date(str) : undefined)).optional()
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

export const { schemas: paymentSchemas, $ref } = buildJsonSchemas({
    createPaymentSchema,
    updatePaymentSchema
}, { '$id': 'PaymentSchema' })