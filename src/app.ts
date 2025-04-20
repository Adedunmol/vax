import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { registerPlugins } from './utils/register-plugins'
import { errorSchemas } from './errors/schema-base'
import userRoutes from './modules/user/user.route'
import { userSchemas } from './modules/user/user.schema'
import { settingsSchemas } from './modules/settings/settings.schema'
import { reminderSchemas } from './modules/reminder/reminder.schema'
import { paymentSchemas } from './modules/payment/payment.schema'
import { invoiceSchemas } from './modules/invoice/invoice.schema'
import { expenseSchemas } from './modules/expenses/expenses.schema'
import { clientSchemas } from './modules/client/client.schema'
import { analyticsSchemas } from './modules/analytics/analytics.schema'
import { JWT } from '@fastify/jwt'
import { FastifyRedis } from '@fastify/redis'

declare module 'fastify' {
  interface FastifyRequest {
    jwt: JWT
    redis: FastifyRedis
  }

  export interface FastifyInstance {
    authenticate: any
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: number;
      email: string;
    };
  }
}

const buildServer = (opts={}) => {

  const server = Fastify(opts)

  registerPlugins(server)

  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        return reply.send(err)
    }
  })

  server.get('/healthcheck', async () => {

    return { status: 'OK' }
  });

  server.addHook("preHandler", (req, reply, next) => {
    req.jwt = server.jwt
    return next()
  });
  
  [
    ...userSchemas, 
    ...analyticsSchemas, 
    ...clientSchemas,
    ...invoiceSchemas,
    ...expenseSchemas,
    ...paymentSchemas,
    ...reminderSchemas,
    ...settingsSchemas,
    ...errorSchemas
  ].forEach(schema => {
    server.addSchema(schema)
  })

  return server
}

export default buildServer