import { FastifyInstance } from 'fastify'
import { $ref } from './settings.schema'
import { $errorRef } from '../../errors/schema-base'
import { updateSettingsHandler } from './settings.controller'

async function settingsRoutes(server: FastifyInstance) {
    
    server.patch(
        '/update',
        { 
            schema: { 
                body: $ref('updateSettingsSchema'), 
                response: {
                    200: $ref('settingsResponse'),
                    400: $errorRef('errorSchema')
                }
            } 
        }, 
    updateSettingsHandler
    )
}

export default settingsRoutes