import { Worker } from 'bullmq'
import { getRedisClient } from '../redis'

const emailWorker = new Worker('emails', async job => {
    try {
        const { invoiceId, invoicePath } = job.data;
    
        // Send invoice via email
        // await sendEmailWithTemplates(invoiceId, invoicePath)
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