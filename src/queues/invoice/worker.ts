import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'
import PDFInvoice from '../../utils/generate-invoice';
import { sendToQueue } from '..';

const invoiceWorker = new Worker('invoices', async job => {
    try {
        const { invoiceId } = job.data;
    
        // Generate the invoice
        // const invoicePath = `/invoices/invoice_${invoiceId}.pdf`;
        // await createInvoice(invoiceId, invoicePath);
        const data = {
            logoUrl: "", // settings.customLogo
            businessName: "", // user.username
            invoiceId,
            invoiceDate: (new Date()).toDateString(),
            dueDate: (new Date()).toDateString(), // invoice.dueDate
            client: {
                name: "", // client.firstName + client.lastName
                email: "", //client.email
                address: "",
            },
            items: [{  units: 1, description: "", rate: 10, total: 10}]
        }
        const pdfBuffer = await PDFInvoice.generateInvoicePDF(data)
        const result = await PDFInvoice.uploadToCloudinary(pdfBuffer, `invoice_${invoiceId}`);
    
        // Queue email job with invoice details
        await sendToQueue('emails', { invoiceId, invoiceUrl: result });
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