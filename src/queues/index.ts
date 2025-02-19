import env from '../env';
import { emailQueue } from './email/producer'
import { Redis } from 'ioredis'
import { Queue } from 'bullmq'
import RedisMock from 'ioredis-mock'


const isTest = env.NODE_ENV === 'test';

// const redisClient = isTest
//   ? new RedisMock()
//   : new Redis({
//       host: env.REDIS_HOST,
//       port: env.REDIS_PORT,
//       password: env.REDIS_PASSWORD,
//       maxRetriesPerRequest: null,
//     })

export const redisClient = new Redis({
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

// class JobQueue {
//   emailQueue: Queue

//   constructor(emailQueue: Queue) {
//     this.emailQueue = emailQueue
//   }

//   async sendToQueue (queue: queueName, data: any) {

//     switch (queue) {
//         case 'emails':
//           // server.log.info('mail added to queue')
//           await this.emailQueue.add('send-mail', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })
//           break
//     }
// }
// }

// export default new JobQueue(emailQueue)