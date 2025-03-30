import { eq, and } from 'drizzle-orm'
import db from '../../db'
import settings from '../../db/schema/settings'
import { UpdateSettingsInput } from './settings.schema'

class SettingsService {

    constructor() {}

    async get(userId: number) {
        const settingsData = db.query.settings.findFirst({ 
            where: and(eq(settings.userId, userId)),
        })
    
        return settingsData
    }

    async update(userId: number, updateObj: UpdateSettingsInput) {

        const data = await db.update(settings).set({ ...updateObj, updated_at: new Date() }).where(eq(settings.userId, userId)).returning()
    
        return data[0]
    }
}

export default new SettingsService()