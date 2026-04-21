const express = require("express");
const dayjs = require("dayjs");
const Reservation = require("../models/Reservation");
const { requireAuth } = require("../middlewares/auth");
const { buildSlotsForDays, isWeekend, getWeekRange, toIso } = require("../utils/slots");

const router = express.Router();

function isSlotValid(slotStartIso) {
  const slotStart = dayjs(slotStartIso);
  if (!slotStart.isValid()) {
    return null;
  }

  const slots = buildSlotsForDays(30);
  const found = slots.find((s) => dayjs(s.slotStart).isSame(slotStart));
  return found || null;
}

router.get("/", requireAuth, async (_req, res) => {
  const slots = buildSlotsForDays(30);
  const from = slots[0].slotStart;
  const to = slots[slots.length - 1].slotEnd;

  const reservations = await Reservation.find({
    slotStart: { $gte: from, $lte: to },
  })
    .sort({ slotStart: 1 })
    .lean();

  res.json({
    slots: slots.map((slot) => ({
      slotStart: toIso(slot.slotStart),
      slotEnd: toIso(slot.slotEnd),
    })),
    reservations: reservations.map((r) => ({
      id: String(r._id),
      userId: String(r.userId),
      userName: r.userName,
      houseNumber: r.houseNumber,
      slotStart: toIso(r.slotStart),
      slotEnd: toIso(r.slotEnd),
    })),
  });
});

router.get("/active", requireAuth, async (_req, res) => {
  const now = new Date();
  const active = await Reservation.findOne({
    slotStart: { $lte: now },
    slotEnd: { $gt: now },
  }).lean();

  if (!active) {
    return res.json({ active: null });
  }

  return res.json({
    active: {
      userName: active.userName,
      houseNumber: active.houseNumber,
      slotStart: toIso(active.slotStart),
      slotEnd: toIso(active.slotEnd),
    },
  });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { slotStart } = req.body;
    const validatedSlot = isSlotValid(slotStart);
    if (!validatedSlot) {
      return res.status(400).json({ message: "Franja horaria no válida" });
    }

    const now = dayjs();
    const start = dayjs(validatedSlot.slotStart);
    const end = dayjs(validatedSlot.slotEnd);

    // Small grace window to avoid clock drift issues between client and server.
    if (start.add(1, "minute").isBefore(now)) {
      return res.status(400).json({
        message: "No puedes reservar una sesión que ya ha empezado o ha pasado",
      });
    }

    const exists = await Reservation.findOne({ slotStart: validatedSlot.slotStart }).lean();
    if (exists) {
      return res.status(409).json({ message: "Esta sesión ya está reservada" });
    }

    const week = getWeekRange(validatedSlot.slotStart);
    const weeklyReservations = await Reservation.find({
      userId: req.user.id,
      slotStart: { $gte: week.from, $lte: week.to },
    })
      .sort({ slotStart: 1 })
      .lean();

    if (weeklyReservations.length >= 4) {
      return res.status(400).json({ message: "Máximo 4 reservas por semana" });
    }

    const weekendCount = weeklyReservations.filter((r) => isWeekend(r.slotStart)).length;
    if (isWeekend(validatedSlot.slotStart) && weekendCount >= 1) {
      return res.status(400).json({ message: "Máximo 1 reserva en fin de semana" });
    }

    const consecutive = weeklyReservations.find((r) => {
      const existingStart = dayjs(r.slotStart);
      const existingEnd = dayjs(r.slotEnd);
      return existingEnd.isSame(start) || existingStart.isSame(end);
    });

    if (consecutive) {
      return res.status(400).json({
        message: "No puedes reservar dos sesiones seguidas",
      });
    }

    const reservation = await Reservation.create({
      userId: req.user.id,
      userName: req.user.name,
      houseNumber: req.user.houseNumber,
      slotStart: validatedSlot.slotStart,
      slotEnd: validatedSlot.slotEnd,
    });

    return res.status(201).json({
      reservation: {
        id: String(reservation._id),
        userName: reservation.userName,
        houseNumber: reservation.houseNumber,
        slotStart: toIso(reservation.slotStart),
        slotEnd: toIso(reservation.slotEnd),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Esta sesión ya está reservada" });
    }
    return res.status(500).json({ message: "Error al crear la reserva" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).lean();

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    if (String(reservation.userId) !== req.user.id) {
      return res.status(403).json({ message: "Solo puedes cancelar tus reservas" });
    }

    if (dayjs(reservation.slotStart).isBefore(dayjs())) {
      return res.status(400).json({
        message: "No puedes cancelar una sesión que ya ha empezado o pasado",
      });
    }

    await Reservation.deleteOne({ _id: reservation._id });
    return res.json({ ok: true });
  } catch (_error) {
    return res.status(500).json({ message: "Error al cancelar la reserva" });
  }
});

module.exports = router;
