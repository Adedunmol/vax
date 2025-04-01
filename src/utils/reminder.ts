import ReminderService from "../modules/reminder/reminder.service"
import { sendToQueue } from "../queues"

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
            }

        } catch (error) {
            console.error(`Failed to enqueue reminder for ${reminder.client.email}:`, error);
        }
    });

    await Promise.all(reminderPromises);
};