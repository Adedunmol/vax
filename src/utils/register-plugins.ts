import { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyRedis from '@fastify/redis'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import { emailQueue } from '../queues/email/producer'
import env from '../env'


export async function registerPlugins(server: FastifyInstance) {

    const serverAdapter = new FastifyAdapter()

    createBullBoard({
      queues: [new BullMQAdapter(emailQueue)],
      serverAdapter
    })
  

    server.register(fastifyJwt, { secret: env.JWT_SECRET })
    server.register(fastifyRedis, { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD })
    server.register(serverAdapter.registerPlugin(), { prefix: '/bull-board', basePath: '/bull-board' })
    
}