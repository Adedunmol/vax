import { FastifyReply, FastifyRequest } from 'fastify'
import SettingsService from './settings.service'
import { UpdateSettingsInput } from './settings.schema'
import PDFInvoice from '../../utils/generate-invoice'
import { logger } from '../../utils/logger'


export async function updateSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id;
        const parts = request.parts();
        const updateData: Partial<UpdateSettingsInput> = {};
        let customLogoUrl: string | undefined;

        for await (const part of parts) {
            if (part.type === 'file' && part.fieldname === 'custom_logo') {
                if (part.mimetype !== 'image/png') {
                return reply.code(400).send({
                    status: 'error',
                    message: 'Logo must be a PNG image.'
                });
                }

                const buffer = await part.toBuffer();

                if (buffer.length > 1 * 1024 * 1024) {
                    return reply.code(400).send({
                        status: 'error',
                        message: 'Logo must be under 1MB'
                    });
                }

                const filename = `user-${userId}-logo`;
                customLogoUrl = await PDFInvoice.uploadToCloudinary(buffer, filename, 'logos', 'png', 'png');

                logger.info(`custom logo url: ${customLogoUrl}`)

                updateData.custom_logo = customLogoUrl;
            } else if (part.type === 'field') {
                const key = part.fieldname as keyof UpdateSettingsInput;

                if (key === 'notify_before' || key === 'recurrent_interval') {
                    updateData[key] = Number(part.value);
                } else if (key === 'recurrent_reminders') {
                    updateData[key] = part.value === 'true';
                } else {
                    updateData[key] = part.value as string;
                }
            }
        }

        logger.info(`updateData:`)
        logger.info(updateData)

        const settings = await SettingsService.update(userId, updateData);

        return reply.code(200).send({
        status: 'success',
        message: 'User settings updated successfully',
        data: settings
        });
    } catch (err: any) {
      console.error(err);
      return reply.code(500).send({ status: 'error', message: err.message });
    }
}
  

export async function getSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const userId = request.user.id

        const settings = await SettingsService.get(userId)

        return reply.code(200).send({ status: 'success', message: 'User retrieved successfully', data: settings })
    } catch (err: any) {
        return reply.code(500).send(err)
    }
}