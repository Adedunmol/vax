import db from "../db";
import { eq } from "drizzle-orm"
import { reminders } from "../db/schema";
import ReminderService from "../modules/reminder/reminder.service"
import { sendToQueue } from "../queues"
import moment from "moment";

export const enqueueReminders = async () => {
    const dueReminders = await ReminderService.getDueReminders();

    const reminderPromises = dueReminders.map(async (reminder) => {
        try {
            if (!reminder.canceled || reminder.invoice.status !== 'paid') {
                const emailData = {
                    template: 'reminder',
                    locals: { firstName: reminder.user.firstName },
                    to: reminder.client.email
                };
    
                await sendToQueue('invoices', emailData);

                const nextReminderDate = moment(reminder.dueDate).add(reminder.intervalDays, 'days').toDate()
                
                await Promise.all([
                    db.update(reminders).set({ reminderStatus: 'scheduled' }).where(eq(reminders.id, reminder.id)),
                    db.insert(reminders).values({ ...reminder, dueDate: nextReminderDate })
                ])
            }
        } catch (error) {
            console.error(`Failed to enqueue reminder for ${reminder.client.email}:`, error);
        }
    });

    await Promise.all(reminderPromises);
};