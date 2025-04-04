import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

export const createReminderSchema = z.object({
    invoiceId: z.number(),
    isRecurring: z.boolean(),
    intervalDays: z.number(),
    dueDate: z.string().refine((str) => !isNaN(Date.parse(str)), { message: "Invalid dueDate format" }).transform((str) => new Date(str))
})

const reminderParam = z.object({
    reminderId: z.number()
})

const reminderResponse = z.object({
    invoiceId: z.number(),
    isRecurring: z.boolean(),
    canceled: z.boolean(),
    intervalDays: z.number(),
    dueDate: z.date(),
    id: z.number(),
    updated_at: z.date(),
    created_at: z.date(),
    deleted_at: z.date(),
    userId: z.number(),
    clientId: z.number(),
    reminderStatus: z.enum(['pending', 'sent', 'scheduled', 'canceled'])
})

const allRemindersResponse = z.array(reminderResponse)

const updateReminderSchema = z.object({
    invoiceId: z.number(),
    intervalDays: z.number().optional(),
    cancel: z.boolean().optional(),
    dueDate: z.string().transform((str) => (str ? new Date(str) : undefined)).refine((date) => !date || date > new Date(), { message: "due_date must be in the future" }).optional()
})

export type CreateReminderInput = z.infer<typeof createReminderSchema>
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>

export const { schemas: reminderSchemas, $ref } = buildJsonSchemas({
    createReminderSchema,
    reminderParam,
    reminderResponse,
    allRemindersResponse,
    updateReminderSchema
}, { '$id': 'RemindersSchema' })