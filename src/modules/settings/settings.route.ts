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
                }
            }
        },
        getSettingsHandler
    )
    
    server.patch(
        '/update',
        { 
            schema: { 
                body: $ref('updateSettingsSchema'), 
                response: {
                    200: $ref('settingsResponse'),
                    400: $errorRef('errorSchema')
                },
                tags: ['settings']
            },
            preHandler: [server.authenticate]
        }, 
    updateSettingsHandler
    )
}

export default settingsRoutes