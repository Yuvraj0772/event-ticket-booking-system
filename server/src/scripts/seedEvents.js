
import "dotenv/config";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import Show from "../models/Show.js";

const events = [
  {
    title: "Indore Music Festival",
    description: "An evening of live music and performances.",
    category: "Concert",
    venue: "Phoenix Citadel",
    city: "Indore",
    startingPrice: 499,
    posterUrl: "",
  },
  {
    title: "Comedy Night Indore",
    description: "A live stand-up comedy experience.",
    category: "Theatre",
    venue: "C21 Mall",
    city: "Indore",
    startingPrice: 299,
    posterUrl: "",
  },
  {
    title: "Indore Sports Championship",
    description: "An exciting live sports event.",
    category: "Sports",
    venue: "Holkar Stadium",
    city: "Indore",
    startingPrice: 399,
    posterUrl: "",
  },
  {
    title: "Indore Theatre Evening",
    description: "A special evening of live stage performances.",
    category: "Theatre",
    venue: "Ravindra Natya Grah",
    city: "Indore",
    startingPrice: 249,
    posterUrl: "",
  },
  {
    title: "Movie Night Indore",
    description: "Enjoy a movie on the big screen.",
    category: "Movie",
    venue: "INOX C21",
    city: "Indore",
    startingPrice: 199,
    posterUrl: "",
  },
];

async function seedEvents() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/event_ticket_booking"
    );

    const now = new Date();
    let createdEvents = 0;
    let createdShows = 0;

    for (let i = 0; i < events.length; i++) {
      const eventData = events[i];

      let event = await Event.findOne({ title: eventData.title });

      if (!event) {
        event = await Event.create({
          ...eventData,
          isActive: true,
        });
        createdEvents++;
      }

      // Two showtimes per event, on different future dates.
      const showDates = [
        new Date(now.getTime() + (7 + i * 7) * 24 * 60 * 60 * 1000),
        new Date(now.getTime() + (14 + i * 7) * 24 * 60 * 60 * 1000),
      ];

      for (let j = 0; j < showDates.length; j++) {
        const startsAt = new Date(showDates[j]);
        startsAt.setHours(j === 0 ? 18 : 20, 0, 0, 0);

        const existingShow = await Show.findOne({
          event: event._id,
          startsAt,
        });

        if (!existingShow) {
          await Show.create({
            event: event._id,
            startsAt,
            venue: eventData.venue,
            totalSeats: 40,
            pricePerSeat: eventData.startingPrice,
            status: "scheduled",
          });
          createdShows++;
        }
      }

      console.log(`Processed event: ${event.title}`);
    }

    console.log(`Created events: ${createdEvents}`);
    console.log(`Created showtimes: ${createdShows}`);
    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedEvents();
