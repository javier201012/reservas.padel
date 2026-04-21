const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    houseNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    slotStart: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    slotEnd: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

reservationSchema.index({ slotStart: 1 }, { unique: true });
reservationSchema.index({ userId: 1, slotStart: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
