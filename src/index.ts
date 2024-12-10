import buildServer from './app'

const server = buildServer({
    logger: true
})

async function main() {

    server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
        if (err) {
            server.log.error(err)
            process.exit(1)
        }
    })
}

['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        await server.close()
        process.exit(1)
    })
})

main()
