import Fastify, { FastifyRequest, FastifyError, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'

function errorHandler(err: any, req: FastifyRequest, reply: FastifyReply) {
  let statusCode = 500;
  let message = "internal server error hmm";
  let status = "error"

  if (err instanceof Fastify.errorCodes.FST_ERR_VALIDATION || err.code === 'FST_ERR_VALIDATION') {
    statusCode = 400;
    status = 'validation error'
    message = err.message;
    logger.info({
      type: 'ValidationError',
      message: err.message,
      validation: err.validation, // array of validation issues
      context: err.validationContext,
      url: req.raw.url,
      method: req.raw.method,
    });
    } else {
    logger.error(err);
  }

  const response = {
    // statusCode,
    status,
    message,
  };

  reply.code(statusCode).send(response);
}

export default errorHandler;
