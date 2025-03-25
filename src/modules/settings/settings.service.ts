import { eq } from 'drizzle-orm'
import db from '../../db'
import { profiles, users } from '../../db/schema'
import settings from '../../db/schema/settings'

class SettingsService {
    OTP_EXPIRATION: number

    constructor() {
        this.OTP_EXPIRATION = 3600000
    }

    async update(userId: number, updateObj: any) {

        const data = await db.update(settings).set(updateObj).where(eq(users.id, userId)).returning()
    
        return data[0]
    }
}

export default new SettingsService()