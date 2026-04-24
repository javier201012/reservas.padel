const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { isHouseAllowed } = require("../utils/allowedHouses");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

function getCookieOptions() {
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : sameSite === "none";

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });
}

function setAuthCookie(res, token) {
  res.cookie("token", token, getCookieOptions());
}

router.post("/register", async (req, res) => {
  try {
    const { email, name, houseNumber, password } = req.body;
    if (!email || !name || !houseNumber || !password) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const normalizedHouse = String(houseNumber).trim().toUpperCase();
    if (!isHouseAllowed(normalizedHouse)) {
      return res.status(400).json({
        message: "Número de casa no autorizado",
      });
    }

    const existing = await User.findOne({ houseNumber: normalizedHouse }).lean();
    if (existing) {
      return res.status(409).json({
        message: "Ya existe una cuenta para ese número de casa",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      name,
      houseNumber: normalizedHouse,
      passwordHash,
    });

    const token = createToken(user._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        houseNumber: user.houseNumber,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ya existe una cuenta para ese número de casa",
      });
    }
    return res.status(500).json({ message: "Error interno al registrar usuario" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { houseNumber, password } = req.body;
    if (!houseNumber || !password) {
      return res.status(400).json({ message: "Debes enviar casa y contraseña" });
    }

    const normalizedHouse = String(houseNumber).trim().toUpperCase();
    const user = await User.findOne({ houseNumber: normalizedHouse });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = createToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        houseNumber: user.houseNumber,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error interno al iniciar sesión" });
  }
});

router.post("/logout", (_req, res) => {
  const { maxAge: _maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie("token", clearOptions);
  return res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
