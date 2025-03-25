import { eq } from 'drizzle-orm'
import db from '../../db'
import { users } from '../../db/schema'
import settings from '../../db/schema/settings'

class SettingsService {

    constructor() {
    }

    async update(userId: number, updateObj: any) {

        const data = await db.update(settings).set(updateObj).where(eq(settings.userId, userId)).returning()
    
        return data[0]
    }
}

export default new SettingsService()