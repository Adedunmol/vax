import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'
import db from '../../db';
import { reminders } from '../../db/schema';
import { eq } from 'drizzle-orm';

const emailWorker = new Worker('emails', async job => {
    try {
        const { invoiceId, invoicePath, isReminder } = job.data;
    
        // Send invoice via email
        // await sendEmailWithTemplates(invoiceId, invoicePath)

        if (isReminder) {
            await db.update(reminders).set({ reminderStatus: 'sent' }).where(eq(reminders.id, 1)) // reminder.id
        }
    } catch (err: any) {
        console.error('error sending mail from email worker', err)
    }
}, { connection: getRedisClient() })

emailWorker.on('completed', job => {
    console.log(`${job.id} has completed`)
})

emailWorker.on('failed', (job, err) => {
    console.log(`${job!!.id} has failed due to ${err.message}`)
})