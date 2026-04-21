const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    houseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ houseNumber: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
