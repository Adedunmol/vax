import fastifyJwt from '@fastify/jwt'
import buildServer from './app'
import env from './env'
import { errorSchemas } from './modules/errors/schema-base'
import userRoutes from './modules/user/user.route'
import { userSchemas } from './modules/user/user.schema'
import { FastifyReply, FastifyRequest } from 'fastify'

export const server = buildServer({
    logger: true
})

server.register(fastifyJwt, { secret: env.JWT_SECRET })

server.decorate('authenticate', async (request: FastifyRequest, reply :FastifyReply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        return reply.send(err)
    }
})

server.get('/healthcheck', async function() {

    return { status: 'OK' }
})

async function main() {

    [...userSchemas, ...errorSchemas].forEach(schema => {
        server.addSchema(schema)
    })

    server.register(userRoutes, { prefix: 'api/v1/users' })

    try {
        await server.listen({ port: env.PORT, host: '0.0.0.0' })

        server.log.info(`Server ready at http://localhost:${env.PORT}`)
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }

}

['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        await server.close()
        process.exit(1)
    })
})

main()
