import { Worker } from 'bullmq'
import { server } from '../../index'
import redis from '..'

const emailWorker = new Worker('emails', async job => {
    try {
        server.log.info(job.data)

        const emailData = job.data
        server.log.info(`Sending mail to ${emailData.to}`)
    } catch (err: any) {
        server.log.error('error sending mail from email worker', err)
    }
}, { connection: redis })

emailWorker.on('completed', job => {
    server.log.info(`${job.id} has completed`)
})

emailWorker.on('failed', (job, err) => {
    server.log.info(`${job!!.id} has failed due to ${err.message}`)
})