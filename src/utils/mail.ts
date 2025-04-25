import path from 'path'
import Email from "email-templates"
import env from '../env'
import { logger } from './logger'


export const sendMailWithTemplates = async (template: string, locals: any,  to: string) => {
    try {
        // server.log.info('from send mail with templates: ', invoicePath)
        const email = new Email({
            message: {
              from: env.EMAIL_FROM,
            //   attachments: invoicePath ? [{ path: invoicePath, contentType: 'application/pdf', filename: `${invoiceId}.pdf`}] : []
            },
            send: true,
            preview: false,
            transport: {
                host: env.EMAIL_HOST,
                port: env.EMAIL_PORT,
                auth: {
                user: env.EMAIL_USERNAME,
                pass: env.EMAIL_PASSWORD
              }
            },
        })

        await email.send({ 
            template: path.join(__dirname, '..', 'emails', template), 
            message: { to }, 
            locals,
        })
        
        logger.info(`email sent to ${to}`)
    } catch (err: any) {
        logger.error(`unable send mail to: ${to}`)
        logger.error(err)
    }
}