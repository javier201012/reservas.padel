const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    return false;
  }

  await mongoose.connect(mongoUri);
  return true;
}

module.exports = { connectDB };
