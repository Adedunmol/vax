import buildServer from './app'
import env from './env'

export const server = buildServer({
    logger: true
})


async function main() {

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
