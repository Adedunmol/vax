import { FastifyRequest, FastifyError, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'

function errorHandler(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  let statusCode = 500;
  let message = "internal server error";

  if (err.code === "FST_ERR_VALIDATION") {
    statusCode = 400;
    message = "validation error";
    logger.info(err);
  } else {
    logger.error(err);
  }

  const response = {
    code: statusCode,
    message,
  };

  reply.code(statusCode).send(response);
}

export default errorHandler;
