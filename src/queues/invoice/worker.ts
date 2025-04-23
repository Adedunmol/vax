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
        const { userId, invoiceId, clientId } = job.data as InvoiceData;

        logger.info('generating invoice for: ', invoiceId)
        
        const reminderData = await ReminderService.getDetailedData(userId, clientId, invoiceId)

        if (!reminderData) throw new Error('error fetching reminder data for reminder')

        // Generate the invoice
        const data = {
            logoUrl: reminderData.settings?.customLogo || "", // settings.customLogo
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
        const result = await PDFInvoice.uploadToCloudinary(pdfBuffer, `invoice_${invoiceId}`);
    
        // Queue email job with invoice details
        await sendToQueue('emails', { invoiceId, invoiceUrl: result });
    } catch (err: any) {
        logger.error(err)
    }
}, { connection: getRedisClient() })

invoiceWorker.on('completed', job => {
    console.log(`${job.id} has completed`)
})

invoiceWorker.on('failed', (job, err) => {
    console.log(`${job!!.id} has failed due to ${err.message}`)
})