function getAllowedHouseNumbers() {
  const raw = process.env.ALLOWED_HOUSE_NUMBERS || "";
  return raw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function isHouseAllowed(houseNumber) {
  const allowed = getAllowedHouseNumbers();
  if (allowed.length === 0) {
    return false;
  }
  return allowed.includes(String(houseNumber || "").trim().toUpperCase());
}

module.exports = {
  getAllowedHouseNumbers,
  isHouseAllowed,
};
