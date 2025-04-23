import { AsyncTask, SimpleIntervalJob } from "toad-scheduler";


const reminderTask = new AsyncTask(
    'enqueue-reminder',
    () => { return new Promise(()=>({})).then((result) => { /* continue the promise chain */ }) },
    (err) => {
        // might just retry by pushing the task to the redis queue
        console.error(err)
    }
)
export const reminderJob = new SimpleIntervalJob({ seconds: 20, }, reminderTask)
