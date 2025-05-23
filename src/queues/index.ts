import { emailQueue } from './email/producer';
import invoiceQueue from './invoice/producer';

type QueueName = 'emails' | 'invoices';

export const sendToQueue = async (queue: QueueName, data: any) => {
  switch (queue) {
    case 'emails':
      await emailQueue.add('send-mail', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      break;
    case 'invoices':
      await invoiceQueue.add('generate-invoice', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
      break;
  }
};
