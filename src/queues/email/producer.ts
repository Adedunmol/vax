import './worker'
import { Queue } from 'bullmq'
import redis from '..'

export const emailQueue = new Queue('emails', { connection: redis, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })