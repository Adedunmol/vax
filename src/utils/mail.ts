import path from 'path'
import Email from "email-templates"
import env from '../env'


export const sendMailWithTemplates = async (template: string, locals: any,  to: string, invoicePath?: string, invoiceId?: string) => {
    try {
        // server.log.info('from send mail with templates: ', invoicePath)
        const email = new Email({
            message: {
              from: env.EMAIL_FROM,
              attachments: invoicePath ? [{ path: invoicePath, contentType: 'application/pdf', filename: `${invoiceId}.pdf`}] : []
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
        // server.log.info(`email sent to ${to}`)
    } catch (err: any) {
        // server.log.error(`unable send mail to: ${to}`)
        // server.log.error(err)
    }
}