import { FastifyInstance } from 'fastify'
import { $ref } from './settings.schema'
import { $errorRef } from '../../errors/schema-base'
import { getSettingsHandler, updateSettingsHandler } from './settings.controller'

async function settingsRoutes(server: FastifyInstance) {

    server.get(
        '/',
        {
            schema: {
                response: {
                    200: $ref('settingsResponse')
                },
                tags: ['settings']
            },
            preHandler: [server.authenticate]
        },
        getSettingsHandler
    )
    
    server.patch(
        '/update',
        {
          schema: {
            consumes: ['multipart/form-data'],
            // body: {
            //   type: 'object',
            //   properties: {
            //     custom_logo: {
            //       type: 'string',
            //       format: 'binary',
            //       description: 'The custom logo image (PNG, max 1MB)'
            //     },
            //     currency: {
            //       type: 'string',
            //       minLength: 3,
            //       maxLength: 3,
            //       description: '3-letter currency code (e.g., USD)'
            //     },
            //     notify_before: {
            //       type: 'integer',
            //       minimum: 0
            //     },
            //     recurrent_reminders: {
            //       type: 'boolean'
            //     },
            //     recurrent_interval: {
            //       type: 'integer',
            //       minimum: 0
            //     }
            //   }
            // },
            response: {
              200: $ref('settingsResponse'),
              400: $errorRef('errorSchema')
            },
            tags: ['settings']
          },
          preHandler: [server.authenticate]
        },
        updateSettingsHandler
      );
}

export default settingsRoutes