require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./src/db");
const { seedDemoUsers } = require("./src/seedDemoUsers");
const authRoutes = require("./src/routes/authRoutes");
const reservationRoutes = require("./src/routes/reservationRoutes");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        origin === process.env.FRONTEND_ORIGIN ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const PORT = Number(process.env.API_PORT || 4000);
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

connectDB()
  .then(async (connected) => {
    if (!connected) {
      console.warn("MongoDB no configurado todavía. Rellena MONGODB_URI en .env.");
      return;
    }
    console.log("Conectado a MongoDB");
    await seedDemoUsers();
  })
  .catch((error) => {
    console.error("No se pudo conectar a MongoDB:", error.message);
  });
