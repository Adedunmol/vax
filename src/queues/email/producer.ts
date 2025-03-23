import './worker'
import { Queue } from 'bullmq'
import { getRedisClient } from '../redis'

export const emailQueue = new Queue('emails', { connection: getRedisClient(), defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })

export default emailQueue