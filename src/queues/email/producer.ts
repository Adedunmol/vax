import './worker'
import { Queue } from 'bullmq'
import { server } from '../../index'

export const emailQueue = new Queue('emails', { connection: server.redis, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })