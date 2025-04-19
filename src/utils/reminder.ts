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
            if (!reminder.reminders.canceled || reminder.invoices.status !== 'paid') {
                const emailData = {
                    template: 'reminder',
                    locals: { firstName: reminder.clients.firstName },
                    to: reminder.clients.email
                };
    
                await sendToQueue('invoices', emailData);

                const nextReminderDate = moment(reminder.reminders.dueDate).add(reminder.reminders.intervalDays, 'days').toDate()
                
                await Promise.all([
                    db.update(reminders).set({ reminderStatus: 'scheduled' }).where(eq(reminders.id, reminder.reminders.id)),
                    db.insert(reminders).values({ ...reminder, dueDate: nextReminderDate })
                ])
            }
        } catch (error) {
            console.error(`Failed to enqueue reminder for ${reminder.clients.email}:`, error);
        }
    });

    await Promise.all(reminderPromises);
};