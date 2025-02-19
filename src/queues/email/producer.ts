import './worker'
import { Queue } from 'bullmq'
import { redisClient } from '..'

export const emailQueue = new Queue('emails', { connection: redisClient, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 } } })