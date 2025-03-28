import { eq } from 'drizzle-orm'
import db from '../../db'
import settings from '../../db/schema/settings'

class RemindersService {

    constructor() {}

    async create(data: any) {}

    async update(userId: number, updateObj: any) {}

    async getDueReminders() {}

    async get(reminderId: number, userId: number) {}

    async getAll(userId: number) {}

    async delete(reminderId: number, userId: number) {}
}

export default new RemindersService()