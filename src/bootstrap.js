const { connectDB } = require("./db");
const { seedDemoUsers } = require("./seedDemoUsers");

let initializationPromise;

async function initializeBackend() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const connected = await connectDB();

      if (!connected) {
        console.warn("MongoDB no configurado todavía. Rellena MONGODB_URI en .env.");
        return false;
      }

      console.log("Conectado a MongoDB");
      await seedDemoUsers();
      return true;
    })().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
}

module.exports = { initializeBackend };