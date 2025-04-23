import buildServer from './app'
import env from './env'
import { reminderJob } from './utils/cron-task'
import { logger } from './utils/logger'

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

async function gracefulShutdown({
    signal,
    server
}: {
    signal: typeof signals[number]
    server: Awaited<ReturnType<typeof buildServer>>
}) {
    logger.info(`got signal ${signal}`)
    await server.close()

    process.exit(0)
}

async function main() {
    const server = buildServer({
        logger: true
    })
    
    try {
       server.listen({ port: env.PORT, host: '0.0.0.0' })

       logger.info('server is running')

        signals.forEach(signal => {
            process.on(signal, () => gracefulShutdown({ signal, server }))
        })

        server.ready().then(() => {
            server.scheduler.addSimpleIntervalJob(reminderJob)
        })
    
    } catch (err) {
        server.log.error('error starting server')
        server.log.error(err)
        process.exit(1)
    }

}

main()