import env from '../env';
import { emailQueue } from './email/producer'
import { Redis } from 'ioredis'
import { Queue } from 'bullmq'
import RedisMock from 'ioredis-mock'


const isTest = env.NODE_ENV === 'test';


const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
})

type queueName = 'emails' | 'invoices'

export const sendToQueue = async (queue: queueName, data: any) => {

    switch (queue) {
        case 'emails':
          // server.log.info('mail added to queue')
          await emailQueue.add('send-mail', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })
          break
    }
}

export default redis