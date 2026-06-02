import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

import contactRouter from "../routes/contact.js";
import { errorHandler } from "../middleware/errorHandler.js";

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

// Connect MongoDB once
let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(MONGODB_URI);
  isConnected = true;

  console.log("✅ MongoDB connected");
}

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
  });
});

app.use("/api/contact", contactRouter);

app.use(errorHandler);

export default app;