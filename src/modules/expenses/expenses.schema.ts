import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const createExpenseSchema = z.object({
    category: z.string({ required_error: "category is required" }),
    amount: z.number({ required_error: "amount is required" }),
    expense_date: z.string()
                .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
                .transform((str) => new Date(str)) 
})

const expenseCore = z.object({
    id: z.number(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    userId: z.number(),
    category: z.string(),
    amount: z.string(),
    expenseDate: z.date()
})

const expenseResponse = z.object({
    ...responseCore,
    data: expenseCore
})

const allExpensesResponse = z.object({
    ...responseCore,
    data: z.array(expenseCore)
})

const expenseParam = z.object({
    expenseId: z.number()
})

const updateExpenseSchema = z.object({
    category: z.string().optional(),
    amount: z.number().optional(),
    expense_date: z.coerce.date().optional() // z.string().transform((str) => (str ? new Date(str) : undefined)).optional()
})

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

export const { schemas: expenseSchemas, $ref } = buildJsonSchemas({
    createExpenseSchema,
    expenseResponse,
    expenseParam,
    allExpensesResponse,
    updateExpenseSchema
}, { '$id': 'ExpenseSchema' })