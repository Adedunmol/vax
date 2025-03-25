import { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyRedis from '@fastify/redis'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { withRefResolver } from 'fastify-zod'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import env from '../env'
import { version } from '../../package.json'
import { getRedisClient } from '../queues/redis'
import emailQueue from '../queues/email/producer'
import fastifyCookie from '@fastify/cookie'


export async function registerPlugins(server: FastifyInstance) {

  const serverAdapter = new FastifyAdapter()
  
  await server.register(fastifyJwt, { secret: env.JWT_SECRET })
  createBullBoard({
      queues: [new BullMQAdapter(emailQueue)],
      serverAdapter
    })

  await server.register(fastifyRedis, { client: getRedisClient(), closeClient: true })
  
  await server.register(serverAdapter.registerPlugin(), { prefix: '/bull-board', basePath: '/bull-board' })
  
  await server.register(
    swagger, 
    withRefResolver({ 
      openapi: {
        info: {
          title: 'Vax',
          description: 'An invoicing api for freelancers',
          version    
        }
      }
    })
  )
  await server.register(swaggerUI, {
    routePrefix: '/docs',
    staticCSP: true
  })

  await server.register(fastifyCookie, {
    secret: 'your-secret-key',
    hook: 'onRequest',
  })
}