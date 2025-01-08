import buildServer from './app'
import env from './env'

export const server = buildServer({
    logger: true
})

async function main() {

    try {
        await server.listen({ port: env.PORT, host: '0.0.0.0' })

    } catch (err) {
        server.log.error('error starting server')
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