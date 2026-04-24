const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const netlifyOrigins = [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]
    .map((origin) => String(origin || "").trim())
    .filter(Boolean);

  return [...new Set([...configuredOrigins, ...netlifyOrigins])];
}

function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(express.json());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
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

  return app;
}

const app = createApp();

module.exports = { app, createApp };