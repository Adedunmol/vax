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
import invoicesRoutes from '../modules/invoice/invoice.route'
import expensesRoutes from '../modules/expenses/expenses.route'
import analyticsRoutes from '../modules/analytics/analytics.route'
import clientsRoutes from '../modules/client/client.route'
import remindersRoutes from '../modules/reminder/reminder.route'
import settingsRoutes from '../modules/settings/settings.route'
import errorHandler from '../middlewares/error'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyCompress from '@fastify/compress'
import fastifyGracefulShutdown from 'fastify-graceful-shutdown'


export async function registerPlugins(server: FastifyInstance) {

  const serverAdapter = new FastifyAdapter()

  await server.register(fastifyCors);
  await server.register(fastifyHelmet);
  await server.register(fastifyCompress);
  // await server.register(fastifyGracefulShutdown);
  
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
          description: `|
          The **Freelancer Invoicing API** enables freelancers and independent professionals to efficiently manage client billing and invoices.
      
          This API provides endpoints to:
          - Create and manage invoices with line items, due dates, and notes
          - Send invoices via email with retry and scheduling support
          - Track invoice status (e.g., sent, paid, overdue)
          - Manage client profiles and billing information
          - Automate recurring invoices for long-term engagements
          - Generate downloadable invoice PDFs
      
          Built with **Fastify** and **TypeScript**, this API is optimized for performance and validation. Background tasks like email delivery and PDF generation are handled with **Redis** and **BullMQ** queues.
      
          Use this API to integrate invoicing functionality into freelance platforms, dashboards, or financial tooling.
          `,
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

  server.setErrorHandler(errorHandler)
}