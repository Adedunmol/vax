import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'
import createInvoice from '../../utils/generate-invoice';
import { sendToQueue } from '..';

const invoiceWorker = new Worker('invoices', async job => {
    try {
        const { invoiceId } = job.data;
    
        // Generate the invoice
        const invoicePath = `/invoices/invoice_${invoiceId}.pdf`;
        await createInvoice (invoiceId, invoicePath);
    
        // Queue email job with invoice details
        await sendToQueue ('emails', { invoiceId, invoicePath });
    } catch (err: any) {
        console.error(err)
    }
}, { connection: getRedisClient() })

invoiceWorker.on('completed', job => {
    console.log(`${job.id} has completed`)
})

invoiceWorker.on('failed', (job, err) => {
    console.log(`${job!!.id} has failed due to ${err.message}`)
})