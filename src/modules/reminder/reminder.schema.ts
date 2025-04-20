import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

export const createReminderSchema = z.object({
    invoiceId: z.number(),
    isRecurring: z.boolean(),
    intervalDays: z.number(),
    dueDate: z.string().refine((str) => !isNaN(Date.parse(str)), { message: "Invalid dueDate format" }).transform((str) => new Date(str))
})

const reminderParam = z.object({
    reminderId: z.number()
})

const reminderCore = z.object({
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

const reminderResponse = z.object({
    ...responseCore,
    data: reminderCore
})

const allRemindersResponse = z.object({
    ...responseCore,
    data: z.array(reminderCore)
})

const updateReminderSchema = z.object({
    intervalDays: z.number().optional(),
    cancel: z.boolean().optional(),
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