require("dotenv").config();
const http = require("http");
const { app } = require("./src/app");
const { initializeBackend } = require("./src/bootstrap");

const PORT = Number(process.env.API_PORT || 4000);
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

initializeBackend()
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
  });
