import Fastify from 'fastify'

const buildServer = (opts={}) => {

  const app = Fastify(opts)

  return app
}

export default buildServer