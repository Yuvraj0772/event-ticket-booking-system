
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

// GET /api/bookings/my-bookings
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user.",
      });
    }

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        select: "startsAt venue pricePerSeat status event",
        populate: {
          path: "event",
          select: "title category city posterUrl",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch bookings.",
    });
  }
});
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


/* PATCH /api/bookings/:bookingId/cancel */
router.patch("/:bookingId/cancel", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { bookingId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending bookings can be cancelled.",
      });
    }

    if (booking.paymentStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Booking payment is not pending.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      booking: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
      },
    });
  } catch (error) {
    console.error("Cancel booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not cancel booking.",
    });
  }
});


/* GET /api/bookings/:bookingId */
router.get("/:bookingId", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { bookingId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
    }).populate({
      path: "show",
      select: "startsAt venue pricePerSeat status event",
      populate: {
        path: "event",
        select: "title category city posterUrl",
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Fetch booking details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch booking details.",
    });
  }
});



export default router;
