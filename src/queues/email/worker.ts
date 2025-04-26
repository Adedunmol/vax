import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'
import db from '../../db';
import { reminders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { sendMailWithTemplates } from '../../utils/mail'

const emailWorker = new Worker('emails', async job => {
    try {
        const emailData = job.data;
        
        logger.info(emailData)
        logger.info(`sending mail to: ${emailData.to}`)

        await sendMailWithTemplates(emailData.template, emailData.locals, emailData.to)

        if (emailData.isReminder) {
            await db.update(reminders).set({ reminderStatus: 'sent' }).where(eq(reminders.id, emailData.reminderId)) // reminder.id
        }

    } catch (err: any) {
        logger.error('error sending mail from email worker')
        logger.error(err)
    }
}, { connection: getRedisClient() })

emailWorker.on('completed', job => {
    logger.info(`email task ${job.id} has completed`)
})

emailWorker.on('failed', (job, err) => {
    logger.info(`email task${job!!.id} has failed due to ${err.message}`)
})