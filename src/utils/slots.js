const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");

dayjs.extend(isoWeek);

const SLOT_WINDOWS = [
  { start: "09:00", end: "10:30" },
  { start: "10:30", end: "12:00" },
  { start: "12:00", end: "13:30" },
  { start: "17:00", end: "18:30" },
  { start: "18:30", end: "20:00" },
  { start: "20:00", end: "21:30" },
];

function buildSlotsForDays(days = 30) {
  const result = [];
  const startOfToday = dayjs().startOf("day");

  for (let i = 0; i < days; i += 1) {
    const currentDay = startOfToday.add(i, "day");

    for (const window of SLOT_WINDOWS) {
      const [startHour, startMinute] = window.start.split(":").map(Number);
      const [endHour, endMinute] = window.end.split(":").map(Number);

      const slotStart = currentDay.hour(startHour).minute(startMinute).second(0).millisecond(0);
      const slotEnd = currentDay.hour(endHour).minute(endMinute).second(0).millisecond(0);

      result.push({
        slotStart: slotStart.toDate(),
        slotEnd: slotEnd.toDate(),
      });
    }
  }

  return result;
}

function isWeekend(date) {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
}

function getWeekRange(date) {
  const d = dayjs(date);
  return {
    from: d.startOf("isoWeek").toDate(),
    to: d.endOf("isoWeek").toDate(),
  };
}

function toIso(date) {
  return dayjs(date).toISOString();
}

module.exports = {
  SLOT_WINDOWS,
  buildSlotsForDays,
  isWeekend,
  getWeekRange,
  toIso,
};
