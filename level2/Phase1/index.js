import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import User from "./model/User.model.js";
import Redis from "ioredis";
import rateLimiter from "./middleware/rateLimit.js";
import sendEmail from "./lib/sendEmail.js";
import emailQueue from "./queue.js";
dotenv.config();

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());

export const redis = new Redis({
  host: "localhost",
  port: 6379,
});

app.get("/", rateLimiter, (req, res) => {
  return res.status(200).json({ message: "Hello from docker phase 2" });
});

app.post("/create", async (req, res) => {
  const { name, email, password } = req.body;
  await redis.del("user:all");
  const user = await User.create({
    name,
    email,
    password,
  });
  await emailQueue.add("sendEmail", { email });
  return res.json(user);
});

app.get("/user", async (req, res) => {
  const users = await User.find({});
  return res.json(users);
});

app.get("/delete", async (req, res) => {
  await User.deleteMany({});
  return res.json({ message: "deleted" });
});

app.get("/redis", async (req, res) => {
  const data = await redis.get("user:all");
  if (!data) {
    const user = await User.find({});
    await redis.set("user:all", JSON.stringify(user));
    return res.json(user);
  }
  return res.json(data);
});

app.post("/otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await redis.set(`otp:${email}`, otp, "EX", 30);

  return res.status(200).json({ otp });
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const cachedOtp = await redis.get(`otp:${email}`);
  if (!cachedOtp) {
    return res
      .status(400)
      .json({ message: "otp not found or has been deleted" });
  }
  if (cachedOtp !== otp) {
    return res.status(400).json({ message: "wrong" });
  }
  res.json({ message: "OTP verified" });
});

app.listen(port, () => {
  connectDB();
  console.log(`server started ${port}`);
});
