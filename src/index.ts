import fastifyJwt from '@fastify/jwt'
import fastifyRedis from '@fastify/redis'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import buildServer from './app'
import env from './env'
import { errorSchemas } from './modules/errors/schema-base'
import userRoutes from './modules/user/user.route'
import { userSchemas } from './modules/user/user.schema'
import { FastifyReply, FastifyRequest } from 'fastify'
import { emailQueue } from './queues/email/producer'

export const server = buildServer({
    logger: true
})

const serverAdapter = new FastifyAdapter()

createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter
})

server.register(fastifyJwt, { secret: env.JWT_SECRET })
server.register(fastifyRedis, { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD })
server.register(serverAdapter.registerPlugin(), { prefix: '/bull-board', basePath: '/bull-board' })

server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
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
