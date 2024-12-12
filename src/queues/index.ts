import { server } from '..'
import { emailQueue } from './email/producer'

type queueName = 'emails' | 'invoices'

export const sendToQueue = async (queue: queueName, data: any) => {

    switch (queue) {
        case 'emails':
            server.log.info('mail added to queue')
            await emailQueue.add('send-mail', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })
            break
    }
}