import fastify, { FastifyHttp2SecureOptions } from 'fastify'

const buildServer = (opts={}) => {

  const app = fastify(opts)


  return app
}

export default buildServer