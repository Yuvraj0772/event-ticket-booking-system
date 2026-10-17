
import express from "express";
import mongoose from "mongoose";
import Show from "../models/Show.js";
import Event from "../models/Event.js";

const router = express.Router();

// Get all scheduled shows for a specific event
router.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const shows = await Show.find({
      event: eventId,
      status: "scheduled",
      startsAt: { $gte: new Date() },
    }).sort({ startsAt: 1 });

    return res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    console.error("Fetch shows error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shows.",
    });
  }
});

// Create a show for an event (development endpoint)
router.post("/", async (req, res) => {
  try {
    const {
      event,
      startsAt,
      venue,
      totalSeats,
      pricePerSeat,
    } = req.body;

    if (
      !mongoose.isValidObjectId(event) ||
      typeof startsAt !== "string" ||
      !Number.isFinite(Date.parse(startsAt)) ||
      !venue?.trim() ||
      !Number.isInteger(totalSeats) ||
      totalSeats < 1 ||
      !Number.isFinite(pricePerSeat) ||
      pricePerSeat < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid event, date, venue, seat count, and price.",
      });
    }

    const eventExists = await Event.exists({
      _id: event,
      isActive: true,
    });

    if (!eventExists) {
      return res.status(404).json({
        success: false,
        message: "Active event not found.",
      });
    }

    const show = await Show.create({
      event,
      startsAt: new Date(startsAt),
      venue: venue.trim(),
      totalSeats,
      pricePerSeat,
    });

    return res.status(201).json({
      success: true,
      show,
    });
  } catch (error) {
    console.error("Create show error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create show.",
    });
  }
});

export default router;
