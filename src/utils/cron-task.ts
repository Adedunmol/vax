import { AsyncTask, SimpleIntervalJob } from "toad-scheduler";
import { enqueueReminders } from "./reminder";
import { logger } from "./logger";


const reminderTask = new AsyncTask(
    'enqueue-reminder',
    () => { return enqueueReminders().then((result) => {
        logger.info('enqueued the tasks successfully')
    }) },
    (err) => {
        // might just retry by pushing the task to the redis queue
        logger.error(err)
    }
)
export const reminderJob = new SimpleIntervalJob({ seconds: 20, }, reminderTask)
