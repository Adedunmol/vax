import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const updateSettingsSchema = z.object({
    currency: z.string().length(3).optional(),
    custom_logo: z.string().optional(),
    notify_before: z.number().int().nonnegative().optional(),
    recurrent_reminders: z.boolean().optional(),
    recurrent_interval: z.number().int().nonnegative().optional()
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export const { schemas: settingsSchemas, $ref } = buildJsonSchemas({
    updateSettingsSchema
}, { '$id': 'SettingsSchema' })