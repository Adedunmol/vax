import { eq, and, isNull, lte} from 'drizzle-orm'
import db from '../../db'
import { CreateReminderInput, UpdateReminderInput } from './reminder.schema'
import { clients, reminders, users } from '../../db/schema'

type RemindersWithUsers = typeof reminders.$inferSelect & { user: typeof users.$inferSelect, client: typeof clients.$inferSelect };

class RemindersService {

    constructor() {}

    async create(data: CreateReminderInput) {
        const reminder = await db.insert(reminders).values(data).returning()
    
        return reminder[0]
    }

    async update(reminderId: number, userId: number, updateObj: UpdateReminderInput) {
        const reminder = await db.update(reminders).set(updateObj).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId))).returning()

        return reminder[0]
    }

    async getDueReminders() {
        // fetch the remidners in chunks
        const pendingReminders: RemindersWithUsers[] = await db.query.reminders.findMany({
            where: and(
                eq(reminders.reminderStatus, 'pending'), // Not sent
                eq(reminders.canceled, false), // Not canceled
                lte(reminders.dueDate, new Date())
            ),
            with: {
                user: true,
                client: true
            } 
        })

        return pendingReminders
    }

    async get(reminderId: number, userId: number) {
        const reminder = db.query.invoices.findFirst({ 
            where: and(eq(reminders.id, reminderId), eq(reminders.userId, userId)),
        })
    
        return reminder
    }

    async getAll(userId: number) {
        const remindersData = db.query.invoices.findMany({ 
            where: and(
                eq(reminders.userId, userId), 
                isNull(reminders.deleted_at),
            ),
        })
    
        return remindersData
    }

    async delete(reminderId: number, userId: number) {
        const reminder = db.update(reminders).set({ deleted_at: new Date() }).where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId))).returning()
    
        return reminder
    }
}

export default new RemindersService()