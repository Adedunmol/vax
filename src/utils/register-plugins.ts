import { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyRedis from '@fastify/redis'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { withRefResolver } from 'fastify-zod'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import { emailQueue } from '../queues/email/producer'
import env from '../env'
import { version } from '../../package.json'


export async function registerPlugins(server: FastifyInstance) {

  const serverAdapter = new FastifyAdapter()

  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter
  })
  

  server.register(fastifyJwt, { secret: env.JWT_SECRET })
  server.register(fastifyRedis, { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD })
  server.register(serverAdapter.registerPlugin(), { prefix: '/bull-board', basePath: '/bull-board' })
  
  server.register(
    swagger, 
    withRefResolver({ 
      openapi: {
        info: {
          title: 'Vax',
          description: 'Invoicing api',
          version    
        }
      }
    })
  )
  server.register(swaggerUI, {
    routePrefix: '/docs',
    staticCSP: true
  })
}