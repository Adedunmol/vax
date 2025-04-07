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
import userRoutes from '../modules/user/user.route'
import paymentsRoutes from '../modules/payment/payment.route'
import invoicesRoutes from '../modules/payment/payment.route'
import expensesRoutes from '../modules/expenses/expenses.route'
import analyticsRoutes from '../modules/analytics/analytics.route'
import clientsRoutes from '../modules/client/client.route'
import remindersRoutes from '../modules/reminder/reminder.route'
import settingsRoutes from '../modules/settings/settings.route'


export async function registerPlugins(server: FastifyInstance) {

  const serverAdapter = new FastifyAdapter()
  
  await server.register(fastifyJwt, { secret: env.JWT_SECRET })
    createBullBoard({
      queues: [new BullMQAdapter(emailQueue)],
      serverAdapter
  })

  server.addHook('preHandler', (req, reply, next) => {
    req.jwt = server.jwt
    return next()
  })

  await server.register(fastifyRedis, { client: getRedisClient(), closeClient: true })
  
  await server.register(serverAdapter.registerPlugin(), { prefix: '/bull-board', basePath: '/bull-board' })
  
  await server.register(
    swagger, 
    withRefResolver({ 
      openapi: {
        info: {
          title: 'Vax',
          description: 'An invoicing API for freelancers',
          version    
        }
      }
    })
  )
  await server.register(swaggerUI, {
    routePrefix: '/docs',
    staticCSP: true
  })

  server.register(userRoutes, { prefix: 'api/v1/users' })
  server.register(analyticsRoutes, { prefix: 'api/v1/analytics' })
  server.register(clientsRoutes, { prefix: 'api/v1/clients' })
  server.register(expensesRoutes, { prefix: 'api/v1/expenses' })
  server.register(paymentsRoutes, { prefix: 'api/v1/payments' })
  server.register(invoicesRoutes, { prefix: 'api/v1/invoices' })
  server.register(remindersRoutes, { prefix: 'api/v1/reminders' })
  server.register(settingsRoutes, { prefix: 'api/v1/settings' })

  await server.register(fastifyCookie, {
    secret: 'your-secret-key',
    // hook: 'onRequest',
  })
}