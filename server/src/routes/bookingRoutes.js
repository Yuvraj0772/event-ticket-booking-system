
import express from "express";
import mongoose from "mongoose";
import redisClient from "../config/redis.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

function getUserId(req) {
  const user = req.user;
  return user?.userId || user?.id || user?._id || user?.sub || null;
}

function isValidSeatNumber(seatNumber, totalSeats) {
  if (typeof seatNumber !== "string") return false;

  const match = /^S([1-9]\d*)$/.exec(seatNumber);
  if (!match) return false;

  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number <= totalSeats;
}

// POST /api/bookings
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { showId, seats } = req.body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    if (
      !Array.isArray(seats) ||
      seats.length === 0 ||
      seats.some((seat) => typeof seat !== "string") ||
      new Set(seats).size !== seats.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a non-empty list of unique seats.",
      });
    }

    const show = await Show.findOne({
      _id: showId,
      status: "scheduled",
      startsAt: { $gt: new Date() },
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Upcoming scheduled show not found.",
      });
    }

    if (
      !seats.every((seat) =>
        isValidSeatNumber(seat, show.totalSeats)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Seats must be between S1 and S${show.totalSeats}.`,
      });
    }

    // Every requested seat must be locked by this user.
    for (const seat of seats) {
      const lockKey = `seat-lock:${showId}:${seat}`;
      const lockOwner = await redisClient.get(lockKey);

      if (lockOwner !== String(userId)) {
        return res.status(409).json({
          success: false,
          message: `${seat} is not locked by you, or its lock has expired.`,
        });
      }
    }

    // Don't allow seats already held by an existing booking.
    const existingBooking = await Booking.findOne({
      show: showId,
      seats: { $in: seats },
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "One or more seats already have a pending or confirmed booking.",
      });
    }

    // Always calculate the price on the server.
    const totalAmount = show.pricePerSeat * seats.length;

    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats,
      totalAmount,
      status: "pending",
      paymentStatus: "pending",
    });

    // Release locks only when this booking has been created.
    // Pending bookings now prevent these seats being booked again.
    for (const seat of seats) {
      const lockKey = `seat-lock:${showId}:${seat}`;

      await redisClient.eval(
        `if redis.call("GET", KEYS[1]) == ARGV[1] then
           return redis.call("DEL", KEYS[1])
         else
           return 0
         end`,
        {
          keys: [lockKey],
          arguments: [String(userId)],
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Booking created. Payment is pending.",
      booking: {
        id: booking._id,
        showId: booking.show,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create booking.",
    });
  }
});

export default router;
