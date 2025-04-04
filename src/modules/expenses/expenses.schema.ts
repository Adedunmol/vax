import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const createExpenseSchema = z.object({
    category: z.string({ required_error: "category is required" }),
    amount: z.number({ required_error: "amount is required" }),
    expense_date: z.string().refine((str) => !isNaN(Date.parse(str)), { message: "Invalid expense_date format" }).transform((str) => new Date(str))
})

const expenseResponse = z.object({
    id: z.number(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    userId: z.number(),
    category: z.string(),
    amount: z.string(),
    expenseDate: z.date()
})

const allExpensesResponse = z.array(expenseResponse)

const expenseParam = z.object({
    expenseId: z.number()
})

const updateExpenseSchema = z.object({
    category: z.string().optional(),
    amount: z.number().optional(),
    expense_date: z.string().transform((str) => (str ? new Date(str) : undefined)).optional()
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