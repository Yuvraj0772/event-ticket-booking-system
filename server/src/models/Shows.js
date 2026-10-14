
import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerSeat: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

showSchema.index({ event: 1, startsAt: 1 });

const Show = mongoose.model("Show", showSchema);

export default Show;
