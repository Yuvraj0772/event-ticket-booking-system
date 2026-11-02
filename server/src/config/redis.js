
// import { createClient } from "redis";

// const redisClient = createClient({
//   url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
// });

// redisClient.on("error", (error) => {
//   console.error("Redis Client Error:", error.message);
// });

// export async function connectRedis() {
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }

//   console.log("Redis connected successfully");
// }

// export default redisClient;

import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        return new Error("Redis reconnection limit reached");
      }

      return Math.min(retries * 500, 3000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log("Redis connected successfully");
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error.message);
});

redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export default redisClient;
