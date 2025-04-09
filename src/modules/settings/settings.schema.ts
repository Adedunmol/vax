import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const responseCore = {
    status: z.string(),
    message: z.string()
}

const updateSettingsSchema = z.object({
    currency: z.string().length(3).optional(),
    custom_logo: z.string().optional(),
    notify_before: z.number().int().nonnegative().optional(),
    recurrent_reminders: z.boolean().optional(),
    recurrent_interval: z.number().int().nonnegative().optional()
})

const settingsResponse = z.object({
    ...responseCore,
    data: z.object({
        updated_at: z.date(),
        created_at: z.date(),
        deleted_at: z.date(),
        id: z.number(),
        userId: z.number(),
        currency: z.string(),
        customLogo: z.string(),
        notify_before: z.number(),
        recurrentReminders: z.boolean(),
        recurrentInterval: z.number()
    })
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export const { schemas: settingsSchemas, $ref } = buildJsonSchemas({
    updateSettingsSchema,
    settingsResponse
}, { '$id': 'SettingsSchema' })