import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import Contact from "../models/Contact.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  subject: z.string().trim().min(2, "Subject required").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

router.post("/", contactLimiter, async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const doc = await Contact.create({
      ...parsed.data,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
    });
    res.status(201).json({
      success: true,
      message: "Message received. I'll get back to you soon!",
      id: doc._id,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const items = await Contact.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

export default router;
