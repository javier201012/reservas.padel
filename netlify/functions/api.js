const serverless = require("serverless-http");
const { app } = require("../../src/app");
const { initializeBackend } = require("../../src/bootstrap");

const expressHandler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await initializeBackend();
  } catch (error) {
    console.error("No se pudo inicializar el backend serverless:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "No se pudo inicializar el backend" }),
    };
  }

  return expressHandler(event, context);
};