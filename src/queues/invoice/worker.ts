import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'
import PDFInvoice from '../../utils/generate-invoice';
import { sendToQueue } from '..';
import { logger } from '../../utils/logger';
import ReminderService from '../../modules/reminder/reminder.service';

interface InvoiceData {
    invoiceId: number
    reminderId: number
    userId: number
    clientId: number
}

const invoiceWorker = new Worker('invoices', async job => {
    try {
        const { userId, invoiceId, clientId, reminderId } = job.data as InvoiceData;

        logger.info(`generating invoice for: ${invoiceId}`)
        
        const reminderData = await ReminderService.getDetailedData(userId, clientId, invoiceId)

        if (!reminderData) throw new Error('error fetching reminder data for reminder')

        // Generate the invoice
        const data = {
            logoUrl: reminderData.settings?.customLogo || "",
            businessName: reminderData.users.username,
            invoiceId: reminderData.invoices.id,
            invoiceDate: (new Date()).toDateString(),
            dueDate: (reminderData.invoices.dueDate!).toDateString(),
            client: {
                name: (reminderData.clients.firstName || '') + (reminderData.clients.lastName || ''), 
                email: reminderData.clients.email,
                address: "",
            },
            items: reminderData.invoices.items
        }
        const pdfBuffer = await PDFInvoice.generateInvoicePDF(data)
        const result = await PDFInvoice.uploadToCloudinary(pdfBuffer, `invoice_${invoiceId}`, 'invoices', 'pdf');
    
        const emailData = {
            template: 'reminder',
            locals: {
                username: reminderData.users.firstName,
                clientName: (reminderData.clients.firstName || '') + (reminderData.clients.lastName || ''),
                dueDate: (Number(reminderData.invoices.totalAmount || 0)) - (Number(reminderData.invoices.amountPaid || 0)),
                userEmail: reminderData.users.email,
                invoice: result,
                currency: reminderData.settings?.currency || '$'
            },
            to: reminderData.clients.email,
            invoiceId, 
            invoiceUrl: result, 
            isReminder: true, 
            reminderId
        }

        logger.info('emailData: ')
        logger.info(emailData)

        // Queue email job with invoice details
        await sendToQueue('emails', emailData);
    } catch (err: any) {
        logger.info('error generating invoice: ')
        logger.error(err)
    }
}, { connection: getRedisClient() })

invoiceWorker.on('completed', job => {
    logger.info(`invoice task ${job.id} has completed`)
})

invoiceWorker.on('failed', (job, err) => {
    logger.info(`invoice task ${job!!.id} has failed due to ${err.message}`)
})