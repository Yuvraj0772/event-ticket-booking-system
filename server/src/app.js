
import express from "express";
import cors from "cors";
//import dotenv from "dotenv";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import redisClient, { connectRedis } from "./config/redis.js";

import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import showRoutes from "./routes/showRoutes.js";
import seatLockRoutes from "./routes/seatLockRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

//dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Redis test
app.get("/api/redis-test", async (req, res) => {
  try {
    await redisClient.set("shownest:test", "Redis is working!");
    const value = await redisClient.get("shownest:test");

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

// API routes
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seat-locks", seatLockRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Serve React production build
const clientDistPath = path.resolve(__dirname, "../../client/dist");

app.use(express.static(clientDistPath));

// React frontend fallback (Express 5)
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ShowNest server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();


