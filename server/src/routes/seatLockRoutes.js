
import express from "express";
import mongoose from "mongoose";
import redisClient from "../config/redis.js";
import Show from "../models/Show.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const LOCK_DURATION_SECONDS = 600;

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

router.post("/lock", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { showId, seatNumber } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unable to identify the authenticated user.",
      });
    }

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
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

    if (!isValidSeatNumber(seatNumber, show.totalSeats)) {
      return res.status(400).json({
        success: false,
        message: `Seat must be between S1 and S${show.totalSeats}.`,
      });
    }

    const key = `seat-lock:${showId}:${seatNumber}`;

    const result = await redisClient.set(key, String(userId), {
      NX: true,
      EX: LOCK_DURATION_SECONDS,
    });

    if (result !== "OK") {
      const currentOwner = await redisClient.get(key);

      if (currentOwner === String(userId)) {
        return res.status(200).json({
          success: true,
          message: "You already hold this seat lock.",
          showId,
          seatNumber,
          expiresInSeconds: await redisClient.ttl(key),
        });
      }

      return res.status(409).json({
        success: false,
        message: "This seat is temporarily locked by another user.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Seat temporarily locked.",
      showId,
      seatNumber,
      expiresInSeconds: LOCK_DURATION_SECONDS,
    });
  } catch (error) {
    console.error("Seat lock error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not lock seat.",
    });
  }
});

router.delete("/unlock", authMiddleware, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { showId, seatNumber } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unable to identify the authenticated user.",
      });
    }

    if (
      !mongoose.isValidObjectId(showId) ||
      typeof seatNumber !== "string" ||
      !/^S[1-9]\d*$/.test(seatNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid show ID and seat number.",
      });
    }

    const key = `seat-lock:${showId}:${seatNumber}`;

    // Delete only if this authenticated user owns the lock.
    const result = await redisClient.eval(
      `if redis.call("GET", KEYS[1]) == ARGV[1] then
         return redis.call("DEL", KEYS[1])
       else
         return 0
       end`,
      {
        keys: [key],
        arguments: [String(userId)],
      }
    );

    if (result === 0) {
      return res.status(409).json({
        success: false,
        message: "Lock not found or it belongs to another user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Seat lock released.",
      showId,
      seatNumber,
    });
  } catch (error) {
    console.error("Seat unlock error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not release seat lock.",
    });
  }
});

export default router;
