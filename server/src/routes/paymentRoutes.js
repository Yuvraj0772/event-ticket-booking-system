
import express from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

function getUserId(req) {
  const user = req.user;
  return user?.userId || user?.id || user?._id || user?.sub || null;
}

// POST /api/payments/:bookingId
router.post("/:bookingId", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { bookingId } = req.params;
    const { outcome } = req.body;

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

    if (!["success", "failed"].includes(outcome)) {
      return res.status(400).json({
        success: false,
        message: "Outcome must be success or failed.",
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

    if (
      booking.status !== "pending" ||
      booking.paymentStatus !== "pending"
    ) {
      return res.status(409).json({
        success: false,
        message: "Booking is not eligible for payment.",
      });
    }

    if (outcome === "success") {
      booking.status = "confirmed";
      booking.paymentStatus = "success";
    } else {
      booking.status = "failed";
      booking.paymentStatus = "failed";
    }

    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        outcome === "success"
          ? "Mock payment successful. Booking confirmed."
          : "Mock payment failed. Booking marked as failed.",
      booking: {
        id: booking._id,
        seats: booking.seats,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not process mock payment.",
    });
  }
});

export default router;
