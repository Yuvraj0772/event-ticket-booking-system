
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Movie", "Concert", "Sports", "Theatre", "Other"],
    },
    venue: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    posterUrl: {
      type: String,
      default: "",
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
