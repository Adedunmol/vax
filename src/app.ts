import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import { registerPlugins } from './utils/register-plugins'
import { errorSchemas } from './modules/errors/schema-base'
import userRoutes from './modules/user/user.route'
import { userSchemas } from './modules/user/user.schema'

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

  server.get('/healthcheck', async function() {

    return { status: 'OK' }
  });

  [...userSchemas, ...errorSchemas].forEach(schema => {
    server.addSchema(schema)
  })

  server.register(userRoutes, { prefix: 'api/v1/users' })

  return server
}

export default buildServer