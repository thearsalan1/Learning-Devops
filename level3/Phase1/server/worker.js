import { Worker } from "bullmq";
import Redis from "ioredis";
import emailQueue from "./queue.js";
import sendEmail from "./lib/sendEmail.js";

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("job started");
    const email = job.data.email;
    await sendEmail(email);
    console.log("job completed");
  },
  { connection },
);
