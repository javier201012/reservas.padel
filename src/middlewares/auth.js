const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return res.status(401).json({ message: "Usuario inválido" });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      houseNumber: user.houseNumber,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Sesión inválida" });
  }
}

module.exports = { requireAuth };
