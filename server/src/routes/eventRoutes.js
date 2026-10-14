
import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message:
        statusCode === 400
          ? error.message
          : "Failed to create event",
    });
  }
});

export default router;
