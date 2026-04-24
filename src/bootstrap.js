const { connectDB } = require("./db");
const { seedDemoUsers } = require("./seedDemoUsers");

let initializationPromise;

function getInitializationErrorMessage(error) {
  if (!process.env.MONGODB_URI) {
    return "Falta configurar MONGODB_URI";
  }

  return error && error.message
    ? `MongoDB no disponible: ${error.message}`
    : "No se pudo conectar a MongoDB";
}

async function initializeBackend() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const connected = await connectDB();

      if (!connected) {
        throw new Error("Falta configurar MONGODB_URI");
      }

      console.log("Conectado a MongoDB");
      await seedDemoUsers();
      return true;
    })().catch((error) => {
      initializationPromise = undefined;
      throw new Error(getInitializationErrorMessage(error));
    });
  }

  return initializationPromise;
}

module.exports = { initializeBackend, getInitializationErrorMessage };