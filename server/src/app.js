
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import redisClient, { connectRedis } from "./config/redis.js";
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import seatLockRoutes from "./routes/seatLockRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.get("/api/redis-test", async (req, res) => {
  try {
    await redisClient.set("day6:test", "Redis is working!");
    const value = await redisClient.get("day6:test");

    res.status(200).json({
      success: true,
      message: value,
    });
  } catch (error) {
    console.error("Redis test failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Redis test failed",
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Event Ticket Booking API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/bookings", bookingRoutes);

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();

